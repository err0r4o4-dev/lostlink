package report

import (
	"context"
	"crypto/sha256"
	"encoding/json"
	"errors"
	"io"
	"regexp"
	"strings"
	"time"
	"unicode/utf8"

	objectstorage "github.com/err0r4o4-dev/lostlink/apps/api/internal/storage"
)

var uuidPattern = regexp.MustCompile(`^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$`)

type Store interface {
	Create(context.Context, string, string, [32]byte, CreateInput) (Report, error)
	ByID(context.Context, string) (Report, error)
	ByOwnerID(context.Context, string, string) (Report, error)
	Search(context.Context, SearchFilter) ([]Report, error)
	ByOwner(context.Context, string, int, int) ([]Report, error)
	Update(context.Context, string, Report) (Report, error)
	Withdraw(context.Context, string, string) (Report, error)
	CanManage(context.Context, string, string) error
	AddImage(context.Context, string, string, StoredImage) (Image, error)
	DeleteImage(context.Context, string, string, string) (Image, error)
	PublicImage(context.Context, string, string) (Image, error)
	PublicImages(context.Context, string) ([]Image, error)
	StaffList(context.Context, Status, int, int) ([]Report, error)
	Moderate(context.Context, string, string, ModerationAction) (Report, error)
	QueueObjectCleanup(context.Context, string, string) error
}

type Service struct {
	store   Store
	objects objectstorage.Store
}

func NewService(store Store, objects ...objectstorage.Store) *Service {
	service := &Service{store: store}
	if len(objects) > 0 {
		service.objects = objects[0]
	}
	return service
}

func (service *Service) Create(ctx context.Context, ownerID, idempotencyKey string, input CreateInput) (Report, error) {
	input.ItemName = strings.TrimSpace(input.ItemName)
	input.Category = strings.TrimSpace(input.Category)
	input.PublicDescription = strings.TrimSpace(input.PublicDescription)
	input.ApproximateTime = strings.TrimSpace(input.ApproximateTime)
	input.ApproximateLocation = strings.TrimSpace(input.ApproximateLocation)
	if !uuidPattern.MatchString(idempotencyKey) || !validType(input.ReportType) || !lengthBetween(input.ItemName, 2, 100) ||
		!lengthBetween(input.Category, 2, 80) || !lengthBetween(input.PublicDescription, 10, 1000) ||
		!lengthBetween(input.ApproximateLocation, 2, 120) {
		return Report{}, ErrInvalid
	}
	if _, err := time.Parse("2006-01-02", input.EventDate); err != nil {
		return Report{}, ErrInvalid
	}
	if input.ApproximateTime != "" {
		if _, err := time.Parse("15:04", input.ApproximateTime); err != nil {
			return Report{}, ErrInvalid
		}
	}
	canonical, err := json.Marshal(input)
	if err != nil {
		return Report{}, err
	}
	return service.store.Create(ctx, ownerID, idempotencyKey, sha256.Sum256(canonical), input)
}

func (service *Service) ByID(ctx context.Context, id string) (Report, error) {
	if !uuidPattern.MatchString(id) {
		return Report{}, ErrNotFound
	}
	return service.store.ByID(ctx, id)
}

func (service *Service) Update(ctx context.Context, ownerID, id string, input UpdateInput) (Report, error) {
	if !uuidPattern.MatchString(id) || updateEmpty(input) {
		return Report{}, ErrInvalid
	}
	current, err := service.store.ByOwnerID(ctx, ownerID, id)
	if err != nil {
		return Report{}, err
	}
	if current.Status != StatusActive {
		return Report{}, ErrInvalidState
	}
	if input.ItemName != nil {
		current.ItemName = strings.TrimSpace(*input.ItemName)
	}
	if input.Category != nil {
		current.Category = strings.TrimSpace(*input.Category)
	}
	if input.PublicDescription != nil {
		current.PublicDescription = strings.TrimSpace(*input.PublicDescription)
	}
	if input.EventDate != nil {
		current.EventDate = strings.TrimSpace(*input.EventDate)
	}
	if input.ApproximateTime != nil {
		value := strings.TrimSpace(*input.ApproximateTime)
		current.ApproximateTime = &value
		if value == "" {
			current.ApproximateTime = nil
		}
	}
	if input.ApproximateLocation != nil {
		current.ApproximateLocation = strings.TrimSpace(*input.ApproximateLocation)
	}
	if !validReport(current) {
		return Report{}, ErrInvalid
	}
	return service.store.Update(ctx, ownerID, current)
}

func (service *Service) Withdraw(ctx context.Context, ownerID, id string) (Report, error) {
	if !uuidPattern.MatchString(id) {
		return Report{}, ErrNotFound
	}
	return service.store.Withdraw(ctx, ownerID, id)
}

func (service *Service) AddImage(ctx context.Context, ownerID, reportID string, reader io.Reader) (Image, error) {
	if service.objects == nil {
		return Image{}, ErrStorageUnavailable
	}
	if !uuidPattern.MatchString(reportID) {
		return Image{}, ErrNotFound
	}
	if err := service.store.CanManage(ctx, ownerID, reportID); err != nil {
		return Image{}, err
	}
	prepared, err := objectstorage.PrepareImage(reader)
	if err != nil {
		if errors.Is(err, objectstorage.ErrInvalidImage) || errors.Is(err, objectstorage.ErrImageTooLarge) {
			return Image{}, ErrInvalid
		}
		return Image{}, err
	}
	key, err := objectstorage.NewObjectKey("reports", reportID, prepared.ContentType)
	if err != nil {
		return Image{}, err
	}
	if err := service.objects.Put(ctx, key, prepared.Data, prepared.ContentType); err != nil {
		return Image{}, ErrStorageUnavailable
	}
	image, err := service.store.AddImage(ctx, ownerID, reportID, StoredImage{
		ObjectKey: key, ContentType: prepared.ContentType, SizeBytes: int64(len(prepared.Data)),
		Width: prepared.Width, Height: prepared.Height, SHA256: prepared.SHA256,
	})
	if err != nil {
		if cleanupErr := service.objects.Delete(ctx, key); cleanupErr != nil {
			_ = service.store.QueueObjectCleanup(ctx, key, "report_image_metadata_failed")
		}
		return Image{}, err
	}
	return image, nil
}

func (service *Service) DeleteImage(ctx context.Context, ownerID, reportID, imageID string) error {
	if service.objects == nil {
		return ErrStorageUnavailable
	}
	if !uuidPattern.MatchString(reportID) || !uuidPattern.MatchString(imageID) {
		return ErrNotFound
	}
	image, err := service.store.DeleteImage(ctx, ownerID, reportID, imageID)
	if err != nil {
		return err
	}
	if err := service.objects.Delete(ctx, image.ObjectKey); err != nil {
		_ = service.store.QueueObjectCleanup(ctx, image.ObjectKey, "report_image_delete_failed")
		return ErrStorageUnavailable
	}
	return nil
}

func (service *Service) Images(ctx context.Context, reportID string) ([]Image, error) {
	if !uuidPattern.MatchString(reportID) {
		return nil, ErrNotFound
	}
	if _, err := service.store.ByID(ctx, reportID); err != nil {
		return nil, err
	}
	return service.store.PublicImages(ctx, reportID)
}

func (service *Service) ImageContent(ctx context.Context, reportID, imageID string) (objectstorage.Object, Image, error) {
	if service.objects == nil {
		return objectstorage.Object{}, Image{}, ErrStorageUnavailable
	}
	if !uuidPattern.MatchString(reportID) || !uuidPattern.MatchString(imageID) {
		return objectstorage.Object{}, Image{}, ErrNotFound
	}
	metadata, err := service.store.PublicImage(ctx, reportID, imageID)
	if err != nil {
		return objectstorage.Object{}, Image{}, err
	}
	object, err := service.objects.Get(ctx, metadata.ObjectKey)
	if err != nil {
		return objectstorage.Object{}, Image{}, ErrStorageUnavailable
	}
	return object, metadata, nil
}

func (service *Service) StaffList(ctx context.Context, status Status, limit, offset int) ([]Report, error) {
	if status != "" && !validStatus(status) {
		return nil, ErrInvalid
	}
	limit, offset = pageBounds(limit, offset)
	return service.store.StaffList(ctx, status, limit, offset)
}

func (service *Service) Moderate(ctx context.Context, actorID, reportID string, action ModerationAction) (Report, error) {
	if !uuidPattern.MatchString(reportID) || (action != ModerationHide && action != ModerationRestore && action != ModerationClose) {
		return Report{}, ErrInvalid
	}
	return service.store.Moderate(ctx, actorID, reportID, action)
}

func (service *Service) Search(ctx context.Context, filter SearchFilter) ([]Report, error) {
	filter.Query = strings.TrimSpace(filter.Query)
	filter.Category = strings.TrimSpace(filter.Category)
	if filter.Type != "" && !validType(filter.Type) {
		return nil, ErrInvalid
	}
	filter.Limit, filter.Offset = pageBounds(filter.Limit, filter.Offset)
	return service.store.Search(ctx, filter)
}

func (service *Service) Mine(ctx context.Context, ownerID string, limit, offset int) ([]Report, error) {
	limit, offset = pageBounds(limit, offset)
	return service.store.ByOwner(ctx, ownerID, limit, offset)
}

func validType(value Type) bool { return value == TypeLost || value == TypeFound }
func validStatus(value Status) bool {
	return value == StatusActive || value == StatusWithdrawn || value == StatusHidden || value == StatusClosed
}

func updateEmpty(input UpdateInput) bool {
	return input.ItemName == nil && input.Category == nil && input.PublicDescription == nil && input.EventDate == nil && input.ApproximateTime == nil && input.ApproximateLocation == nil
}

func validReport(value Report) bool {
	if !lengthBetween(value.ItemName, 2, 100) || !lengthBetween(value.Category, 2, 80) || !lengthBetween(value.PublicDescription, 10, 1000) || !lengthBetween(value.ApproximateLocation, 2, 120) {
		return false
	}
	if _, err := time.Parse("2006-01-02", value.EventDate); err != nil {
		return false
	}
	if value.ApproximateTime != nil && *value.ApproximateTime != "" {
		if _, err := time.Parse("15:04", *value.ApproximateTime); err != nil {
			return false
		}
	}
	return true
}
func lengthBetween(value string, minimum, maximum int) bool {
	length := utf8.RuneCountInString(value)
	return length >= minimum && length <= maximum
}
func pageBounds(limit, offset int) (int, int) {
	if limit <= 0 {
		limit = 20
	}
	if limit > 50 {
		limit = 50
	}
	if offset < 0 {
		offset = 0
	}
	if offset > 10_000 {
		offset = 10_000
	}
	return limit, offset
}
