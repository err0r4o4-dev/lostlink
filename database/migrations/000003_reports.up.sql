CREATE TABLE reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    report_type text NOT NULL CHECK (report_type IN ('lost', 'found')),
    item_name text NOT NULL CHECK (char_length(item_name) BETWEEN 2 AND 100),
    category text NOT NULL CHECK (char_length(category) BETWEEN 2 AND 80),
    public_description text NOT NULL CHECK (char_length(public_description) BETWEEN 10 AND 1000),
    event_date date NOT NULL,
    approximate_time text CHECK (approximate_time IS NULL OR approximate_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
    approximate_location text NOT NULL CHECK (char_length(approximate_location) BETWEEN 2 AND 120),
    idempotency_key uuid NOT NULL,
    request_hash bytea NOT NULL CHECK (octet_length(request_hash) = 32),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    withdrawn_at timestamptz,
    CONSTRAINT reports_idempotency_unique UNIQUE (reporter_id, idempotency_key)
);

CREATE INDEX reports_discovery_created_idx
    ON reports (created_at DESC, id DESC)
    WHERE withdrawn_at IS NULL;

CREATE INDEX reports_owner_created_idx
    ON reports (reporter_id, created_at DESC);
