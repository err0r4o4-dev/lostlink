package matching

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct{ pool *pgxpool.Pool }

func NewRepository(pool *pgxpool.Pool) *Repository { return &Repository{pool: pool} }

const runColumns = `id::text, report_id::text, requested_by::text, status, model_version, config_version,
candidate_count, failure_code, created_at, completed_at`

const matchSelectColumns = `m.id::text, m.source_report_id::text, m.score, m.signals,
m.model_version, m.config_version, m.review_status, m.created_at,
r.id::text, r.report_type, r.item_name, r.category, r.public_description,
r.event_date::text, r.approximate_location, r.created_at, r.status`

func (repository *Repository) ReportForMatching(ctx context.Context, reportID string) (ReportInput, error) {
	value, err := scanReportInput(repository.pool.QueryRow(ctx, `
		SELECT id::text, reporter_id::text, report_type, item_name, category,
		       public_description, event_date::text, approximate_location, status
		FROM reports WHERE id = $1::uuid`, reportID))
	if errors.Is(err, pgx.ErrNoRows) {
		return ReportInput{}, ErrNotFound
	}
	if err != nil {
		return ReportInput{}, fmt.Errorf("read matching report: %w", err)
	}
	return value, nil
}

func (repository *Repository) EligibleCandidates(ctx context.Context, source ReportInput, limit int) ([]ReportInput, error) {
	rows, err := repository.pool.Query(ctx, `
		SELECT id::text, reporter_id::text, report_type, item_name, category,
		       public_description, event_date::text, approximate_location, status
		FROM reports
		WHERE report_type = 'found'
		  AND status = 'active'
		  AND lower(category) = lower($1)
		  AND abs(event_date - $2::date) <= 180
		  AND id <> $3::uuid
		ORDER BY abs(event_date - $2::date), created_at DESC
		LIMIT $4`, source.Category, source.EventDate, source.ID, limit)
	if err != nil {
		return nil, fmt.Errorf("list matching candidates: %w", err)
	}
	defer rows.Close()
	values := make([]ReportInput, 0)
	for rows.Next() {
		value, err := scanReportInput(rows)
		if err != nil {
			return nil, fmt.Errorf("scan matching candidate: %w", err)
		}
		values = append(values, value)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate matching candidates: %w", err)
	}
	return values, nil
}

func (repository *Repository) BeginRun(ctx context.Context, reportID, requesterID, idempotencyKey string) (Run, bool, error) {
	run, err := scanRun(repository.pool.QueryRow(ctx, `
		WITH allowed AS (
			SELECT 1 WHERE (
				SELECT count(*) FROM matching_runs
				WHERE requested_by = $2::uuid AND created_at > now() - interval '1 minute'
			) < 5
		)
		INSERT INTO matching_runs (report_id, requested_by, idempotency_key, status)
		SELECT $1::uuid, $2::uuid, $3::uuid, 'processing' FROM allowed
		ON CONFLICT (report_id, requested_by, idempotency_key) DO NOTHING
		RETURNING `+runColumns, reportID, requesterID, idempotencyKey))
	if err == nil {
		return run, false, nil
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return Run{}, false, fmt.Errorf("create matching run: %w", err)
	}
	run, err = scanRun(repository.pool.QueryRow(ctx, `
		SELECT `+runColumns+` FROM matching_runs
		WHERE report_id = $1::uuid AND requested_by = $2::uuid AND idempotency_key = $3::uuid`, reportID, requesterID, idempotencyKey))
	if errors.Is(err, pgx.ErrNoRows) {
		return Run{}, false, ErrRateLimited
	}
	if err != nil {
		return Run{}, false, fmt.Errorf("read matching retry: %w", err)
	}
	return run, true, nil
}

func (repository *Repository) CompleteRun(ctx context.Context, run Run, source ReportInput, vectors map[string][]float64, modelVersion, configVersion string) ([]Match, error) {
	tx, err := repository.pool.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("begin matching completion: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	for reportID, vector := range vectors {
		if _, err := tx.Exec(ctx, `
			INSERT INTO report_embeddings_384 (report_id, embedding, model_version, config_version, updated_at)
			VALUES ($1::uuid, $2::vector, $3, $4, now())
			ON CONFLICT (report_id) DO UPDATE SET
				embedding = EXCLUDED.embedding,
				model_version = EXCLUDED.model_version,
				config_version = EXCLUDED.config_version,
				updated_at = now()`, reportID, vectorLiteral(vector), modelVersion, configVersion); err != nil {
			return nil, fmt.Errorf("store report embedding: %w", err)
		}
	}
	sourceVector, ok := vectors[source.ID]
	if !ok {
		return nil, ErrAIUnavailable
	}
	candidateIDs := make([]string, 0, len(vectors)-1)
	for reportID := range vectors {
		if reportID != source.ID {
			candidateIDs = append(candidateIDs, reportID)
		}
	}
	if _, err := tx.Exec(ctx, `
		WITH ranked AS (
			SELECT e.report_id AS candidate_report_id,
			       LEAST(1.0, GREATEST(0.0, 1.0 - (e.embedding <=> $3::vector))) AS score,
			       to_jsonb(array_remove(ARRAY[
			           'category_similarity'::text,
			           CASE WHEN lower(r.approximate_location) = lower($6) THEN 'location_similarity' END,
			           CASE WHEN abs(r.event_date - $7::date) <= 7 THEN 'date_proximity' END
			       ], NULL)) AS signals
			FROM report_embeddings_384 e
			JOIN reports r ON r.id = e.report_id
			WHERE e.report_id <> $2::uuid
			  AND r.report_type = 'found'
			  AND r.status = 'active'
			  AND lower(r.category) = lower($5)
			  AND abs(r.event_date - $7::date) <= 180
			  AND e.model_version = $4
			  AND e.config_version = $8
			  AND e.report_id::text = ANY($9::text[])
			ORDER BY e.embedding <=> $3::vector
			LIMIT 20
		)
		INSERT INTO matches (
			run_id, source_report_id, candidate_report_id, score, signals, model_version, config_version
		)
		SELECT $1::uuid, $2::uuid, candidate_report_id, score, signals, $4, $8
		FROM ranked WHERE score >= 0.10
		ON CONFLICT (source_report_id, candidate_report_id, model_version, config_version)
		DO UPDATE SET
			run_id = EXCLUDED.run_id,
			score = EXCLUDED.score,
			signals = EXCLUDED.signals,
			review_status = 'pending',
			reviewed_by = NULL,
			reviewed_at = NULL,
			created_at = now()`,
		run.ID, source.ID, vectorLiteral(sourceVector), modelVersion, source.Category,
		source.ApproximateLocation, source.EventDate, configVersion, candidateIDs,
	); err != nil {
		return nil, fmt.Errorf("store matching results: %w", err)
	}

	var count int
	if err := tx.QueryRow(ctx, `SELECT count(*) FROM matches WHERE run_id = $1::uuid`, run.ID).Scan(&count); err != nil {
		return nil, fmt.Errorf("count matching results: %w", err)
	}
	if _, err := tx.Exec(ctx, `
		UPDATE matching_runs SET status = 'completed', model_version = $2, config_version = $3,
		candidate_count = $4, failure_code = NULL, completed_at = now()
		WHERE id = $1::uuid AND status = 'processing'`, run.ID, modelVersion, configVersion, count); err != nil {
		return nil, fmt.Errorf("complete matching run: %w", err)
	}
	if count > 0 {
		if _, err := tx.Exec(ctx, `
			INSERT INTO notifications (user_id, notification_type, title, message, related_path)
			VALUES ($1::uuid, 'match_found', 'Potential matches found',
			        'LostLink found possible matches for your lost report.', '/matches')`, source.ReporterID); err != nil {
			return nil, fmt.Errorf("notify matching result: %w", err)
		}
		if _, err := tx.Exec(ctx, `
			INSERT INTO tracking_events (subject_type, subject_id, event_type, actor_id, message)
			VALUES ('report', $1::uuid, 'matches_generated', $2::uuid, 'Potential matches were generated.')`, source.ID, run.RequestedBy); err != nil {
			return nil, fmt.Errorf("track matching result: %w", err)
		}
	}
	if _, err := tx.Exec(ctx, `
		INSERT INTO audit_events (actor_id, action, subject_type, subject_id, metadata)
		VALUES ($1::uuid, 'matching.completed', 'report', $2::uuid,
		        jsonb_build_object('candidate_count', $3::integer))`, run.RequestedBy, source.ID, count); err != nil {
		return nil, fmt.Errorf("audit matching run: %w", err)
	}

	values, err := queryMatches(ctx, tx, `WHERE m.run_id = $1::uuid ORDER BY m.score DESC, m.created_at DESC`, run.ID)
	if err != nil {
		return nil, err
	}
	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("commit matching completion: %w", err)
	}
	return values, nil
}

func (repository *Repository) FailRun(ctx context.Context, runID, failureCode string) error {
	_, err := repository.pool.Exec(ctx, `
		UPDATE matching_runs SET status = 'failed', failure_code = $2, completed_at = now()
		WHERE id = $1::uuid AND status = 'processing'`, runID, failureCode)
	if err != nil {
		return fmt.Errorf("fail matching run: %w", err)
	}
	return nil
}

func (repository *Repository) MatchesForReport(ctx context.Context, reportID string) ([]Match, error) {
	return queryMatches(ctx, repository.pool, `
		WHERE m.run_id = (
			SELECT id FROM matching_runs
			WHERE report_id = $1::uuid AND status = 'completed'
			ORDER BY created_at DESC, id DESC LIMIT 1
		) AND r.status = 'active'
		ORDER BY m.score DESC, m.created_at DESC`, reportID)
}

func (repository *Repository) MatchesForRun(ctx context.Context, runID string) ([]Match, error) {
	return queryMatches(ctx, repository.pool, `
		WHERE m.run_id = $1::uuid AND r.status = 'active'
		ORDER BY m.score DESC, m.created_at DESC`, runID)
}

func (repository *Repository) MatchByID(ctx context.Context, matchID string) (Match, string, error) {
	row := repository.pool.QueryRow(ctx, `
		SELECT `+matchSelectColumns+`, source.reporter_id::text
		FROM matches m
		JOIN reports r ON r.id = m.candidate_report_id
		JOIN reports source ON source.id = m.source_report_id
		WHERE m.id = $1::uuid`, matchID)
	value, ownerID, err := scanMatchWithOwner(row)
	if errors.Is(err, pgx.ErrNoRows) {
		return Match{}, "", ErrNotFound
	}
	if err != nil {
		return Match{}, "", fmt.Errorf("read match: %w", err)
	}
	return value, ownerID, nil
}

func (repository *Repository) StaffList(ctx context.Context, reviewStatus string, limit, offset int) ([]Match, error) {
	return queryMatches(ctx, repository.pool, `
		WHERE ($1 = '' OR m.review_status = $1)
		ORDER BY m.created_at DESC, m.score DESC LIMIT $2 OFFSET $3`, reviewStatus, limit, offset)
}

func (repository *Repository) Review(ctx context.Context, actorID, matchID string, action ReviewAction) (Match, error) {
	next := "reviewed"
	if action == ReviewDismiss {
		next = "dismissed"
	}
	tx, err := repository.pool.Begin(ctx)
	if err != nil {
		return Match{}, fmt.Errorf("begin match review: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	var current string
	if err := tx.QueryRow(ctx, `SELECT review_status FROM matches WHERE id = $1::uuid FOR UPDATE`, matchID).Scan(&current); errors.Is(err, pgx.ErrNoRows) {
		return Match{}, ErrNotFound
	} else if err != nil {
		return Match{}, fmt.Errorf("read match review state: %w", err)
	}
	if current != "pending" {
		return Match{}, ErrInvalidState
	}
	if _, err := tx.Exec(ctx, `
		UPDATE matches SET review_status = $2, reviewed_by = $3::uuid, reviewed_at = now()
		WHERE id = $1::uuid`, matchID, next, actorID); err != nil {
		return Match{}, fmt.Errorf("review match: %w", err)
	}
	if _, err := tx.Exec(ctx, `
		INSERT INTO audit_events (actor_id, action, subject_type, subject_id)
		VALUES ($1::uuid, $2, 'match', $3::uuid)`, actorID, "match."+string(action), matchID); err != nil {
		return Match{}, fmt.Errorf("audit match review: %w", err)
	}
	values, err := queryMatches(ctx, tx, `WHERE m.id = $1::uuid`, matchID)
	if err != nil || len(values) != 1 {
		if err != nil {
			return Match{}, err
		}
		return Match{}, ErrNotFound
	}
	if err := tx.Commit(ctx); err != nil {
		return Match{}, fmt.Errorf("commit match review: %w", err)
	}
	return values[0], nil
}

type rowScanner interface{ Scan(...any) error }

type queryer interface {
	Query(context.Context, string, ...any) (pgx.Rows, error)
}

func scanRun(row rowScanner) (Run, error) {
	var value Run
	err := row.Scan(&value.ID, &value.ReportID, &value.RequestedBy, &value.Status, &value.ModelVersion, &value.ConfigVersion,
		&value.CandidateCount, &value.FailureCode, &value.CreatedAt, &value.CompletedAt)
	return value, err
}

func scanReportInput(row rowScanner) (ReportInput, error) {
	var value ReportInput
	err := row.Scan(&value.ID, &value.ReporterID, &value.ReportType, &value.ItemName, &value.Category,
		&value.PublicDescription, &value.EventDate, &value.ApproximateLocation, &value.Status)
	return value, err
}

func queryMatches(ctx context.Context, queryer queryer, suffix string, args ...any) ([]Match, error) {
	rows, err := queryer.Query(ctx, `
		SELECT `+matchSelectColumns+`
		FROM matches m JOIN reports r ON r.id = m.candidate_report_id `+suffix, args...)
	if err != nil {
		return nil, fmt.Errorf("query matches: %w", err)
	}
	defer rows.Close()
	values := make([]Match, 0)
	for rows.Next() {
		value, err := scanMatch(rows)
		if err != nil {
			return nil, fmt.Errorf("scan match: %w", err)
		}
		values = append(values, value)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate matches: %w", err)
	}
	return values, nil
}

func scanMatch(row rowScanner) (Match, error) {
	var value Match
	var signals []byte
	err := row.Scan(
		&value.ID, &value.SourceReportID, &value.Score, &signals,
		&value.ModelVersion, &value.ConfigVersion, &value.ReviewStatus, &value.CreatedAt,
		&value.Candidate.ID, &value.Candidate.ReportType, &value.Candidate.ItemName, &value.Candidate.Category,
		&value.Candidate.PublicDescription, &value.Candidate.EventDate, &value.Candidate.ApproximateLocation,
		&value.Candidate.CreatedAt, &value.Candidate.Status,
	)
	if err != nil {
		return Match{}, err
	}
	if err := json.Unmarshal(signals, &value.Signals); err != nil {
		return Match{}, err
	}
	return value, nil
}

func scanMatchWithOwner(row rowScanner) (Match, string, error) {
	var value Match
	var ownerID string
	var signals []byte
	err := row.Scan(
		&value.ID, &value.SourceReportID, &value.Score, &signals,
		&value.ModelVersion, &value.ConfigVersion, &value.ReviewStatus, &value.CreatedAt,
		&value.Candidate.ID, &value.Candidate.ReportType, &value.Candidate.ItemName, &value.Candidate.Category,
		&value.Candidate.PublicDescription, &value.Candidate.EventDate, &value.Candidate.ApproximateLocation,
		&value.Candidate.CreatedAt, &value.Candidate.Status, &ownerID,
	)
	if err != nil {
		return Match{}, "", err
	}
	if err := json.Unmarshal(signals, &value.Signals); err != nil {
		return Match{}, "", err
	}
	return value, ownerID, nil
}
