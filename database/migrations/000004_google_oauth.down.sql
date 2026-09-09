DROP TABLE IF EXISTS oauth_identities;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_password_hash_not_empty;
UPDATE users SET password_hash = '$oauth-provider-disabled$' WHERE password_hash IS NULL;
ALTER TABLE users ALTER COLUMN password_hash SET NOT NULL;
