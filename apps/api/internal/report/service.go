package report

import (
	"context"
	"crypto/sha256"
	"encoding/json"
	"regexp"
	"strings"
	"time"
	"unicode/utf8"
)

var uuidPattern = regexp.MustCompile(`^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$`)

type Store interface {
	Create(context.Context, string, string, [32]byte, CreateInput) (Report, error)
	ByID(context.Context, string) (Report, error)
	Search(context.Context, SearchFilter) ([]Report, error)
	ByOwner(context.Context, string, int, int) ([]Report, error)
}

type Service struct{ store Store }

func NewService(store Store) *Service { return &Service{store: store} }

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
