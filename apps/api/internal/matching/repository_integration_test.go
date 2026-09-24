package matching

import (
	"context"
	"fmt"
	"os"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

func TestCompleteRunRanksOnlyCurrentEligibleCandidates(t *testing.T) {
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		t.Skip("DATABASE_URL is not configured")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	pool, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(pool.Close)

	suffix := time.Now().UnixNano()
	userIDs := make([]string, 0, 2)
	for index := 0; index < 2; index++ {
		var userID string
		identifier := fmt.Sprintf("matching-integration-%d-%d@invalid.example", suffix, index)
		if err := pool.QueryRow(ctx, `
			INSERT INTO users (identifier, password_hash)
			VALUES ($1, '$argon2id$integration-placeholder')
			RETURNING id::text`, identifier).Scan(&userID); err != nil {
			t.Fatal(err)
		}
		userIDs = append(userIDs, userID)
	}
	reportIDs := make([]string, 0, 3)
	insertReport := func(ownerID, reportType, itemName, key string) string {
		t.Helper()
		var reportID string
		if err := pool.QueryRow(ctx, `
			INSERT INTO reports (
				reporter_id, report_type, item_name, category, public_description,
				event_date, approximate_location, idempotency_key, request_hash
			) VALUES ($1::uuid, $2, $3, 'Drinkware', 'Public-safe matching description.',
				'2026-09-23', 'Campus library', $4::uuid, decode(repeat('01', 32), 'hex'))
			RETURNING id::text`, ownerID, reportType, itemName, key).Scan(&reportID); err != nil {
			t.Fatal(err)
		}
		reportIDs = append(reportIDs, reportID)
		return reportID
	}
	sourceID := insertReport(userIDs[0], "lost", "Lost bottle", "11111111-1111-4111-8111-111111111111")
	candidateID := insertReport(userIDs[1], "found", "Current candidate", "22222222-2222-4222-8222-222222222222")
	staleID := insertReport(userIDs[1], "found", "Stale candidate", "33333333-3333-4333-8333-333333333333")

	t.Cleanup(func() {
		cleanupCtx, cleanupCancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cleanupCancel()
		_, _ = pool.Exec(cleanupCtx, `DELETE FROM audit_events WHERE subject_type = 'report' AND subject_id = $1::uuid`, sourceID)
		_, _ = pool.Exec(cleanupCtx, `DELETE FROM tracking_events WHERE subject_type = 'report' AND subject_id = $1::uuid`, sourceID)
		for _, reportID := range reportIDs {
			_, _ = pool.Exec(cleanupCtx, `DELETE FROM reports WHERE id = $1::uuid`, reportID)
		}
		for _, userID := range userIDs {
			_, _ = pool.Exec(cleanupCtx, `DELETE FROM users WHERE id = $1::uuid`, userID)
		}
	})

	vector := make([]float64, embeddingDimensions)
	vector[0] = 1
	if _, err := pool.Exec(ctx, `
		INSERT INTO report_embeddings_384 (report_id, embedding, model_version, config_version)
		VALUES ($1::uuid, $2::vector, 'integration-model', 'integration-config')`, staleID, vectorLiteral(vector)); err != nil {
		t.Fatal(err)
	}

	repository := NewRepository(pool)
	run, existing, err := repository.BeginRun(ctx, sourceID, userIDs[0], "44444444-4444-4444-8444-444444444444")
	if err != nil || existing {
		t.Fatalf("begin run = %#v, existing=%v, error=%v", run, existing, err)
	}
	source := ReportInput{
		ID: sourceID, ReporterID: userIDs[0], ReportType: "lost", ItemName: "Lost bottle",
		Category: "Drinkware", PublicDescription: "Public-safe matching description.",
		EventDate: "2026-09-23", ApproximateLocation: "Campus library", Status: "active",
	}
	matches, err := repository.CompleteRun(ctx, run, source, map[string][]float64{
		sourceID: vector, candidateID: vector,
	}, "integration-model", "integration-config")
	if err != nil {
		t.Fatal(err)
	}
	if len(matches) != 1 || matches[0].Candidate.ID != candidateID {
		t.Fatalf("matches = %#v; stale candidate %s must be excluded", matches, staleID)
	}
}
