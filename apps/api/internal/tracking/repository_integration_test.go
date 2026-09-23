package tracking

import (
	"context"
	"fmt"
	"os"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

func TestRepositoryReturnLifecycleClosesReports(t *testing.T) {
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
	roles := []string{"user", "user", "staff"}
	userIDs := make([]string, 0, len(roles))
	for index, role := range roles {
		var userID string
		identifier := fmt.Sprintf("return-integration-%d-%d@invalid.example", suffix, index)
		if err := pool.QueryRow(ctx, `
			INSERT INTO users (identifier, password_hash, role)
			VALUES ($1, '$argon2id$integration-placeholder', $2)
			RETURNING id::text`, identifier, role).Scan(&userID); err != nil {
			t.Fatal(err)
		}
		userIDs = append(userIDs, userID)
	}
	insertReport := func(ownerID, reportType, itemName, key string) string {
		t.Helper()
		var reportID string
		if err := pool.QueryRow(ctx, `
			INSERT INTO reports (
				reporter_id, report_type, item_name, category, public_description,
				event_date, approximate_location, idempotency_key, request_hash
			) VALUES ($1::uuid, $2, $3, 'Drinkware', 'Public-safe return integration report.',
				'2026-09-23', 'Campus library', $4::uuid, decode(repeat('03', 32), 'hex'))
			RETURNING id::text`, ownerID, reportType, itemName, key).Scan(&reportID); err != nil {
			t.Fatal(err)
		}
		return reportID
	}
	lostReportID := insertReport(userIDs[0], "lost", "Lost bottle", "11111111-1111-4111-8111-111111111111")
	foundReportID := insertReport(userIDs[1], "found", "Found bottle", "22222222-2222-4222-8222-222222222222")

	var runID string
	if err := pool.QueryRow(ctx, `
		INSERT INTO matching_runs (
			report_id, requested_by, idempotency_key, status, model_version,
			config_version, candidate_count, completed_at
		) VALUES ($1::uuid, $2::uuid, $3::uuid, 'completed', 'integration-model',
			'integration-config', 1, now()) RETURNING id::text`,
		lostReportID, userIDs[0], "33333333-3333-4333-8333-333333333333").Scan(&runID); err != nil {
		t.Fatal(err)
	}
	var matchID string
	if err := pool.QueryRow(ctx, `
		INSERT INTO matches (
			run_id, source_report_id, candidate_report_id, score, signals,
			model_version, config_version
		) VALUES ($1::uuid, $2::uuid, $3::uuid, 0.9, '[]'::jsonb,
			'integration-model', 'integration-config') RETURNING id::text`,
		runID, lostReportID, foundReportID).Scan(&matchID); err != nil {
		t.Fatal(err)
	}
	var claimID string
	if err := pool.QueryRow(ctx, `
		INSERT INTO claims (
			match_id, lost_report_id, found_report_id, claimant_id,
			idempotency_key, status, submitted_at, reviewed_at
		) VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5::uuid,
			'approved', now(), now()) RETURNING id::text`,
		matchID, lostReportID, foundReportID, userIDs[0],
		"44444444-4444-4444-8444-444444444444").Scan(&claimID); err != nil {
		t.Fatal(err)
	}

	var returnID string
	t.Cleanup(func() {
		cleanupCtx, cleanupCancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cleanupCancel()
		if returnID != "" {
			_, _ = pool.Exec(cleanupCtx, `DELETE FROM audit_events WHERE subject_type = 'return' AND subject_id = $1::uuid`, returnID)
			_, _ = pool.Exec(cleanupCtx, `DELETE FROM tracking_events WHERE subject_type = 'return' AND subject_id = $1::uuid`, returnID)
			_, _ = pool.Exec(cleanupCtx, `DELETE FROM return_arrangements WHERE id = $1::uuid`, returnID)
		}
		_, _ = pool.Exec(cleanupCtx, `DELETE FROM claims WHERE id = $1::uuid`, claimID)
		_, _ = pool.Exec(cleanupCtx, `DELETE FROM matching_runs WHERE id = $1::uuid`, runID)
		_, _ = pool.Exec(cleanupCtx, `DELETE FROM reports WHERE id IN ($1::uuid, $2::uuid)`, lostReportID, foundReportID)
		for _, userID := range userIDs {
			_, _ = pool.Exec(cleanupCtx, `DELETE FROM users WHERE id = $1::uuid`, userID)
		}
	})

	repository := NewRepository(pool)
	created, err := repository.Create(ctx, userIDs[2], claimID)
	if err != nil {
		t.Fatal(err)
	}
	returnID = created.ID
	pickupAt := time.Now().UTC().Add(24 * time.Hour)
	if _, err := repository.Schedule(ctx, userIDs[2], returnID, pickupAt, "Library service desk", "Verify student ID"); err != nil {
		t.Fatal(err)
	}
	for _, transition := range []Transition{TransitionPickup, TransitionComplete, TransitionClose} {
		if _, err := repository.Transition(ctx, userIDs[2], returnID, transition); err != nil {
			t.Fatalf("transition %s: %v", transition, err)
		}
	}
	closed, err := repository.ByID(ctx, returnID)
	if err != nil {
		t.Fatal(err)
	}
	if closed.Status != StatusClosed || closed.CompletedAt == nil || closed.ClosedAt == nil {
		t.Fatalf("closed return = %#v", closed)
	}
	var closedReports int
	if err := pool.QueryRow(ctx, `
		SELECT count(*) FROM reports
		WHERE id IN ($1::uuid, $2::uuid) AND status = 'closed' AND closed_at IS NOT NULL`,
		lostReportID, foundReportID).Scan(&closedReports); err != nil {
		t.Fatal(err)
	}
	if closedReports != 2 {
		t.Fatalf("closed reports = %d; want 2", closedReports)
	}
}
