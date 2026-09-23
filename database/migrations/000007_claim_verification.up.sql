CREATE TABLE claims (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id uuid NOT NULL REFERENCES matches(id) ON DELETE RESTRICT,
    lost_report_id uuid NOT NULL REFERENCES reports(id) ON DELETE RESTRICT,
    found_report_id uuid NOT NULL REFERENCES reports(id) ON DELETE RESTRICT,
    claimant_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    idempotency_key uuid NOT NULL,
    status text NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'submitted', 'under_review', 'needs_more_info', 'approved', 'rejected', 'cancelled')),
    submitted_at timestamptz,
    reviewed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT claims_distinct_reports CHECK (lost_report_id <> found_report_id),
    CONSTRAINT claims_match_claimant_unique UNIQUE (match_id, claimant_id),
    CONSTRAINT claims_idempotency_unique UNIQUE (claimant_id, idempotency_key),
    CONSTRAINT claims_submitted_state_consistent CHECK (
        status IN ('draft', 'cancelled') OR submitted_at IS NOT NULL
    ),
    CONSTRAINT claims_reviewed_state_consistent CHECK (
        status NOT IN ('approved', 'rejected') OR reviewed_at IS NOT NULL
    )
);

CREATE INDEX claims_claimant_created_idx
    ON claims (claimant_id, created_at DESC);

CREATE INDEX claims_staff_status_idx
    ON claims (status, submitted_at, created_at);

CREATE TABLE claim_evidence (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id uuid NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
    evidence_type text NOT NULL CHECK (evidence_type IN ('statement', 'image')),
    description text NOT NULL CHECK (char_length(description) BETWEEN 10 AND 2000),
    object_key text UNIQUE,
    content_type text,
    size_bytes bigint,
    width integer,
    height integer,
    sha256 bytea,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT claim_evidence_shape CHECK (
        (evidence_type = 'statement' AND object_key IS NULL AND content_type IS NULL AND size_bytes IS NULL AND width IS NULL AND height IS NULL AND sha256 IS NULL) OR
        (evidence_type = 'image' AND object_key IS NOT NULL AND content_type IN ('image/jpeg', 'image/png')
            AND size_bytes BETWEEN 1 AND 8388608 AND width BETWEEN 1 AND 6000
            AND height BETWEEN 1 AND 6000 AND octet_length(sha256) = 32)
    )
);

CREATE INDEX claim_evidence_claim_created_idx
    ON claim_evidence (claim_id, created_at, id);

CREATE TABLE verification_decisions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id uuid NOT NULL REFERENCES claims(id) ON DELETE RESTRICT,
    decided_by uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    action text NOT NULL CHECK (action IN ('start_review', 'request_more_info', 'approve', 'reject')),
    reason text CHECK (reason IS NULL OR char_length(reason) BETWEEN 3 AND 1000),
    previous_status text NOT NULL,
    next_status text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX verification_decisions_claim_created_idx
    ON verification_decisions (claim_id, created_at, id);

CREATE TABLE audit_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id uuid REFERENCES users(id) ON DELETE SET NULL,
    action text NOT NULL CHECK (char_length(action) BETWEEN 1 AND 120),
    subject_type text NOT NULL CHECK (subject_type IN ('report', 'match', 'claim', 'return', 'notification')),
    subject_id uuid NOT NULL,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX audit_events_subject_created_idx
    ON audit_events (subject_type, subject_id, created_at DESC);

CREATE INDEX audit_events_actor_created_idx
    ON audit_events (actor_id, created_at DESC)
    WHERE actor_id IS NOT NULL;
