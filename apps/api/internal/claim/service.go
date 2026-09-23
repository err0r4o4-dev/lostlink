package claim

import (
	"context"
	"errors"
	"io"
	"regexp"
	"strings"
	"unicode/utf8"

	"github.com/err0r4o4-dev/lostlink/apps/api/internal/auth"
	objectstorage "github.com/err0r4o4-dev/lostlink/apps/api/internal/storage"
)

var uuidPattern = regexp.MustCompile(`^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$`)

type Store interface {
	Create(context.Context, string, string, string) (Claim, error)
	ByClaimant(context.Context, string, int, int) ([]Claim, error)
	ByID(context.Context, string) (Claim, error)
	CanEdit(context.Context, string, string) error
	AddStatement(context.Context, string, string, string) (Evidence, error)
	AddImage(context.Context, string, string, StoredEvidence) (Evidence, error)
	DeleteEvidence(context.Context, string, string, string) (Evidence, error)
	Submit(context.Context, string, string) (Claim, error)
	Cancel(context.Context, string, string) (Claim, error)
	StaffList(context.Context, Status, int, int) ([]Claim, error)
	Decide(context.Context, string, string, Action, string) (Claim, error)
	EvidenceByID(context.Context, string, string) (Evidence, string, error)
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

func (service *Service) Create(ctx context.Context, claimantID, matchID, idempotencyKey string) (Claim, error) {
	if !uuidPattern.MatchString(matchID) || !uuidPattern.MatchString(idempotencyKey) {
		return Claim{}, ErrInvalid
	}
	return service.store.Create(ctx, claimantID, matchID, idempotencyKey)
}

func (service *Service) Mine(ctx context.Context, claimantID string, limit, offset int) ([]Claim, error) {
	limit, offset = pageBounds(limit, offset)
	return service.store.ByClaimant(ctx, claimantID, limit, offset)
}

func (service *Service) ByID(ctx context.Context, principal auth.User, claimID string) (Claim, error) {
	if !uuidPattern.MatchString(claimID) {
		return Claim{}, ErrNotFound
	}
	value, err := service.store.ByID(ctx, claimID)
	if err != nil {
		return Claim{}, err
	}
	if principal.Role == auth.RoleUser && value.ClaimantID != principal.ID {
		return Claim{}, ErrNotFound
	}
	return value, nil
}

func (service *Service) AddStatement(ctx context.Context, claimantID, claimID, description string) (Evidence, error) {
	description = strings.TrimSpace(description)
	if !uuidPattern.MatchString(claimID) || !lengthBetween(description, 10, 2000) {
		return Evidence{}, ErrInvalid
	}
	return service.store.AddStatement(ctx, claimantID, claimID, description)
}

func (service *Service) Respond(ctx context.Context, claimantID, claimID, description string) (Evidence, error) {
	if !uuidPattern.MatchString(claimID) {
		return Evidence{}, ErrNotFound
	}
	value, err := service.store.ByID(ctx, claimID)
	if err != nil {
		return Evidence{}, err
	}
	if value.ClaimantID != claimantID {
		return Evidence{}, ErrNotFound
	}
	if value.Status != StatusNeedsMoreInfo {
		return Evidence{}, ErrInvalidState
	}
	return service.AddStatement(ctx, claimantID, claimID, description)
}

func (service *Service) AddImage(ctx context.Context, claimantID, claimID, description string, reader io.Reader) (Evidence, error) {
	if service.objects == nil {
		return Evidence{}, ErrStorageUnavailable
	}
	description = strings.TrimSpace(description)
	if !uuidPattern.MatchString(claimID) || !lengthBetween(description, 10, 2000) {
		return Evidence{}, ErrInvalid
	}
	if err := service.store.CanEdit(ctx, claimantID, claimID); err != nil {
		return Evidence{}, err
	}
	prepared, err := objectstorage.PrepareImage(reader)
	if err != nil {
		if errors.Is(err, objectstorage.ErrInvalidImage) || errors.Is(err, objectstorage.ErrImageTooLarge) {
			return Evidence{}, ErrInvalid
		}
		return Evidence{}, err
	}
	key, err := objectstorage.NewObjectKey("claims", claimID, prepared.ContentType)
	if err != nil {
		return Evidence{}, err
	}
	if err := service.objects.Put(ctx, key, prepared.Data, prepared.ContentType); err != nil {
		return Evidence{}, ErrStorageUnavailable
	}
	value, err := service.store.AddImage(ctx, claimantID, claimID, StoredEvidence{
		Description: description, ObjectKey: key, ContentType: prepared.ContentType,
		SizeBytes: int64(len(prepared.Data)), Width: prepared.Width, Height: prepared.Height, SHA256: prepared.SHA256,
	})
	if err != nil {
		if cleanupErr := service.objects.Delete(ctx, key); cleanupErr != nil {
			_ = service.store.QueueObjectCleanup(ctx, key, "claim_evidence_metadata_failed")
		}
		return Evidence{}, err
	}
	return value, nil
}

func (service *Service) DeleteEvidence(ctx context.Context, claimantID, claimID, evidenceID string) error {
	if !uuidPattern.MatchString(claimID) || !uuidPattern.MatchString(evidenceID) {
		return ErrNotFound
	}
	value, err := service.store.DeleteEvidence(ctx, claimantID, claimID, evidenceID)
	if err != nil {
		return err
	}
	if value.ObjectKey != nil {
		if service.objects == nil || service.objects.Delete(ctx, *value.ObjectKey) != nil {
			_ = service.store.QueueObjectCleanup(ctx, *value.ObjectKey, "claim_evidence_delete_failed")
			return ErrStorageUnavailable
		}
	}
	return nil
}

func (service *Service) Submit(ctx context.Context, claimantID, claimID string) (Claim, error) {
	if !uuidPattern.MatchString(claimID) {
		return Claim{}, ErrNotFound
	}
	return service.store.Submit(ctx, claimantID, claimID)
}

func (service *Service) Cancel(ctx context.Context, claimantID, claimID string) (Claim, error) {
	if !uuidPattern.MatchString(claimID) {
		return Claim{}, ErrNotFound
	}
	return service.store.Cancel(ctx, claimantID, claimID)
}

func (service *Service) StaffList(ctx context.Context, status Status, limit, offset int) ([]Claim, error) {
	if status != "" && !validStatus(status) {
		return nil, ErrInvalid
	}
	limit, offset = pageBounds(limit, offset)
	return service.store.StaffList(ctx, status, limit, offset)
}

func (service *Service) Decide(ctx context.Context, actorID, claimID string, action Action, reason string) (Claim, error) {
	reason = strings.TrimSpace(reason)
	if !uuidPattern.MatchString(claimID) || !validAction(action) || (reason != "" && !lengthBetween(reason, 3, 1000)) {
		return Claim{}, ErrInvalid
	}
	if (action == ActionReject || action == ActionRequestMoreInfo) && reason == "" {
		return Claim{}, ErrInvalid
	}
	return service.store.Decide(ctx, actorID, claimID, action, reason)
}

func (service *Service) EvidenceContent(ctx context.Context, principal auth.User, claimID, evidenceID string) (objectstorage.Object, Evidence, error) {
	if service.objects == nil {
		return objectstorage.Object{}, Evidence{}, ErrStorageUnavailable
	}
	if !uuidPattern.MatchString(claimID) || !uuidPattern.MatchString(evidenceID) {
		return objectstorage.Object{}, Evidence{}, ErrNotFound
	}
	value, claimantID, err := service.store.EvidenceByID(ctx, claimID, evidenceID)
	if err != nil {
		return objectstorage.Object{}, Evidence{}, err
	}
	if principal.Role == auth.RoleUser && claimantID != principal.ID {
		return objectstorage.Object{}, Evidence{}, ErrNotFound
	}
	if value.ObjectKey == nil {
		return objectstorage.Object{}, Evidence{}, ErrNotFound
	}
	object, err := service.objects.Get(ctx, *value.ObjectKey)
	if err != nil {
		return objectstorage.Object{}, Evidence{}, ErrStorageUnavailable
	}
	return object, value, nil
}

func validStatus(value Status) bool {
	return value == StatusDraft || value == StatusSubmitted || value == StatusUnderReview || value == StatusNeedsMoreInfo || value == StatusApproved || value == StatusRejected || value == StatusCancelled
}

func validAction(value Action) bool {
	return value == ActionStartReview || value == ActionRequestMoreInfo || value == ActionApprove || value == ActionReject
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
