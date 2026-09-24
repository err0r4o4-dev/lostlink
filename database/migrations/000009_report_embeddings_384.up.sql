CREATE TABLE report_embeddings_384 (
    report_id uuid PRIMARY KEY REFERENCES reports(id) ON DELETE CASCADE,
    embedding vector(384) NOT NULL,
    model_version text NOT NULL CHECK (char_length(model_version) BETWEEN 1 AND 100),
    config_version text NOT NULL CHECK (char_length(config_version) BETWEEN 1 AND 100),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX report_embeddings_384_cosine_idx
    ON report_embeddings_384 USING hnsw (embedding vector_cosine_ops);
