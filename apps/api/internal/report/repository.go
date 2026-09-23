package report

import (
	"bytes"
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
event_date, approximate_time, approximate_location, status, created_at, withdrawn_at, closed_at`

const imageColumns = `id::text, content_type, size_bytes, width, height, is_primary, created_at, object_key`
const publicImageColumns = `i.id::text, i.content_type, i.size_bytes, i.width, i.height, i.is_primary, i.created_at, i.object_key`

func (repository *Repository) Create(ctx context.Context, ownerID, key string, requestHash [32]byte, input CreateInput) (Report, error) {
	tx, err := repository.pool.Begin(ctx)
	if err != nil {
		return Report{}, fmt.Errorf("begin report creation: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	report, err := scanReport(tx.QueryRow(ctx, `
		INSERT INTO reports (
			reporter_id, report_type, item_name, category, public_description,
			event_date, approximate_time, approximate_location, idempotency_key, request_hash
		) VALUES ($1::uuid, $2, $3, $4, $5, $6::date, NULLIF($7, ''), $8, $9::uuid, $10)
		ON CONFLICT (reporter_id, idempotency_key) DO NOTHING
		RETURNING `+reportColumns,
		ownerID, input.ReportType, input.ItemName, input.Category, input.PublicDescription,
		input.EventDate, input.ApproximateTime, input.ApproximateLocation, key, requestHash[:],
	))
	if errors.Is(err, pgx.ErrNoRows) {
		var storedHash []byte
		if err := tx.QueryRow(ctx, `
			SELECT request_hash FROM reports
			WHERE reporter_id = $1::uuid AND idempotency_key = $2::uuid`, ownerID, key).Scan(&storedHash); err != nil {
			return Report{}, fmt.Errorf("read idempotent report hash: %w", err)
		}
		if !bytes.Equal(storedHash, requestHash[:]) {
			return Report{}, ErrIdempotencyConflict
		}
		report, err = scanReport(tx.QueryRow(ctx, `
			SELECT `+reportColumns+` FROM reports
			WHERE reporter_id = $1::uuid AND idempotency_key = $2::uuid`, ownerID, key))
		if err != nil {
			return Report{}, fmt.Errorf("read idempotent report: %w", err)
		}
		return report, nil
	}
	if err != nil {
		return Report{}, fmt.Errorf("create report: %w", err)
	}
	if err := recordReportEvent(ctx, tx, report.ID, ownerID, "report_created", "Report published."); err != nil {
		return Report{}, err
	}
	if err := tx.Commit(ctx); err != nil {
		return Report{}, fmt.Errorf("commit report creation: %w", err)
	}
	return report, nil
}

func (repository *Repository) ByID(ctx context.Context, id string) (Report, error) {
	report, err := scanReport(repository.pool.QueryRow(ctx, `SELECT `+reportColumns+` FROM reports WHERE id = $1::uuid AND status = 'active'`, id))
	if errors.Is(err, pgx.ErrNoRows) {
		return Report{}, ErrNotFound
	}
	if err != nil {
		return Report{}, fmt.Errorf("read report: %w", err)
	}
	return report, nil
}

func (repository *Repository) ByOwnerID(ctx context.Context, ownerID, id string) (Report, error) {
	report, err := scanReport(repository.pool.QueryRow(ctx, `
		SELECT `+reportColumns+` FROM reports
		WHERE id = $1::uuid AND reporter_id = $2::uuid`, id, ownerID))
	if errors.Is(err, pgx.ErrNoRows) {
		return Report{}, ErrNotFound
	}
	if err != nil {
		return Report{}, fmt.Errorf("read owned report: %w", err)
	}
	return report, nil
}

func (repository *Repository) Search(ctx context.Context, filter SearchFilter) ([]Report, error) {
	rows, err := repository.pool.Query(ctx, `
		SELECT `+reportColumns+` FROM reports
		WHERE status = 'active'
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

func (repository *Repository) Update(ctx context.Context, ownerID string, value Report) (Report, error) {
	tx, err := repository.pool.Begin(ctx)
	if err != nil {
		return Report{}, fmt.Errorf("begin report update: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	approximateTime := ""
	if value.ApproximateTime != nil {
		approximateTime = *value.ApproximateTime
	}
	updated, err := scanReport(tx.QueryRow(ctx, `
		UPDATE reports SET
			item_name = $3,
			category = $4,
			public_description = $5,
			event_date = $6::date,
			approximate_time = NULLIF($7, ''),
			approximate_location = $8,
			updated_at = now()
		WHERE id = $1::uuid AND reporter_id = $2::uuid AND status = 'active'
		RETURNING `+reportColumns,
		value.ID, ownerID, value.ItemName, value.Category, value.PublicDescription,
		value.EventDate, approximateTime, value.ApproximateLocation,
	))
	if errors.Is(err, pgx.ErrNoRows) {
		return Report{}, ownerMutationError(ctx, tx, ownerID, value.ID)
	}
	if err != nil {
		return Report{}, fmt.Errorf("update report: %w", err)
	}
	if err := recordReportEvent(ctx, tx, value.ID, ownerID, "report_updated", "Report details updated."); err != nil {
		return Report{}, err
	}
	if err := tx.Commit(ctx); err != nil {
		return Report{}, fmt.Errorf("commit report update: %w", err)
	}
	return updated, nil
}

func (repository *Repository) Withdraw(ctx context.Context, ownerID, id string) (Report, error) {
	tx, err := repository.pool.Begin(ctx)
	if err != nil {
		return Report{}, fmt.Errorf("begin report withdrawal: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	value, err := scanReport(tx.QueryRow(ctx, `
		UPDATE reports SET status = 'withdrawn', withdrawn_at = now(), updated_at = now()
		WHERE id = $1::uuid AND reporter_id = $2::uuid AND status = 'active'
		RETURNING `+reportColumns, id, ownerID))
	if errors.Is(err, pgx.ErrNoRows) {
		return Report{}, ownerMutationError(ctx, tx, ownerID, id)
	}
	if err != nil {
		return Report{}, fmt.Errorf("withdraw report: %w", err)
	}
	if err := recordReportEvent(ctx, tx, id, ownerID, "report_withdrawn", "Report withdrawn."); err != nil {
		return Report{}, err
	}
	if err := tx.Commit(ctx); err != nil {
		return Report{}, fmt.Errorf("commit report withdrawal: %w", err)
	}
	return value, nil
}

func (repository *Repository) CanManage(ctx context.Context, ownerID, id string) error {
	var status Status
	err := repository.pool.QueryRow(ctx, `SELECT status FROM reports WHERE id = $1::uuid AND reporter_id = $2::uuid`, id, ownerID).Scan(&status)
	if errors.Is(err, pgx.ErrNoRows) {
		return ErrNotFound
	}
	if err != nil {
		return fmt.Errorf("authorize report image: %w", err)
	}
	if status != StatusActive {
		return ErrInvalidState
	}
	return nil
}

func (repository *Repository) AddImage(ctx context.Context, ownerID, reportID string, input StoredImage) (Image, error) {
	tx, err := repository.pool.Begin(ctx)
	if err != nil {
		return Image{}, fmt.Errorf("begin report image: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	if err := lockManageableReport(ctx, tx, ownerID, reportID); err != nil {
		return Image{}, err
	}
	var count int
	if err := tx.QueryRow(ctx, `SELECT count(*) FROM report_images WHERE report_id = $1::uuid`, reportID).Scan(&count); err != nil {
		return Image{}, fmt.Errorf("count report images: %w", err)
	}
	if count >= 5 {
		return Image{}, ErrTooManyImages
	}
	image, err := scanImage(tx.QueryRow(ctx, `
		INSERT INTO report_images (report_id, object_key, content_type, size_bytes, width, height, sha256, is_primary)
		VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8)
		RETURNING `+imageColumns,
		reportID, input.ObjectKey, input.ContentType, input.SizeBytes, input.Width, input.Height, input.SHA256[:], count == 0,
	))
	if err != nil {
		return Image{}, fmt.Errorf("insert report image: %w", err)
	}
	if err := tx.Commit(ctx); err != nil {
		return Image{}, fmt.Errorf("commit report image: %w", err)
	}
	return image, nil
}

func (repository *Repository) DeleteImage(ctx context.Context, ownerID, reportID, imageID string) (Image, error) {
	tx, err := repository.pool.Begin(ctx)
	if err != nil {
		return Image{}, fmt.Errorf("begin report image deletion: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	if err := lockManageableReport(ctx, tx, ownerID, reportID); err != nil {
		return Image{}, err
	}
	image, err := scanImage(tx.QueryRow(ctx, `
		DELETE FROM report_images
		WHERE id = $1::uuid AND report_id = $2::uuid
		RETURNING `+imageColumns, imageID, reportID))
	if errors.Is(err, pgx.ErrNoRows) {
		return Image{}, ErrNotFound
	}
	if err != nil {
		return Image{}, fmt.Errorf("delete report image: %w", err)
	}
	if image.IsPrimary {
		if _, err := tx.Exec(ctx, `
			UPDATE report_images SET is_primary = true
			WHERE id = (
				SELECT id FROM report_images WHERE report_id = $1::uuid ORDER BY created_at, id LIMIT 1
			)`, reportID); err != nil {
			return Image{}, fmt.Errorf("replace primary report image: %w", err)
		}
	}
	if err := tx.Commit(ctx); err != nil {
		return Image{}, fmt.Errorf("commit report image deletion: %w", err)
	}
	return image, nil
}

func (repository *Repository) PublicImage(ctx context.Context, reportID, imageID string) (Image, error) {
	image, err := scanImage(repository.pool.QueryRow(ctx, `
		SELECT `+publicImageColumns+` FROM report_images i
		JOIN reports r ON r.id = i.report_id
		WHERE i.id = $1::uuid AND i.report_id = $2::uuid AND r.status = 'active'`, imageID, reportID))
	if errors.Is(err, pgx.ErrNoRows) {
		return Image{}, ErrNotFound
	}
	if err != nil {
		return Image{}, fmt.Errorf("read report image: %w", err)
	}
	return image, nil
}

func (repository *Repository) PublicImages(ctx context.Context, reportID string) ([]Image, error) {
	rows, err := repository.pool.Query(ctx, `
		SELECT `+publicImageColumns+` FROM report_images i
		JOIN reports r ON r.id = i.report_id
		WHERE i.report_id = $1::uuid AND r.status = 'active'
		ORDER BY i.is_primary DESC, i.created_at, i.id`, reportID)
	if err != nil {
		return nil, fmt.Errorf("list report images: %w", err)
	}
	defer rows.Close()
	values := make([]Image, 0)
	for rows.Next() {
		value, err := scanImage(rows)
		if err != nil {
			return nil, fmt.Errorf("scan report image: %w", err)
		}
		values = append(values, value)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate report images: %w", err)
	}
	return values, nil
}

func (repository *Repository) StaffList(ctx context.Context, status Status, limit, offset int) ([]Report, error) {
	rows, err := repository.pool.Query(ctx, `
		SELECT `+reportColumns+` FROM reports
		WHERE ($1 = '' OR status = $1)
		ORDER BY created_at DESC, id DESC LIMIT $2 OFFSET $3`, status, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("list staff reports: %w", err)
	}
	defer rows.Close()
	return collectReports(rows)
}

func (repository *Repository) Moderate(ctx context.Context, actorID, reportID string, action ModerationAction) (Report, error) {
	tx, err := repository.pool.Begin(ctx)
	if err != nil {
		return Report{}, fmt.Errorf("begin report moderation: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	current, err := scanReport(tx.QueryRow(ctx, `SELECT `+reportColumns+` FROM reports WHERE id = $1::uuid FOR UPDATE`, reportID))
	if errors.Is(err, pgx.ErrNoRows) {
		return Report{}, ErrNotFound
	}
	if err != nil {
		return Report{}, fmt.Errorf("read report for moderation: %w", err)
	}
	next := current.Status
	closed := false
	switch action {
	case ModerationHide:
		if current.Status != StatusActive {
			return Report{}, ErrInvalidState
		}
		next = StatusHidden
	case ModerationRestore:
		if current.Status != StatusHidden {
			return Report{}, ErrInvalidState
		}
		next = StatusActive
	case ModerationClose:
		if current.Status != StatusActive && current.Status != StatusHidden {
			return Report{}, ErrInvalidState
		}
		next, closed = StatusClosed, true
	default:
		return Report{}, ErrInvalid
	}
	value, err := scanReport(tx.QueryRow(ctx, `
		UPDATE reports SET status = $2, closed_at = CASE WHEN $3 THEN now() ELSE NULL END, updated_at = now()
		WHERE id = $1::uuid RETURNING `+reportColumns, reportID, next, closed))
	if err != nil {
		return Report{}, fmt.Errorf("moderate report: %w", err)
	}
	if _, err := tx.Exec(ctx, `
		INSERT INTO audit_events (actor_id, action, subject_type, subject_id)
		VALUES ($1::uuid, $2, 'report', $3::uuid)`, actorID, "report."+string(action), reportID); err != nil {
		return Report{}, fmt.Errorf("audit report moderation: %w", err)
	}
	eventType, message := moderationEvent(action)
	if err := recordReportEvent(ctx, tx, reportID, actorID, eventType, message); err != nil {
		return Report{}, err
	}
	if err := tx.Commit(ctx); err != nil {
		return Report{}, fmt.Errorf("commit report moderation: %w", err)
	}
	return value, nil
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

func recordReportEvent(ctx context.Context, tx pgx.Tx, reportID, actorID, eventType, message string) error {
	if _, err := tx.Exec(ctx, `
		INSERT INTO tracking_events (subject_type, subject_id, event_type, actor_id, message)
		VALUES ('report', $1::uuid, $2, $3::uuid, $4)`, reportID, eventType, actorID, message); err != nil {
		return fmt.Errorf("track report transition: %w", err)
	}
	return nil
}

func moderationEvent(action ModerationAction) (string, string) {
	switch action {
	case ModerationHide:
		return "report_hidden", "Report hidden by authorized staff."
	case ModerationRestore:
		return "report_restored", "Report restored by authorized staff."
	default:
		return "report_closed", "Report closed by authorized staff."
	}
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
		&eventDate, &value.ApproximateTime, &value.ApproximateLocation, &value.Status, &value.CreatedAt, &value.WithdrawnAt, &value.ClosedAt)
	value.EventDate = eventDate.Format("2006-01-02")
	return value, err
}

func scanImage(row rowScanner) (Image, error) {
	var value Image
	err := row.Scan(&value.ID, &value.ContentType, &value.SizeBytes, &value.Width, &value.Height, &value.IsPrimary, &value.CreatedAt, &value.ObjectKey)
	return value, err
}

type queryRower interface {
	QueryRow(context.Context, string, ...any) pgx.Row
}

func ownerMutationError(ctx context.Context, querier queryRower, ownerID, reportID string) error {
	var status Status
	err := querier.QueryRow(ctx, `SELECT status FROM reports WHERE id = $1::uuid AND reporter_id = $2::uuid`, reportID, ownerID).Scan(&status)
	if errors.Is(err, pgx.ErrNoRows) {
		return ErrNotFound
	}
	if err != nil {
		return fmt.Errorf("classify report mutation: %w", err)
	}
	return ErrInvalidState
}

func lockManageableReport(ctx context.Context, tx pgx.Tx, ownerID, reportID string) error {
	var status Status
	err := tx.QueryRow(ctx, `
		SELECT status FROM reports
		WHERE id = $1::uuid AND reporter_id = $2::uuid
		FOR UPDATE`, reportID, ownerID).Scan(&status)
	if errors.Is(err, pgx.ErrNoRows) {
		return ErrNotFound
	}
	if err != nil {
		return fmt.Errorf("lock report: %w", err)
	}
	if status != StatusActive {
		return ErrInvalidState
	}
	return nil
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
