DROP TABLE IF EXISTS object_cleanup_tasks;
DROP TABLE IF EXISTS report_images;

DROP INDEX IF EXISTS reports_status_created_idx;

ALTER TABLE reports
    DROP CONSTRAINT IF EXISTS reports_closed_state_consistent,
    DROP CONSTRAINT IF EXISTS reports_withdrawn_state_consistent,
    DROP COLUMN IF EXISTS closed_at,
    DROP COLUMN IF EXISTS status;
