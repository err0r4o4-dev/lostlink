package matching

import (
	"context"
	"math"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/err0r4o4-dev/lostlink/apps/api/internal/auth"
)

var uuidPattern = regexp.MustCompile(`^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$`)

type Store interface {
	ReportForMatching(context.Context, string) (ReportInput, error)
	EligibleCandidates(context.Context, ReportInput, int) ([]ReportInput, error)
	BeginRun(context.Context, string, string, string) (Run, bool, error)
	CompleteRun(context.Context, Run, ReportInput, map[string][]float64, string, string) ([]Match, error)
	FailRun(context.Context, string, string) error
	MatchesForRun(context.Context, string) ([]Match, error)
	MatchesForReport(context.Context, string) ([]Match, error)
	MatchByID(context.Context, string) (Match, string, error)
	StaffList(context.Context, string, int, int) ([]Match, error)
	Review(context.Context, string, string, ReviewAction) (Match, error)
}

type Service struct {
	store    Store
	embedder Embedder
}

func NewService(store Store, embedder Embedder) *Service {
	return &Service{store: store, embedder: embedder}
}

func (service *Service) Run(ctx context.Context, principal auth.User, reportID, idempotencyKey string) (Run, []Match, error) {
	if !uuidPattern.MatchString(reportID) || !uuidPattern.MatchString(idempotencyKey) {
		return Run{}, nil, ErrInvalid
	}
	source, err := service.store.ReportForMatching(ctx, reportID)
	if err != nil {
		return Run{}, nil, err
	}
	if principal.Role == auth.RoleUser && source.ReporterID != principal.ID {
		return Run{}, nil, ErrNotFound
	}
	if source.Status != "active" || source.ReportType != "lost" {
		return Run{}, nil, ErrInvalidState
	}
	run, existing, err := service.store.BeginRun(ctx, reportID, principal.ID, idempotencyKey)
	if err != nil {
		return Run{}, nil, err
	}
	if existing {
		switch run.Status {
		case RunCompleted:
			matches, listErr := service.store.MatchesForRun(ctx, run.ID)
			return run, matches, listErr
		case RunProcessing:
			return run, nil, ErrRunInProgress
		default:
			return run, nil, ErrAIUnavailable
		}
	}
	if service.embedder == nil {
		_ = service.store.FailRun(ctx, run.ID, "ai_unavailable")
		return Run{}, nil, ErrAIUnavailable
	}
	candidates, err := service.store.EligibleCandidates(ctx, source, 100)
	if err != nil {
		_ = service.store.FailRun(ctx, run.ID, "candidate_lookup_failed")
		return Run{}, nil, err
	}
	inputs := make([]EmbeddingInput, 0, len(candidates)+1)
	inputs = append(inputs, EmbeddingInput{ID: source.ID, Text: source.EmbeddingText()})
	for _, candidate := range candidates {
		inputs = append(inputs, EmbeddingInput{ID: candidate.ID, Text: candidate.EmbeddingText()})
	}
	result, err := service.embedder.Embed(ctx, inputs)
	if err != nil {
		_ = service.store.FailRun(ctx, run.ID, "ai_unavailable")
		return Run{}, nil, ErrAIUnavailable
	}
	vectors, err := validateEmbeddingResult(inputs, result)
	if err != nil {
		_ = service.store.FailRun(ctx, run.ID, "invalid_ai_response")
		return Run{}, nil, ErrAIUnavailable
	}
	matches, err := service.store.CompleteRun(ctx, run, source, vectors, result.ModelVersion, result.ConfigVersion)
	if err != nil {
		_ = service.store.FailRun(ctx, run.ID, "persistence_failed")
		return Run{}, nil, err
	}
	run.Status = RunCompleted
	run.ModelVersion = &result.ModelVersion
	run.ConfigVersion = &result.ConfigVersion
	run.CandidateCount = len(matches)
	completedAt := time.Now().UTC()
	run.CompletedAt = &completedAt
	return run, matches, nil
}

func (service *Service) List(ctx context.Context, principal auth.User, reportID string) ([]Match, error) {
	if !uuidPattern.MatchString(reportID) {
		return nil, ErrNotFound
	}
	source, err := service.store.ReportForMatching(ctx, reportID)
	if err != nil {
		return nil, err
	}
	if principal.Role == auth.RoleUser && source.ReporterID != principal.ID {
		return nil, ErrNotFound
	}
	return service.store.MatchesForReport(ctx, reportID)
}

func (service *Service) ByID(ctx context.Context, principal auth.User, matchID string) (Match, error) {
	if !uuidPattern.MatchString(matchID) {
		return Match{}, ErrNotFound
	}
	value, ownerID, err := service.store.MatchByID(ctx, matchID)
	if err != nil {
		return Match{}, err
	}
	if principal.Role == auth.RoleUser && ownerID != principal.ID {
		return Match{}, ErrNotFound
	}
	if principal.Role == auth.RoleUser && value.Candidate.Status != "active" {
		return Match{}, ErrNotFound
	}
	return value, nil
}

func (service *Service) StaffList(ctx context.Context, reviewStatus string, limit, offset int) ([]Match, error) {
	if reviewStatus != "" && reviewStatus != "pending" && reviewStatus != "reviewed" && reviewStatus != "dismissed" {
		return nil, ErrInvalid
	}
	limit, offset = pageBounds(limit, offset)
	return service.store.StaffList(ctx, reviewStatus, limit, offset)
}

func (service *Service) Review(ctx context.Context, actorID, matchID string, action ReviewAction) (Match, error) {
	if !uuidPattern.MatchString(matchID) || (action != ReviewMark && action != ReviewDismiss) {
		return Match{}, ErrInvalid
	}
	return service.store.Review(ctx, actorID, matchID, action)
}

func validateEmbeddingResult(inputs []EmbeddingInput, result EmbeddingResult) (map[string][]float64, error) {
	if result.ModelVersion == "" || result.ConfigVersion == "" || len(result.Items) != len(inputs) {
		return nil, ErrAIUnavailable
	}
	expected := make(map[string]struct{}, len(inputs))
	for _, input := range inputs {
		expected[input.ID] = struct{}{}
	}
	vectors := make(map[string][]float64, len(inputs))
	for _, item := range result.Items {
		if _, ok := expected[item.ID]; !ok || len(item.Vector) != 32 {
			return nil, ErrAIUnavailable
		}
		for _, value := range item.Vector {
			if math.IsNaN(value) || math.IsInf(value, 0) {
				return nil, ErrAIUnavailable
			}
		}
		vectors[item.ID] = item.Vector
	}
	if len(vectors) != len(expected) {
		return nil, ErrAIUnavailable
	}
	return vectors, nil
}

func vectorLiteral(vector []float64) string {
	values := make([]string, len(vector))
	for index, value := range vector {
		values[index] = strconv.FormatFloat(value, 'f', -1, 64)
	}
	return "[" + strings.Join(values, ",") + "]"
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
