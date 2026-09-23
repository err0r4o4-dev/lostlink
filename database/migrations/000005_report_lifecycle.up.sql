ALTER TABLE reports
    ADD COLUMN status text NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'withdrawn', 'hidden', 'closed')),
    ADD COLUMN closed_at timestamptz;

UPDATE reports
SET status = 'withdrawn'
WHERE withdrawn_at IS NOT NULL;

ALTER TABLE reports
    ADD CONSTRAINT reports_withdrawn_state_consistent
        CHECK ((status = 'withdrawn') = (withdrawn_at IS NOT NULL)),
    ADD CONSTRAINT reports_closed_state_consistent
        CHECK ((status = 'closed') = (closed_at IS NOT NULL));

CREATE INDEX reports_status_created_idx
    ON reports (status, created_at DESC, id DESC);

CREATE TABLE report_images (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    object_key text NOT NULL UNIQUE CHECK (char_length(object_key) BETWEEN 1 AND 512),
    content_type text NOT NULL CHECK (content_type IN ('image/jpeg', 'image/png')),
    size_bytes bigint NOT NULL CHECK (size_bytes BETWEEN 1 AND 8388608),
    width integer NOT NULL CHECK (width BETWEEN 1 AND 6000),
    height integer NOT NULL CHECK (height BETWEEN 1 AND 6000),
    sha256 bytea NOT NULL CHECK (octet_length(sha256) = 32),
    is_primary boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX report_images_report_created_idx
    ON report_images (report_id, created_at, id);

CREATE UNIQUE INDEX report_images_one_primary_idx
    ON report_images (report_id)
    WHERE is_primary;

CREATE TABLE object_cleanup_tasks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    object_key text NOT NULL UNIQUE CHECK (char_length(object_key) BETWEEN 1 AND 512),
    reason text NOT NULL CHECK (char_length(reason) BETWEEN 1 AND 120),
    attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
    last_error_at timestamptz,
    completed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX object_cleanup_tasks_pending_idx
    ON object_cleanup_tasks (created_at, id)
    WHERE completed_at IS NULL;
