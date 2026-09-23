package report

import (
	"context"
	"errors"
	"testing"
)

type memoryStore struct {
	report Report
	key    string
	hash   [32]byte
	input  CreateInput
	filter SearchFilter
}

func (store *memoryStore) Create(_ context.Context, _ string, key string, hash [32]byte, input CreateInput) (Report, error) {
	if store.key != "" {
		if store.key != key || store.hash != hash {
			return Report{}, ErrIdempotencyConflict
		}
		return store.report, nil
	}
	store.key, store.hash, store.input = key, hash, input
	store.report = Report{ID: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", ReportType: input.ReportType, ItemName: input.ItemName, Status: StatusActive}
	return store.report, nil
}
func (store *memoryStore) ByID(_ context.Context, id string) (Report, error) {
	if id != store.report.ID {
		return Report{}, ErrNotFound
	}
	return store.report, nil
}
func (store *memoryStore) ByOwnerID(_ context.Context, _ string, id string) (Report, error) {
	return store.ByID(context.Background(), id)
}
func (store *memoryStore) Search(_ context.Context, filter SearchFilter) ([]Report, error) {
	store.filter = filter
	return []Report{}, nil
}
func (store *memoryStore) ByOwner(_ context.Context, _ string, _, _ int) ([]Report, error) {
	return []Report{}, nil
}
func (store *memoryStore) Update(_ context.Context, _ string, value Report) (Report, error) {
	store.report = value
	return value, nil
}
func (store *memoryStore) Withdraw(_ context.Context, _ string, id string) (Report, error) {
	if id != store.report.ID {
		return Report{}, ErrNotFound
	}
	store.report.Status = StatusWithdrawn
	return store.report, nil
}
func (store *memoryStore) CanManage(_ context.Context, _, _ string) error { return nil }
func (store *memoryStore) AddImage(_ context.Context, _, _ string, _ StoredImage) (Image, error) {
	return Image{}, nil
}
func (store *memoryStore) DeleteImage(_ context.Context, _, _, _ string) (Image, error) {
	return Image{}, nil
}
func (store *memoryStore) PublicImage(_ context.Context, _, _ string) (Image, error) {
	return Image{}, nil
}
func (store *memoryStore) PublicImages(_ context.Context, _ string) ([]Image, error) {
	return []Image{}, nil
}
func (store *memoryStore) StaffList(_ context.Context, _ Status, _, _ int) ([]Report, error) {
	return []Report{}, nil
}
func (store *memoryStore) Moderate(_ context.Context, _, _ string, _ ModerationAction) (Report, error) {
	return store.report, nil
}
func (store *memoryStore) QueueObjectCleanup(_ context.Context, _, _ string) error { return nil }

func validInput() CreateInput {
	return CreateInput{ReportType: TypeLost, ItemName: "Black bottle", Category: "Drinkware", PublicDescription: "Matte black bottle with a silver lid.", EventDate: "2026-09-09", ApproximateTime: "13:30", ApproximateLocation: "Campus library"}
}

func TestCreateValidatesAndIsIdempotent(t *testing.T) {
	store := new(memoryStore)
	service := NewService(store)
	key := "11111111-1111-4111-8111-111111111111"

	first, err := service.Create(context.Background(), "owner", key, validInput())
	if err != nil {
		t.Fatal(err)
	}
	second, err := service.Create(context.Background(), "owner", key, validInput())
	if err != nil || second.ID != first.ID {
		t.Fatalf("idempotent retry = %#v, %v", second, err)
	}
	changed := validInput()
	changed.ItemName = "Different item"
	if _, err := service.Create(context.Background(), "owner", key, changed); !errors.Is(err, ErrIdempotencyConflict) {
		t.Fatalf("changed retry error = %v", err)
	}
}

func TestCreateRejectsInvalidPublicFields(t *testing.T) {
	service := NewService(new(memoryStore))
	input := validInput()
	input.EventDate = "not-a-date"
	if _, err := service.Create(context.Background(), "owner", "11111111-1111-4111-8111-111111111111", input); !errors.Is(err, ErrInvalid) {
		t.Fatalf("invalid input error = %v", err)
	}
}

func TestSearchBoundsPagination(t *testing.T) {
	store := new(memoryStore)
	service := NewService(store)
	if _, err := service.Search(context.Background(), SearchFilter{Limit: 999, Offset: -1}); err != nil {
		t.Fatal(err)
	}
	if store.filter.Limit != 50 || store.filter.Offset != 0 {
		t.Fatalf("bounded filter = %#v", store.filter)
	}
}
