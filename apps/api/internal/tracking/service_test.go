package tracking

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/err0r4o4-dev/lostlink/apps/api/internal/auth"
)

type memoryStore struct {
	arrangement   ReturnArrangement
	scheduleCalls int
}

func (store *memoryStore) Create(_ context.Context, _, _ string) (ReturnArrangement, error) {
	return store.arrangement, nil
}
func (store *memoryStore) ByID(_ context.Context, _ string) (ReturnArrangement, error) {
	return store.arrangement, nil
}
func (store *memoryStore) Timeline(_ context.Context, _, reference string, _ bool) (Timeline, error) {
	return Timeline{Reference: reference}, nil
}
func (store *memoryStore) StaffList(_ context.Context, _ ReturnStatus, _, _ int) ([]ReturnArrangement, error) {
	return []ReturnArrangement{store.arrangement}, nil
}
func (store *memoryStore) Schedule(_ context.Context, _, _ string, pickupAt time.Time, location, notes string) (ReturnArrangement, error) {
	store.scheduleCalls++
	store.arrangement.PickupAt = &pickupAt
	store.arrangement.PickupLocation = &location
	store.arrangement.PrivateNotes = &notes
	return store.arrangement, nil
}
func (store *memoryStore) Transition(_ context.Context, _, _ string, _ Transition) (ReturnArrangement, error) {
	return store.arrangement, nil
}

func testArrangement() ReturnArrangement {
	return ReturnArrangement{
		ID:              "11111111-1111-4111-8111-111111111111",
		ClaimantID:      "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
		FoundReporterID: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
		Status:          StatusScheduling,
	}
}

func TestReturnAccessAllowsOnlyPartiesAndStaff(t *testing.T) {
	store := &memoryStore{arrangement: testArrangement()}
	service := NewService(store)

	if _, err := service.ByID(context.Background(), auth.User{ID: store.arrangement.ClaimantID, Role: auth.RoleUser}, store.arrangement.ID); err != nil {
		t.Fatal(err)
	}
	_, err := service.ByID(context.Background(), auth.User{ID: "cccccccc-cccc-4ccc-8ccc-cccccccccccc", Role: auth.RoleUser}, store.arrangement.ID)
	if !errors.Is(err, ErrNotFound) {
		t.Fatalf("error = %v", err)
	}
	if _, err := service.ByID(context.Background(), auth.User{ID: "staff", Role: auth.RoleStaff}, store.arrangement.ID); err != nil {
		t.Fatal(err)
	}
}

func TestScheduleRejectsPastPickup(t *testing.T) {
	store := &memoryStore{arrangement: testArrangement()}
	service := NewService(store)
	past := time.Now().UTC().Add(-time.Hour).Format(time.RFC3339)

	_, err := service.Schedule(context.Background(), "staff", store.arrangement.ID, ScheduleInput{PickupAt: past, PickupLocation: "Library desk"})
	if !errors.Is(err, ErrInvalid) || store.scheduleCalls != 0 {
		t.Fatalf("error=%v calls=%d", err, store.scheduleCalls)
	}
	future := time.Now().UTC().Add(time.Hour).Format(time.RFC3339)
	if _, err := service.Schedule(context.Background(), "staff", store.arrangement.ID, ScheduleInput{PickupAt: future, PickupLocation: "Library desk"}); err != nil {
		t.Fatal(err)
	}
}
