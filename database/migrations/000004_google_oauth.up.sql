ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
ALTER TABLE users ADD CONSTRAINT users_password_hash_not_empty
    CHECK (password_hash IS NULL OR password_hash <> '');

CREATE TABLE oauth_identities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider text NOT NULL CHECK (provider IN ('google')),
    provider_subject text NOT NULL CHECK (char_length(provider_subject) BETWEEN 1 AND 255),
    created_at timestamptz NOT NULL DEFAULT now(),
    last_login_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT oauth_identities_provider_subject_unique UNIQUE (provider, provider_subject),
    CONSTRAINT oauth_identities_user_provider_unique UNIQUE (user_id, provider)
);

CREATE INDEX oauth_identities_user_idx ON oauth_identities (user_id);
