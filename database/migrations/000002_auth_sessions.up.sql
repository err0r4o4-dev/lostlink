CREATE TABLE users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier text NOT NULL,
    password_hash text NOT NULL,
    role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'staff', 'admin')),
    token_epoch integer NOT NULL DEFAULT 0 CHECK (token_epoch >= 0),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT users_identifier_normalized CHECK (identifier = lower(btrim(identifier))),
    CONSTRAINT users_identifier_length CHECK (char_length(identifier) BETWEEN 3 AND 254),
    CONSTRAINT users_identifier_unique UNIQUE (identifier)
);

CREATE TABLE refresh_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id uuid NOT NULL,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_digest bytea NOT NULL UNIQUE,
    created_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz NOT NULL,
    last_used_at timestamptz,
    revoked_at timestamptz,
    replaced_by uuid REFERENCES refresh_sessions(id),
    CONSTRAINT refresh_sessions_expiry CHECK (expires_at > created_at)
);

CREATE INDEX refresh_sessions_user_active_idx
    ON refresh_sessions (user_id, expires_at)
    WHERE revoked_at IS NULL;

CREATE INDEX refresh_sessions_family_idx ON refresh_sessions (family_id);
