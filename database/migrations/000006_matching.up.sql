CREATE TABLE report_embeddings (
    report_id uuid PRIMARY KEY REFERENCES reports(id) ON DELETE CASCADE,
    embedding vector(32) NOT NULL,
    model_version text NOT NULL CHECK (char_length(model_version) BETWEEN 1 AND 100),
    config_version text NOT NULL CHECK (char_length(config_version) BETWEEN 1 AND 100),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX report_embeddings_cosine_idx
    ON report_embeddings USING hnsw (embedding vector_cosine_ops);

CREATE TABLE matching_runs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    requested_by uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    idempotency_key uuid NOT NULL,
    status text NOT NULL CHECK (status IN ('processing', 'completed', 'failed')),
    model_version text,
    config_version text,
    candidate_count integer NOT NULL DEFAULT 0 CHECK (candidate_count >= 0),
    failure_code text,
    created_at timestamptz NOT NULL DEFAULT now(),
    completed_at timestamptz,
    CONSTRAINT matching_runs_idempotency_unique
        UNIQUE (report_id, requested_by, idempotency_key),
    CONSTRAINT matching_runs_completion_consistent CHECK (
        (status = 'processing' AND completed_at IS NULL) OR
        (status IN ('completed', 'failed') AND completed_at IS NOT NULL)
    )
);

CREATE INDEX matching_runs_report_created_idx
    ON matching_runs (report_id, created_at DESC);

CREATE INDEX matching_runs_requester_created_idx
    ON matching_runs (requested_by, created_at DESC);

CREATE TABLE matches (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id uuid NOT NULL REFERENCES matching_runs(id) ON DELETE CASCADE,
    source_report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    candidate_report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    score double precision NOT NULL CHECK (score BETWEEN 0 AND 1),
    signals jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(signals) = 'array'),
    model_version text NOT NULL CHECK (char_length(model_version) BETWEEN 1 AND 100),
    config_version text NOT NULL CHECK (char_length(config_version) BETWEEN 1 AND 100),
    review_status text NOT NULL DEFAULT 'pending'
        CHECK (review_status IN ('pending', 'reviewed', 'dismissed')),
    reviewed_by uuid REFERENCES users(id) ON DELETE RESTRICT,
    reviewed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT matches_distinct_reports CHECK (source_report_id <> candidate_report_id),
    CONSTRAINT matches_review_consistent CHECK (
        (review_status = 'pending' AND reviewed_by IS NULL AND reviewed_at IS NULL) OR
        (review_status IN ('reviewed', 'dismissed') AND reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL)
    ),
    CONSTRAINT matches_candidate_version_unique
        UNIQUE (source_report_id, candidate_report_id, model_version, config_version)
);

CREATE INDEX matches_source_score_idx
    ON matches (source_report_id, score DESC, created_at DESC);

CREATE INDEX matches_staff_review_idx
    ON matches (review_status, created_at DESC);
