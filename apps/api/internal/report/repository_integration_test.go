package report

import (
	"context"
	"errors"
	"fmt"
	"os"
	"reflect"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

func TestRepositoryRecordsReportTimelineOncePerMutation(t *testing.T) {
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

	identifier := fmt.Sprintf("report-timeline-integration-%d@invalid.example", time.Now().UnixNano())
	var ownerID string
	if err := pool.QueryRow(ctx, `
		INSERT INTO users (identifier, password_hash)
		VALUES ($1, '$argon2id$integration-placeholder')
		RETURNING id::text`, identifier).Scan(&ownerID); err != nil {
		t.Fatal(err)
	}
	var reportID string
	t.Cleanup(func() {
		cleanupCtx, cleanupCancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cleanupCancel()
		if reportID != "" {
			_, _ = pool.Exec(cleanupCtx, `DELETE FROM tracking_events WHERE subject_type = 'report' AND subject_id = $1::uuid`, reportID)
			_, _ = pool.Exec(cleanupCtx, `DELETE FROM reports WHERE id = $1::uuid`, reportID)
		}
		_, _ = pool.Exec(cleanupCtx, `DELETE FROM users WHERE id = $1::uuid`, ownerID)
	})

	repository := NewRepository(pool)
	input := CreateInput{
		ReportType: TypeLost, ItemName: "Black bottle", Category: "Drinkware",
		PublicDescription: "Matte black bottle with a silver lid.", EventDate: "2026-09-23",
		ApproximateTime: "13:30", ApproximateLocation: "Campus library",
	}
	requestHash := [32]byte{1}
	idempotencyKey := "11111111-1111-4111-8111-111111111111"

	created, err := repository.Create(ctx, ownerID, idempotencyKey, requestHash, input)
	if err != nil {
		t.Fatal(err)
	}
	reportID = created.ID
	if _, err := repository.Create(ctx, ownerID, idempotencyKey, requestHash, input); err != nil {
		t.Fatalf("idempotent create: %v", err)
	}
	if _, err := repository.Create(ctx, ownerID, idempotencyKey, [32]byte{2}, input); !errors.Is(err, ErrIdempotencyConflict) {
		t.Fatalf("changed idempotent create error = %v; want ErrIdempotencyConflict", err)
	}
	created.ItemName = "Updated black bottle"
	if _, err := repository.Update(ctx, ownerID, created); err != nil {
		t.Fatal(err)
	}
	if _, err := repository.Withdraw(ctx, ownerID, reportID); err != nil {
		t.Fatal(err)
	}

	rows, err := pool.Query(ctx, `
		SELECT event_type FROM tracking_events
		WHERE subject_type = 'report' AND subject_id = $1::uuid
		ORDER BY created_at, id`, reportID)
	if err != nil {
		t.Fatal(err)
	}
	defer rows.Close()
	var eventTypes []string
	for rows.Next() {
		var eventType string
		if err := rows.Scan(&eventType); err != nil {
			t.Fatal(err)
		}
		eventTypes = append(eventTypes, eventType)
	}
	if err := rows.Err(); err != nil {
		t.Fatal(err)
	}
	if want := []string{"report_created", "report_updated", "report_withdrawn"}; !reflect.DeepEqual(eventTypes, want) {
		t.Fatalf("event types = %#v; want %#v", eventTypes, want)
	}
}
