package report

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct{ pool *pgxpool.Pool }

func NewRepository(pool *pgxpool.Pool) *Repository { return &Repository{pool: pool} }

const reportColumns = `id::text, report_type, item_name, category, public_description,
event_date, approximate_time, approximate_location, created_at, withdrawn_at`

func (repository *Repository) Create(ctx context.Context, ownerID, key string, requestHash [32]byte, input CreateInput) (Report, error) {
	row := repository.pool.QueryRow(ctx, `
		INSERT INTO reports (
			reporter_id, report_type, item_name, category, public_description,
			event_date, approximate_time, approximate_location, idempotency_key, request_hash
		) VALUES ($1::uuid, $2, $3, $4, $5, $6::date, NULLIF($7, ''), $8, $9::uuid, $10)
		ON CONFLICT (reporter_id, idempotency_key) DO UPDATE
		SET idempotency_key = EXCLUDED.idempotency_key
		WHERE reports.request_hash = EXCLUDED.request_hash
		RETURNING `+reportColumns,
		ownerID, input.ReportType, input.ItemName, input.Category, input.PublicDescription,
		input.EventDate, input.ApproximateTime, input.ApproximateLocation, key, requestHash[:],
	)
	report, err := scanReport(row)
	if errors.Is(err, pgx.ErrNoRows) {
		return Report{}, ErrIdempotencyConflict
	}
	if err != nil {
		return Report{}, fmt.Errorf("create report: %w", err)
	}
	return report, nil
}

func (repository *Repository) ByID(ctx context.Context, id string) (Report, error) {
	report, err := scanReport(repository.pool.QueryRow(ctx, `SELECT `+reportColumns+` FROM reports WHERE id = $1::uuid AND withdrawn_at IS NULL`, id))
	if errors.Is(err, pgx.ErrNoRows) {
		return Report{}, ErrNotFound
	}
	if err != nil {
		return Report{}, fmt.Errorf("read report: %w", err)
	}
	return report, nil
}

func (repository *Repository) Search(ctx context.Context, filter SearchFilter) ([]Report, error) {
	rows, err := repository.pool.Query(ctx, `
		SELECT `+reportColumns+` FROM reports
		WHERE withdrawn_at IS NULL
		  AND ($1 = '' OR report_type = $1)
		  AND ($2 = '' OR category ILIKE '%' || $2 || '%')
		  AND ($3 = '' OR item_name ILIKE '%' || $3 || '%' OR public_description ILIKE '%' || $3 || '%' OR approximate_location ILIKE '%' || $3 || '%')
		ORDER BY created_at DESC, id DESC LIMIT $4 OFFSET $5`, filter.Type, filter.Category, filter.Query, filter.Limit, filter.Offset)
	if err != nil {
		return nil, fmt.Errorf("search reports: %w", err)
	}
	defer rows.Close()
	return collectReports(rows)
}

func (repository *Repository) ByOwner(ctx context.Context, ownerID string, limit, offset int) ([]Report, error) {
	rows, err := repository.pool.Query(ctx, `
		SELECT `+reportColumns+` FROM reports WHERE reporter_id = $1::uuid
		ORDER BY created_at DESC, id DESC LIMIT $2 OFFSET $3`, ownerID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("read owned reports: %w", err)
	}
	defer rows.Close()
	return collectReports(rows)
}

type rowScanner interface{ Scan(...any) error }

func scanReport(row rowScanner) (Report, error) {
	var value Report
	var eventDate time.Time
	err := row.Scan(&value.ID, &value.ReportType, &value.ItemName, &value.Category, &value.PublicDescription,
		&eventDate, &value.ApproximateTime, &value.ApproximateLocation, &value.CreatedAt, &value.WithdrawnAt)
	value.EventDate = eventDate.Format("2006-01-02")
	return value, err
}

func collectReports(rows pgx.Rows) ([]Report, error) {
	values := make([]Report, 0)
	for rows.Next() {
		value, err := scanReport(rows)
		if err != nil {
			return nil, fmt.Errorf("scan report: %w", err)
		}
		values = append(values, value)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate reports: %w", err)
	}
	return values, nil
}
