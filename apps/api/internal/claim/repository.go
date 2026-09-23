package claim

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct{ pool *pgxpool.Pool }

func NewRepository(pool *pgxpool.Pool) *Repository { return &Repository{pool: pool} }

const claimColumns = `id::text, match_id::text, lost_report_id::text, found_report_id::text,
claimant_id::text, status, submitted_at, reviewed_at, created_at, updated_at`

const evidenceColumns = `id::text, evidence_type, description, content_type, size_bytes,
width, height, created_at, object_key`

const decisionColumns = `id::text, action, reason, previous_status, next_status, created_at`

func (repository *Repository) Create(ctx context.Context, claimantID, matchID, idempotencyKey string) (Claim, error) {
	tx, err := repository.pool.Begin(ctx)
	if err != nil {
		return Claim{}, fmt.Errorf("begin claim creation: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	var lostReportID, foundReportID, sourceOwnerID, sourceType, sourceStatus, candidateType, candidateStatus, reviewStatus string
	err = tx.QueryRow(ctx, `
		SELECT m.source_report_id::text, m.candidate_report_id::text,
		       source.reporter_id::text, source.report_type, source.status,
		       candidate.report_type, candidate.status, m.review_status
		FROM matches m
		JOIN reports source ON source.id = m.source_report_id
		JOIN reports candidate ON candidate.id = m.candidate_report_id
		WHERE m.id = $1::uuid`, matchID).Scan(
		&lostReportID, &foundReportID, &sourceOwnerID, &sourceType, &sourceStatus,
		&candidateType, &candidateStatus, &reviewStatus,
	)
	if errors.Is(err, pgx.ErrNoRows) || sourceOwnerID != claimantID {
		return Claim{}, ErrNotFound
	}
	if err != nil {
		return Claim{}, fmt.Errorf("read claim match: %w", err)
	}
	if sourceType != "lost" || candidateType != "found" || sourceStatus != "active" || candidateStatus != "active" || reviewStatus == "dismissed" {
		return Claim{}, ErrInvalidState
	}

	value, err := scanClaim(tx.QueryRow(ctx, `
		INSERT INTO claims (match_id, lost_report_id, found_report_id, claimant_id, idempotency_key)
		VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5::uuid)
		ON CONFLICT (claimant_id, idempotency_key) DO NOTHING
		RETURNING `+claimColumns, matchID, lostReportID, foundReportID, claimantID, idempotencyKey))
	if errors.Is(err, pgx.ErrNoRows) {
		existing, readErr := scanClaim(tx.QueryRow(ctx, `
			SELECT `+claimColumns+` FROM claims
			WHERE claimant_id = $1::uuid AND idempotency_key = $2::uuid`, claimantID, idempotencyKey))
		if readErr != nil {
			return Claim{}, fmt.Errorf("read idempotent claim: %w", readErr)
		}
		if existing.MatchID != matchID {
			return Claim{}, ErrIdempotencyConflict
		}
		return existing, nil
	}
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) && pgErr.Code == "23505" {
		return Claim{}, ErrConflict
	}
	if err != nil {
		return Claim{}, fmt.Errorf("create claim: %w", err)
	}
	if _, err := tx.Exec(ctx, `
		INSERT INTO tracking_events (subject_type, subject_id, event_type, actor_id, message)
		VALUES ('claim', $1::uuid, 'claim_created', $2::uuid, 'Claim draft created.')`, value.ID, claimantID); err != nil {
		return Claim{}, fmt.Errorf("track claim creation: %w", err)
	}
	if _, err := tx.Exec(ctx, `
		INSERT INTO audit_events (actor_id, action, subject_type, subject_id)
		VALUES ($1::uuid, 'claim.created', 'claim', $2::uuid)`, claimantID, value.ID); err != nil {
		return Claim{}, fmt.Errorf("audit claim creation: %w", err)
	}
	if err := tx.Commit(ctx); err != nil {
		return Claim{}, fmt.Errorf("commit claim creation: %w", err)
	}
	return repository.ByID(ctx, value.ID)
}

func (repository *Repository) ByClaimant(ctx context.Context, claimantID string, limit, offset int) ([]Claim, error) {
	rows, err := repository.pool.Query(ctx, `
		SELECT `+claimColumns+` FROM claims
		WHERE claimant_id = $1::uuid
		ORDER BY created_at DESC, id DESC LIMIT $2 OFFSET $3`, claimantID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("list claims: %w", err)
	}
	values, err := collectClaims(rows)
	rows.Close()
	if err != nil {
		return nil, err
	}
	for index := range values {
		if err := repository.loadDetails(ctx, &values[index]); err != nil {
			return nil, err
		}
	}
	return values, nil
}

func (repository *Repository) ByID(ctx context.Context, claimID string) (Claim, error) {
	value, err := scanClaim(repository.pool.QueryRow(ctx, `SELECT `+claimColumns+` FROM claims WHERE id = $1::uuid`, claimID))
	if errors.Is(err, pgx.ErrNoRows) {
		return Claim{}, ErrNotFound
	}
	if err != nil {
		return Claim{}, fmt.Errorf("read claim: %w", err)
	}
	if err := repository.loadDetails(ctx, &value); err != nil {
		return Claim{}, err
	}
	return value, nil
}

func (repository *Repository) CanEdit(ctx context.Context, claimantID, claimID string) error {
	var status Status
	err := repository.pool.QueryRow(ctx, `
		SELECT status FROM claims WHERE id = $1::uuid AND claimant_id = $2::uuid`, claimID, claimantID).Scan(&status)
	if errors.Is(err, pgx.ErrNoRows) {
		return ErrNotFound
	}
	if err != nil {
		return fmt.Errorf("authorize claim evidence: %w", err)
	}
	if status != StatusDraft && status != StatusNeedsMoreInfo {
		return ErrInvalidState
	}
	return nil
}

func (repository *Repository) AddStatement(ctx context.Context, claimantID, claimID, description string) (Evidence, error) {
	tx, err := repository.pool.Begin(ctx)
	if err != nil {
		return Evidence{}, fmt.Errorf("begin claim evidence: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()
	if _, err := lockEditableClaim(ctx, tx, claimantID, claimID); err != nil {
		return Evidence{}, err
	}
	if err := enforceEvidenceLimit(ctx, tx, claimID); err != nil {
		return Evidence{}, err
	}
	value, err := scanEvidence(tx.QueryRow(ctx, `
		INSERT INTO claim_evidence (claim_id, evidence_type, description)
		VALUES ($1::uuid, 'statement', $2)
		RETURNING `+evidenceColumns, claimID, description))
	if err != nil {
		return Evidence{}, fmt.Errorf("add claim statement: %w", err)
	}
	if _, err := tx.Exec(ctx, `
		INSERT INTO audit_events (actor_id, action, subject_type, subject_id)
		VALUES ($1::uuid, 'claim.evidence_added', 'claim', $2::uuid)`, claimantID, claimID); err != nil {
		return Evidence{}, fmt.Errorf("audit claim evidence: %w", err)
	}
	if err := tx.Commit(ctx); err != nil {
		return Evidence{}, fmt.Errorf("commit claim statement: %w", err)
	}
	return value, nil
}

func (repository *Repository) AddImage(ctx context.Context, claimantID, claimID string, input StoredEvidence) (Evidence, error) {
	tx, err := repository.pool.Begin(ctx)
	if err != nil {
		return Evidence{}, fmt.Errorf("begin claim image evidence: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()
	if _, err := lockEditableClaim(ctx, tx, claimantID, claimID); err != nil {
		return Evidence{}, err
	}
	if err := enforceEvidenceLimit(ctx, tx, claimID); err != nil {
		return Evidence{}, err
	}
	value, err := scanEvidence(tx.QueryRow(ctx, `
		INSERT INTO claim_evidence (
			claim_id, evidence_type, description, object_key, content_type,
			size_bytes, width, height, sha256
		) VALUES ($1::uuid, 'image', $2, $3, $4, $5, $6, $7, $8)
		RETURNING `+evidenceColumns,
		claimID, input.Description, input.ObjectKey, input.ContentType,
		input.SizeBytes, input.Width, input.Height, input.SHA256[:],
	))
	if err != nil {
		return Evidence{}, fmt.Errorf("add claim image evidence: %w", err)
	}
	if _, err := tx.Exec(ctx, `
		INSERT INTO audit_events (actor_id, action, subject_type, subject_id)
		VALUES ($1::uuid, 'claim.evidence_added', 'claim', $2::uuid)`, claimantID, claimID); err != nil {
		return Evidence{}, fmt.Errorf("audit claim image evidence: %w", err)
	}
	if err := tx.Commit(ctx); err != nil {
		return Evidence{}, fmt.Errorf("commit claim image evidence: %w", err)
	}
	return value, nil
}

func (repository *Repository) DeleteEvidence(ctx context.Context, claimantID, claimID, evidenceID string) (Evidence, error) {
	tx, err := repository.pool.Begin(ctx)
	if err != nil {
		return Evidence{}, fmt.Errorf("begin evidence deletion: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()
	if _, err := lockEditableClaim(ctx, tx, claimantID, claimID); err != nil {
		return Evidence{}, err
	}
	value, err := scanEvidence(tx.QueryRow(ctx, `
		DELETE FROM claim_evidence WHERE id = $1::uuid AND claim_id = $2::uuid
		RETURNING `+evidenceColumns, evidenceID, claimID))
	if errors.Is(err, pgx.ErrNoRows) {
		return Evidence{}, ErrNotFound
	}
	if err != nil {
		return Evidence{}, fmt.Errorf("delete claim evidence: %w", err)
	}
	if _, err := tx.Exec(ctx, `
		INSERT INTO audit_events (actor_id, action, subject_type, subject_id)
		VALUES ($1::uuid, 'claim.evidence_deleted', 'claim', $2::uuid)`, claimantID, claimID); err != nil {
		return Evidence{}, fmt.Errorf("audit evidence deletion: %w", err)
	}
	if err := tx.Commit(ctx); err != nil {
		return Evidence{}, fmt.Errorf("commit evidence deletion: %w", err)
	}
	return value, nil
}

func (repository *Repository) Submit(ctx context.Context, claimantID, claimID string) (Claim, error) {
	tx, err := repository.pool.Begin(ctx)
	if err != nil {
		return Claim{}, fmt.Errorf("begin claim submission: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()
	current, err := lockEditableClaim(ctx, tx, claimantID, claimID)
	if err != nil {
		return Claim{}, err
	}
	var count int
	if err := tx.QueryRow(ctx, `SELECT count(*) FROM claim_evidence WHERE claim_id = $1::uuid`, claimID).Scan(&count); err != nil {
		return Claim{}, fmt.Errorf("count claim evidence: %w", err)
	}
	if count == 0 {
		return Claim{}, ErrEvidenceRequired
	}
	if _, err := tx.Exec(ctx, `
		UPDATE claims SET status = 'submitted', submitted_at = COALESCE(submitted_at, now()), updated_at = now()
		WHERE id = $1::uuid`, claimID); err != nil {
		return Claim{}, fmt.Errorf("submit claim: %w", err)
	}
	if _, err := tx.Exec(ctx, `
		INSERT INTO tracking_events (subject_type, subject_id, event_type, actor_id, message)
		VALUES ('claim', $1::uuid, 'claim_submitted', $2::uuid, 'Claim submitted for staff review.')`, claimID, claimantID); err != nil {
		return Claim{}, fmt.Errorf("track claim submission: %w", err)
	}
	if _, err := tx.Exec(ctx, `
		INSERT INTO notifications (user_id, notification_type, title, message, related_path)
		SELECT id, 'claim_submitted', 'Claim ready for review',
		       'A claim is waiting for authorized review.', '/staff/claims'
		FROM users WHERE role IN ('staff', 'admin')`); err != nil {
		return Claim{}, fmt.Errorf("notify claim submission: %w", err)
	}
	if _, err := tx.Exec(ctx, `
		INSERT INTO audit_events (actor_id, action, subject_type, subject_id, metadata)
		VALUES ($1::uuid, 'claim.submitted', 'claim', $2::uuid,
		        jsonb_build_object('previous_status', $3::text))`, claimantID, claimID, current.Status); err != nil {
		return Claim{}, fmt.Errorf("audit claim submission: %w", err)
	}
	if err := tx.Commit(ctx); err != nil {
		return Claim{}, fmt.Errorf("commit claim submission: %w", err)
	}
	return repository.ByID(ctx, claimID)
}

func (repository *Repository) Cancel(ctx context.Context, claimantID, claimID string) (Claim, error) {
	tx, err := repository.pool.Begin(ctx)
	if err != nil {
		return Claim{}, fmt.Errorf("begin claim cancellation: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()
	current, err := lockOwnedClaim(ctx, tx, claimantID, claimID)
	if err != nil {
		return Claim{}, err
	}
	if current.Status == StatusApproved || current.Status == StatusRejected || current.Status == StatusCancelled {
		return Claim{}, ErrInvalidState
	}
	if _, err := tx.Exec(ctx, `UPDATE claims SET status = 'cancelled', updated_at = now() WHERE id = $1::uuid`, claimID); err != nil {
		return Claim{}, fmt.Errorf("cancel claim: %w", err)
	}
	if _, err := tx.Exec(ctx, `
		INSERT INTO tracking_events (subject_type, subject_id, event_type, actor_id, message)
		VALUES ('claim', $1::uuid, 'claim_cancelled', $2::uuid, 'Claim cancelled by claimant.')`, claimID, claimantID); err != nil {
		return Claim{}, fmt.Errorf("track claim cancellation: %w", err)
	}
	if _, err := tx.Exec(ctx, `
		INSERT INTO audit_events (actor_id, action, subject_type, subject_id)
		VALUES ($1::uuid, 'claim.cancelled', 'claim', $2::uuid)`, claimantID, claimID); err != nil {
		return Claim{}, fmt.Errorf("audit claim cancellation: %w", err)
	}
	if err := tx.Commit(ctx); err != nil {
		return Claim{}, fmt.Errorf("commit claim cancellation: %w", err)
	}
	return repository.ByID(ctx, claimID)
}

func (repository *Repository) StaffList(ctx context.Context, status Status, limit, offset int) ([]Claim, error) {
	rows, err := repository.pool.Query(ctx, `
		SELECT `+claimColumns+` FROM claims
		WHERE ($1 = '' OR status = $1)
		ORDER BY COALESCE(submitted_at, created_at) DESC, id DESC
		LIMIT $2 OFFSET $3`, status, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("list staff claims: %w", err)
	}
	return collectClaims(rows)
}

func (repository *Repository) Decide(ctx context.Context, actorID, claimID string, action Action, reason string) (Claim, error) {
	tx, err := repository.pool.Begin(ctx)
	if err != nil {
		return Claim{}, fmt.Errorf("begin claim decision: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()
	current, err := scanClaim(tx.QueryRow(ctx, `SELECT `+claimColumns+` FROM claims WHERE id = $1::uuid FOR UPDATE`, claimID))
	if errors.Is(err, pgx.ErrNoRows) {
		return Claim{}, ErrNotFound
	}
	if err != nil {
		return Claim{}, fmt.Errorf("read claim decision state: %w", err)
	}
	next, ok := nextStatus(current.Status, action)
	if !ok {
		return Claim{}, ErrInvalidState
	}
	reviewed := action == ActionApprove || action == ActionReject
	if _, err := tx.Exec(ctx, `
		UPDATE claims SET status = $2,
			reviewed_at = CASE WHEN $3 THEN now() ELSE reviewed_at END,
			updated_at = now()
		WHERE id = $1::uuid`, claimID, next, reviewed); err != nil {
		return Claim{}, fmt.Errorf("update claim decision: %w", err)
	}
	if _, err := tx.Exec(ctx, `
		INSERT INTO verification_decisions (
			claim_id, decided_by, action, reason, previous_status, next_status
		) VALUES ($1::uuid, $2::uuid, $3, NULLIF($4, ''), $5, $6)`,
		claimID, actorID, action, reason, current.Status, next,
	); err != nil {
		return Claim{}, fmt.Errorf("record verification decision: %w", err)
	}
	title, message := decisionNotification(action)
	if _, err := tx.Exec(ctx, `
		INSERT INTO notifications (user_id, notification_type, title, message, related_path)
		VALUES ($1::uuid, $2, $3, $4, $5)`,
		current.ClaimantID, "claim_"+string(action), title, message, "/claims/"+claimID,
	); err != nil {
		return Claim{}, fmt.Errorf("notify claim decision: %w", err)
	}
	if _, err := tx.Exec(ctx, `
		INSERT INTO tracking_events (subject_type, subject_id, event_type, actor_id, message)
		VALUES ('claim', $1::uuid, $2, $3::uuid, $4)`, claimID, "claim_"+string(action), actorID, message); err != nil {
		return Claim{}, fmt.Errorf("track claim decision: %w", err)
	}
	if _, err := tx.Exec(ctx, `
		INSERT INTO audit_events (actor_id, action, subject_type, subject_id, metadata)
		VALUES ($1::uuid, $2, 'claim', $3::uuid,
		        jsonb_build_object('previous_status', $4::text, 'next_status', $5::text))`,
		actorID, "claim."+string(action), claimID, current.Status, next,
	); err != nil {
		return Claim{}, fmt.Errorf("audit claim decision: %w", err)
	}
	if err := tx.Commit(ctx); err != nil {
		return Claim{}, fmt.Errorf("commit claim decision: %w", err)
	}
	return repository.ByID(ctx, claimID)
}

func (repository *Repository) EvidenceByID(ctx context.Context, claimID, evidenceID string) (Evidence, string, error) {
	var value Evidence
	var claimantID string
	err := repository.pool.QueryRow(ctx, `
		SELECT e.id::text, e.evidence_type, e.description, e.content_type, e.size_bytes,
		       e.width, e.height, e.created_at, e.object_key, c.claimant_id::text
		FROM claim_evidence e JOIN claims c ON c.id = e.claim_id
		WHERE e.id = $1::uuid AND e.claim_id = $2::uuid`, evidenceID, claimID).Scan(
		&value.ID, &value.EvidenceType, &value.Description, &value.ContentType, &value.SizeBytes,
		&value.Width, &value.Height, &value.CreatedAt, &value.ObjectKey, &claimantID,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return Evidence{}, "", ErrNotFound
	}
	if err != nil {
		return Evidence{}, "", fmt.Errorf("read claim evidence: %w", err)
	}
	return value, claimantID, nil
}

func (repository *Repository) QueueObjectCleanup(ctx context.Context, objectKey, reason string) error {
	_, err := repository.pool.Exec(ctx, `
		INSERT INTO object_cleanup_tasks (object_key, reason)
		VALUES ($1, $2)
		ON CONFLICT (object_key) DO UPDATE SET reason = EXCLUDED.reason`, objectKey, reason)
	if err != nil {
		return fmt.Errorf("queue object cleanup: %w", err)
	}
	return nil
}

type rowScanner interface{ Scan(...any) error }

func scanClaim(row rowScanner) (Claim, error) {
	var value Claim
	err := row.Scan(
		&value.ID, &value.MatchID, &value.LostReportID, &value.FoundReportID,
		&value.ClaimantID, &value.Status, &value.SubmittedAt, &value.ReviewedAt,
		&value.CreatedAt, &value.UpdatedAt,
	)
	return value, err
}

func scanEvidence(row rowScanner) (Evidence, error) {
	var value Evidence
	err := row.Scan(
		&value.ID, &value.EvidenceType, &value.Description, &value.ContentType, &value.SizeBytes,
		&value.Width, &value.Height, &value.CreatedAt, &value.ObjectKey,
	)
	return value, err
}

func scanDecision(row rowScanner) (Decision, error) {
	var value Decision
	err := row.Scan(&value.ID, &value.Action, &value.Reason, &value.PreviousStatus, &value.NextStatus, &value.CreatedAt)
	return value, err
}

func collectClaims(rows pgx.Rows) ([]Claim, error) {
	defer rows.Close()
	values := make([]Claim, 0)
	for rows.Next() {
		value, err := scanClaim(rows)
		if err != nil {
			return nil, fmt.Errorf("scan claim: %w", err)
		}
		values = append(values, value)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate claims: %w", err)
	}
	return values, nil
}

func (repository *Repository) loadDetails(ctx context.Context, value *Claim) error {
	evidenceRows, err := repository.pool.Query(ctx, `
		SELECT `+evidenceColumns+` FROM claim_evidence
		WHERE claim_id = $1::uuid ORDER BY created_at, id`, value.ID)
	if err != nil {
		return fmt.Errorf("list claim evidence: %w", err)
	}
	value.Evidence = make([]Evidence, 0)
	for evidenceRows.Next() {
		evidence, err := scanEvidence(evidenceRows)
		if err != nil {
			evidenceRows.Close()
			return fmt.Errorf("scan claim evidence: %w", err)
		}
		value.Evidence = append(value.Evidence, evidence)
	}
	if err := evidenceRows.Err(); err != nil {
		evidenceRows.Close()
		return fmt.Errorf("iterate claim evidence: %w", err)
	}
	evidenceRows.Close()

	decisionRows, err := repository.pool.Query(ctx, `
		SELECT `+decisionColumns+` FROM verification_decisions
		WHERE claim_id = $1::uuid ORDER BY created_at, id`, value.ID)
	if err != nil {
		return fmt.Errorf("list claim decisions: %w", err)
	}
	defer decisionRows.Close()
	value.Decisions = make([]Decision, 0)
	for decisionRows.Next() {
		decision, err := scanDecision(decisionRows)
		if err != nil {
			return fmt.Errorf("scan claim decision: %w", err)
		}
		value.Decisions = append(value.Decisions, decision)
	}
	if err := decisionRows.Err(); err != nil {
		return fmt.Errorf("iterate claim decisions: %w", err)
	}
	return nil
}

func lockOwnedClaim(ctx context.Context, tx pgx.Tx, claimantID, claimID string) (Claim, error) {
	value, err := scanClaim(tx.QueryRow(ctx, `
		SELECT `+claimColumns+` FROM claims
		WHERE id = $1::uuid AND claimant_id = $2::uuid FOR UPDATE`, claimID, claimantID))
	if errors.Is(err, pgx.ErrNoRows) {
		return Claim{}, ErrNotFound
	}
	if err != nil {
		return Claim{}, fmt.Errorf("lock owned claim: %w", err)
	}
	return value, nil
}

func lockEditableClaim(ctx context.Context, tx pgx.Tx, claimantID, claimID string) (Claim, error) {
	value, err := lockOwnedClaim(ctx, tx, claimantID, claimID)
	if err != nil {
		return Claim{}, err
	}
	if value.Status != StatusDraft && value.Status != StatusNeedsMoreInfo {
		return Claim{}, ErrInvalidState
	}
	return value, nil
}

func enforceEvidenceLimit(ctx context.Context, tx pgx.Tx, claimID string) error {
	var count int
	if err := tx.QueryRow(ctx, `SELECT count(*) FROM claim_evidence WHERE claim_id = $1::uuid`, claimID).Scan(&count); err != nil {
		return fmt.Errorf("count claim evidence: %w", err)
	}
	if count >= 10 {
		return ErrEvidenceLimit
	}
	return nil
}

func nextStatus(current Status, action Action) (Status, bool) {
	switch action {
	case ActionStartReview:
		if current == StatusSubmitted {
			return StatusUnderReview, true
		}
	case ActionRequestMoreInfo:
		if current == StatusSubmitted || current == StatusUnderReview {
			return StatusNeedsMoreInfo, true
		}
	case ActionApprove:
		if current == StatusSubmitted || current == StatusUnderReview {
			return StatusApproved, true
		}
	case ActionReject:
		if current == StatusSubmitted || current == StatusUnderReview {
			return StatusRejected, true
		}
	}
	return "", false
}

func decisionNotification(action Action) (string, string) {
	switch action {
	case ActionStartReview:
		return "Claim under review", "Authorized staff started reviewing your claim."
	case ActionRequestMoreInfo:
		return "More information required", "Authorized staff requested more ownership information."
	case ActionApprove:
		return "Claim approved", "Your ownership claim was approved. Return scheduling can begin."
	default:
		return "Claim not approved", "Your ownership claim was not approved."
	}
}
