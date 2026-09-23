package tracking

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct{ pool *pgxpool.Pool }

func NewRepository(pool *pgxpool.Pool) *Repository { return &Repository{pool: pool} }

const returnSelect = `a.id::text, a.claim_id::text, a.status, a.pickup_at, a.pickup_location,
a.private_notes, a.created_at, a.updated_at, a.completed_at, a.closed_at,
c.claimant_id::text, found.reporter_id::text, c.lost_report_id::text, c.found_report_id::text`

func (repository *Repository) Create(ctx context.Context, actorID, claimID string) (ReturnArrangement, error) {
	tx, err := repository.pool.Begin(ctx)
	if err != nil {
		return ReturnArrangement{}, fmt.Errorf("begin return arrangement: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	var status, claimantID, foundReporterID string
	err = tx.QueryRow(ctx, `
		SELECT c.status, c.claimant_id::text, found.reporter_id::text
		FROM claims c JOIN reports found ON found.id = c.found_report_id
		WHERE c.id = $1::uuid FOR UPDATE OF c`, claimID).Scan(&status, &claimantID, &foundReporterID)
	if errors.Is(err, pgx.ErrNoRows) {
		return ReturnArrangement{}, ErrNotFound
	}
	if err != nil {
		return ReturnArrangement{}, fmt.Errorf("read approved claim: %w", err)
	}
	if status != "approved" {
		return ReturnArrangement{}, ErrInvalidState
	}
	var returnID string
	err = tx.QueryRow(ctx, `
		INSERT INTO return_arrangements (claim_id, created_by)
		VALUES ($1::uuid, $2::uuid) RETURNING id::text`, claimID, actorID).Scan(&returnID)
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) && pgErr.Code == "23505" {
		return ReturnArrangement{}, ErrConflict
	}
	if err != nil {
		return ReturnArrangement{}, fmt.Errorf("create return arrangement: %w", err)
	}
	if _, err := tx.Exec(ctx, `
		INSERT INTO tracking_events (subject_type, subject_id, event_type, actor_id, message)
		VALUES ('return', $1::uuid, 'return_scheduling', $2::uuid, 'Return scheduling started.')`, returnID, actorID); err != nil {
		return ReturnArrangement{}, fmt.Errorf("track return creation: %w", err)
	}
	if err := notifyParties(ctx, tx, claimantID, foundReporterID, "return_scheduling", "Return scheduling started", "Authorized staff started arranging the item return.", "/tracking"); err != nil {
		return ReturnArrangement{}, err
	}
	if _, err := tx.Exec(ctx, `
		INSERT INTO audit_events (actor_id, action, subject_type, subject_id)
		VALUES ($1::uuid, 'return.created', 'return', $2::uuid)`, actorID, returnID); err != nil {
		return ReturnArrangement{}, fmt.Errorf("audit return creation: %w", err)
	}
	if err := tx.Commit(ctx); err != nil {
		return ReturnArrangement{}, fmt.Errorf("commit return arrangement: %w", err)
	}
	return repository.ByID(ctx, returnID)
}

func (repository *Repository) ByID(ctx context.Context, returnID string) (ReturnArrangement, error) {
	value, err := scanReturn(repository.pool.QueryRow(ctx, `
		SELECT `+returnSelect+`
		FROM return_arrangements a
		JOIN claims c ON c.id = a.claim_id
		JOIN reports found ON found.id = c.found_report_id
		WHERE a.id = $1::uuid`, returnID))
	if errors.Is(err, pgx.ErrNoRows) {
		return ReturnArrangement{}, ErrNotFound
	}
	if err != nil {
		return ReturnArrangement{}, fmt.Errorf("read return arrangement: %w", err)
	}
	return value, nil
}

func (repository *Repository) Timeline(ctx context.Context, principalID, reference string, staff bool) (Timeline, error) {
	var ownerID, status string
	err := repository.pool.QueryRow(ctx, `SELECT reporter_id::text, status FROM reports WHERE id = $1::uuid`, reference).Scan(&ownerID, &status)
	if err == nil {
		if !staff && ownerID != principalID {
			return Timeline{}, ErrNotFound
		}
		return repository.timelineEvents(ctx, reference, "report", status)
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return Timeline{}, fmt.Errorf("resolve report timeline: %w", err)
	}

	err = repository.pool.QueryRow(ctx, `SELECT claimant_id::text, status FROM claims WHERE id = $1::uuid`, reference).Scan(&ownerID, &status)
	if err == nil {
		if !staff && ownerID != principalID {
			return Timeline{}, ErrNotFound
		}
		return repository.timelineEvents(ctx, reference, "claim", status)
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return Timeline{}, fmt.Errorf("resolve claim timeline: %w", err)
	}

	arrangement, err := repository.ByID(ctx, reference)
	if err != nil {
		return Timeline{}, err
	}
	if !staff && principalID != arrangement.ClaimantID && principalID != arrangement.FoundReporterID {
		return Timeline{}, ErrNotFound
	}
	return repository.timelineEvents(ctx, reference, "return", string(arrangement.Status))
}

func (repository *Repository) StaffList(ctx context.Context, status ReturnStatus, limit, offset int) ([]ReturnArrangement, error) {
	rows, err := repository.pool.Query(ctx, `
		SELECT `+returnSelect+`
		FROM return_arrangements a
		JOIN claims c ON c.id = a.claim_id
		JOIN reports found ON found.id = c.found_report_id
		WHERE ($1 = '' OR a.status = $1)
		ORDER BY a.updated_at DESC, a.id DESC LIMIT $2 OFFSET $3`, status, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("list return arrangements: %w", err)
	}
	defer rows.Close()
	values := make([]ReturnArrangement, 0)
	for rows.Next() {
		value, err := scanReturn(rows)
		if err != nil {
			return nil, fmt.Errorf("scan return arrangement: %w", err)
		}
		values = append(values, value)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate return arrangements: %w", err)
	}
	return values, nil
}

func (repository *Repository) Schedule(ctx context.Context, actorID, returnID string, pickupAt time.Time, location, notes string) (ReturnArrangement, error) {
	tx, err := repository.pool.Begin(ctx)
	if err != nil {
		return ReturnArrangement{}, fmt.Errorf("begin return schedule: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()
	current, err := lockReturn(ctx, tx, returnID)
	if err != nil {
		return ReturnArrangement{}, err
	}
	if current.Status != StatusScheduling {
		return ReturnArrangement{}, ErrInvalidState
	}
	if _, err := tx.Exec(ctx, `
		UPDATE return_arrangements SET status = 'scheduled', pickup_at = $2,
			pickup_location = $3, private_notes = NULLIF($4, ''), updated_at = now()
		WHERE id = $1::uuid`, returnID, pickupAt, location, notes); err != nil {
		return ReturnArrangement{}, fmt.Errorf("schedule return: %w", err)
	}
	if err := recordReturnTransition(ctx, tx, current, actorID, returnID, "return_scheduled", "Return pickup was scheduled."); err != nil {
		return ReturnArrangement{}, err
	}
	if err := tx.Commit(ctx); err != nil {
		return ReturnArrangement{}, fmt.Errorf("commit return schedule: %w", err)
	}
	return repository.ByID(ctx, returnID)
}

func (repository *Repository) Transition(ctx context.Context, actorID, returnID string, transition Transition) (ReturnArrangement, error) {
	tx, err := repository.pool.Begin(ctx)
	if err != nil {
		return ReturnArrangement{}, fmt.Errorf("begin return transition: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()
	current, err := lockReturn(ctx, tx, returnID)
	if err != nil {
		return ReturnArrangement{}, err
	}
	next, eventType, message, ok := returnTransition(current.Status, transition)
	if !ok {
		return ReturnArrangement{}, ErrInvalidState
	}
	if _, err := tx.Exec(ctx, `
		UPDATE return_arrangements SET status = $2, updated_at = now(),
			completed_at = CASE WHEN $2 IN ('returned', 'closed') THEN COALESCE(completed_at, now()) ELSE completed_at END,
			closed_at = CASE WHEN $2 = 'closed' THEN now() ELSE closed_at END
		WHERE id = $1::uuid`, returnID, next); err != nil {
		return ReturnArrangement{}, fmt.Errorf("transition return: %w", err)
	}
	if transition == TransitionClose {
		if _, err := tx.Exec(ctx, `
			UPDATE reports SET status = 'closed', closed_at = now(), updated_at = now()
			WHERE id IN ($1::uuid, $2::uuid) AND status IN ('active', 'hidden')`, current.LostReportID, current.FoundReportID); err != nil {
			return ReturnArrangement{}, fmt.Errorf("close returned reports: %w", err)
		}
	}
	if err := recordReturnTransition(ctx, tx, current, actorID, returnID, eventType, message); err != nil {
		return ReturnArrangement{}, err
	}
	if err := tx.Commit(ctx); err != nil {
		return ReturnArrangement{}, fmt.Errorf("commit return transition: %w", err)
	}
	return repository.ByID(ctx, returnID)
}

func (repository *Repository) timelineEvents(ctx context.Context, reference, subjectType, status string) (Timeline, error) {
	rows, err := repository.pool.Query(ctx, `
		SELECT id::text, event_type, message, created_at
		FROM tracking_events
		WHERE subject_type = $1 AND subject_id = $2::uuid
		ORDER BY created_at, id`, subjectType, reference)
	if err != nil {
		return Timeline{}, fmt.Errorf("list tracking events: %w", err)
	}
	defer rows.Close()
	events := make([]Event, 0)
	for rows.Next() {
		var event Event
		if err := rows.Scan(&event.ID, &event.EventType, &event.Message, &event.CreatedAt); err != nil {
			return Timeline{}, fmt.Errorf("scan tracking event: %w", err)
		}
		events = append(events, event)
	}
	if err := rows.Err(); err != nil {
		return Timeline{}, fmt.Errorf("iterate tracking events: %w", err)
	}
	return Timeline{Reference: reference, ReferenceType: subjectType, CurrentStatus: status, Events: events}, nil
}

type rowScanner interface{ Scan(...any) error }

func scanReturn(row rowScanner) (ReturnArrangement, error) {
	var value ReturnArrangement
	err := row.Scan(
		&value.ID, &value.ClaimID, &value.Status, &value.PickupAt, &value.PickupLocation,
		&value.PrivateNotes, &value.CreatedAt, &value.UpdatedAt, &value.CompletedAt, &value.ClosedAt,
		&value.ClaimantID, &value.FoundReporterID, &value.LostReportID, &value.FoundReportID,
	)
	return value, err
}

func lockReturn(ctx context.Context, tx pgx.Tx, returnID string) (ReturnArrangement, error) {
	value, err := scanReturn(tx.QueryRow(ctx, `
		SELECT `+returnSelect+`
		FROM return_arrangements a
		JOIN claims c ON c.id = a.claim_id
		JOIN reports found ON found.id = c.found_report_id
		WHERE a.id = $1::uuid FOR UPDATE OF a`, returnID))
	if errors.Is(err, pgx.ErrNoRows) {
		return ReturnArrangement{}, ErrNotFound
	}
	if err != nil {
		return ReturnArrangement{}, fmt.Errorf("lock return arrangement: %w", err)
	}
	return value, nil
}

func recordReturnTransition(ctx context.Context, tx pgx.Tx, current ReturnArrangement, actorID, returnID, eventType, message string) error {
	if _, err := tx.Exec(ctx, `
		INSERT INTO tracking_events (subject_type, subject_id, event_type, actor_id, message)
		VALUES ('return', $1::uuid, $2, $3::uuid, $4)`, returnID, eventType, actorID, message); err != nil {
		return fmt.Errorf("track return transition: %w", err)
	}
	if err := notifyParties(ctx, tx, current.ClaimantID, current.FoundReporterID, eventType, "Return status updated", message, "/tracking"); err != nil {
		return err
	}
	if _, err := tx.Exec(ctx, `
		INSERT INTO audit_events (actor_id, action, subject_type, subject_id)
		VALUES ($1::uuid, $2, 'return', $3::uuid)`, actorID, eventType, returnID); err != nil {
		return fmt.Errorf("audit return transition: %w", err)
	}
	return nil
}

func notifyParties(ctx context.Context, tx pgx.Tx, claimantID, foundReporterID, notificationType, title, message, path string) error {
	if _, err := tx.Exec(ctx, `
		INSERT INTO notifications (user_id, notification_type, title, message, related_path)
		SELECT DISTINCT user_id, $3, $4, $5, $6
		FROM (VALUES ($1::uuid), ($2::uuid)) AS recipients(user_id)
`, claimantID, foundReporterID, notificationType, title, message, path); err != nil {
		return fmt.Errorf("notify return parties: %w", err)
	}
	return nil
}

func returnTransition(current ReturnStatus, transition Transition) (ReturnStatus, string, string, bool) {
	switch transition {
	case TransitionPickup:
		if current == StatusScheduled {
			return StatusPickedUp, "return_picked_up", "The item pickup was confirmed.", true
		}
	case TransitionComplete:
		if current == StatusPickedUp {
			return StatusReturned, "return_completed", "The item was marked as returned.", true
		}
	case TransitionClose:
		if current == StatusReturned {
			return StatusClosed, "return_closed", "The return workflow was closed.", true
		}
	case TransitionCancel:
		if current == StatusScheduling || current == StatusScheduled {
			return StatusCancelled, "return_cancelled", "The return arrangement was cancelled.", true
		}
	}
	return "", "", "", false
}
