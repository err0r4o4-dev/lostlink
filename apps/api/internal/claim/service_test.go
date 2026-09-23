package claim

import (
	"context"
	"errors"
	"testing"

	"github.com/err0r4o4-dev/lostlink/apps/api/internal/auth"
)

type memoryStore struct {
	claim       Claim
	decideCalls int
}

func (store *memoryStore) Create(_ context.Context, _, _, _ string) (Claim, error) {
	return store.claim, nil
}
func (store *memoryStore) ByClaimant(_ context.Context, _ string, _, _ int) ([]Claim, error) {
	return []Claim{store.claim}, nil
}
func (store *memoryStore) ByID(_ context.Context, _ string) (Claim, error) { return store.claim, nil }
func (store *memoryStore) CanEdit(_ context.Context, _, _ string) error    { return nil }
func (store *memoryStore) AddStatement(_ context.Context, _, _, description string) (Evidence, error) {
	return Evidence{ID: "22222222-2222-4222-8222-222222222222", Description: description}, nil
}
func (store *memoryStore) AddImage(_ context.Context, _, _ string, _ StoredEvidence) (Evidence, error) {
	return Evidence{}, nil
}
func (store *memoryStore) DeleteEvidence(_ context.Context, _, _, _ string) (Evidence, error) {
	return Evidence{}, nil
}
func (store *memoryStore) Submit(_ context.Context, _, _ string) (Claim, error) {
	return store.claim, nil
}
func (store *memoryStore) Cancel(_ context.Context, _, _ string) (Claim, error) {
	return store.claim, nil
}
func (store *memoryStore) StaffList(_ context.Context, _ Status, _, _ int) ([]Claim, error) {
	return []Claim{store.claim}, nil
}
func (store *memoryStore) Decide(_ context.Context, _, _ string, _ Action, _ string) (Claim, error) {
	store.decideCalls++
	return store.claim, nil
}
func (store *memoryStore) EvidenceByID(_ context.Context, _, _ string) (Evidence, string, error) {
	return Evidence{}, store.claim.ClaimantID, nil
}
func (store *memoryStore) QueueObjectCleanup(_ context.Context, _, _ string) error { return nil }

func testClaim() Claim {
	return Claim{
		ID:         "11111111-1111-4111-8111-111111111111",
		ClaimantID: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
		Status:     StatusDraft,
	}
}

func TestByIDConcealsAnotherUsersClaim(t *testing.T) {
	store := &memoryStore{claim: testClaim()}
	service := NewService(store)
	principal := auth.User{ID: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", Role: auth.RoleUser}

	_, err := service.ByID(context.Background(), principal, store.claim.ID)
	if !errors.Is(err, ErrNotFound) {
		t.Fatalf("error = %v", err)
	}
}

func TestDecisionRequiresReasonForRejection(t *testing.T) {
	store := &memoryStore{claim: testClaim()}
	service := NewService(store)

	_, err := service.Decide(context.Background(), "staff", store.claim.ID, ActionReject, "")
	if !errors.Is(err, ErrInvalid) || store.decideCalls != 0 {
		t.Fatalf("error=%v decideCalls=%d", err, store.decideCalls)
	}
}

func TestResponseRequiresNeedsMoreInfoState(t *testing.T) {
	store := &memoryStore{claim: testClaim()}
	service := NewService(store)

	_, err := service.Respond(context.Background(), store.claim.ClaimantID, store.claim.ID, "Additional private evidence")
	if !errors.Is(err, ErrInvalidState) {
		t.Fatalf("error = %v", err)
	}
	store.claim.Status = StatusNeedsMoreInfo
	if _, err := service.Respond(context.Background(), store.claim.ClaimantID, store.claim.ID, "Additional private evidence"); err != nil {
		t.Fatal(err)
	}
}
