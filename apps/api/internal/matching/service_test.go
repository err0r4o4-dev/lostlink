package matching

import (
	"context"
	"errors"
	"testing"

	"github.com/err0r4o4-dev/lostlink/apps/api/internal/auth"
)

type memoryStore struct {
	source     ReportInput
	candidates []ReportInput
	completed  bool
}

func (store *memoryStore) ReportForMatching(_ context.Context, _ string) (ReportInput, error) {
	return store.source, nil
}
func (store *memoryStore) EligibleCandidates(_ context.Context, _ ReportInput, _ int) ([]ReportInput, error) {
	return store.candidates, nil
}
func (store *memoryStore) BeginRun(_ context.Context, reportID, requesterID, _ string) (Run, bool, error) {
	return Run{ID: "33333333-3333-4333-8333-333333333333", ReportID: reportID, RequestedBy: requesterID, Status: RunProcessing}, false, nil
}
func (store *memoryStore) CompleteRun(_ context.Context, _ Run, source ReportInput, _ map[string][]float64, model, config string) ([]Match, error) {
	store.completed = true
	return []Match{{ID: "44444444-4444-4444-8444-444444444444", SourceReportID: source.ID, ModelVersion: model, ConfigVersion: config}}, nil
}
func (store *memoryStore) FailRun(_ context.Context, _, _ string) error { return nil }
func (store *memoryStore) MatchesForRun(_ context.Context, _ string) ([]Match, error) {
	return []Match{}, nil
}
func (store *memoryStore) MatchesForReport(_ context.Context, _ string) ([]Match, error) {
	return []Match{}, nil
}
func (store *memoryStore) MatchByID(_ context.Context, _ string) (Match, string, error) {
	return Match{}, store.source.ReporterID, nil
}
func (store *memoryStore) StaffList(_ context.Context, _ string, _, _ int) ([]Match, error) {
	return []Match{}, nil
}
func (store *memoryStore) Review(_ context.Context, _, _ string, _ ReviewAction) (Match, error) {
	return Match{}, nil
}

type fakeEmbedder struct{ calls int }

func (embedder *fakeEmbedder) Embed(_ context.Context, inputs []EmbeddingInput) (EmbeddingResult, error) {
	embedder.calls++
	items := make([]Embedding, len(inputs))
	for index, input := range inputs {
		vector := make([]float64, 32)
		vector[index%32] = 1
		items[index] = Embedding{ID: input.ID, Vector: vector}
	}
	return EmbeddingResult{ModelVersion: "test-model", ConfigVersion: "test-config", Items: items}, nil
}

func matchingSource() ReportInput {
	return ReportInput{
		ID: "11111111-1111-4111-8111-111111111111", ReporterID: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
		ReportType: "lost", ItemName: "Black bottle", Category: "Drinkware",
		PublicDescription: "Black bottle with a silver lid", EventDate: "2026-09-23",
		ApproximateLocation: "Library", Status: "active",
	}
}

func TestRunMatchingUsesOnlyAuthorizedLostReport(t *testing.T) {
	store := &memoryStore{
		source: matchingSource(),
		candidates: []ReportInput{{
			ID: "22222222-2222-4222-8222-222222222222", ReportType: "found",
			ItemName: "Bottle", Category: "Drinkware", PublicDescription: "Found black bottle",
			EventDate: "2026-09-23", ApproximateLocation: "Library", Status: "active",
		}},
	}
	embedder := new(fakeEmbedder)
	service := NewService(store, embedder)
	principal := auth.User{ID: store.source.ReporterID, Role: auth.RoleUser}

	run, matches, err := service.Run(context.Background(), principal, store.source.ID, "55555555-5555-4555-8555-555555555555")
	if err != nil {
		t.Fatal(err)
	}
	if run.Status != RunCompleted || len(matches) != 1 || !store.completed || embedder.calls != 1 {
		t.Fatalf("run=%#v matches=%#v completed=%v calls=%d", run, matches, store.completed, embedder.calls)
	}
}

func TestRunMatchingConcealsAnotherUsersReport(t *testing.T) {
	store := &memoryStore{source: matchingSource()}
	embedder := new(fakeEmbedder)
	service := NewService(store, embedder)
	principal := auth.User{ID: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", Role: auth.RoleUser}

	_, _, err := service.Run(context.Background(), principal, store.source.ID, "55555555-5555-4555-8555-555555555555")
	if !errors.Is(err, ErrNotFound) || embedder.calls != 0 {
		t.Fatalf("error=%v calls=%d", err, embedder.calls)
	}
}
