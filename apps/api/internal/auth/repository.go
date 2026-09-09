package auth

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct{ pool *pgxpool.Pool }

func NewRepository(pool *pgxpool.Pool) *Repository { return &Repository{pool: pool} }

func (repository *Repository) CreateUserWithSession(ctx context.Context, identifier, passwordHash string, digest []byte, expiresAt time.Time) (User, error) {
	tx, err := repository.pool.Begin(ctx)
	if err != nil {
		return User{}, fmt.Errorf("begin registration: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	var user User
	err = tx.QueryRow(ctx, `
		INSERT INTO users (identifier, password_hash)
		VALUES ($1, $2)
		RETURNING id::text, identifier, password_hash, role, created_at`, identifier, passwordHash,
	).Scan(&user.ID, &user.Identifier, &user.PasswordHash, &user.Role, &user.CreatedAt)
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) && pgErr.Code == "23505" {
		return User{}, ErrConflict
	}
	if err != nil {
		return User{}, fmt.Errorf("create user: %w", err)
	}
	if _, err := tx.Exec(ctx, `
		INSERT INTO refresh_sessions (family_id, user_id, token_digest, expires_at)
		VALUES (gen_random_uuid(), $1, $2, $3)`, user.ID, digest, expiresAt,
	); err != nil {
		return User{}, fmt.Errorf("create registration session: %w", err)
	}
	if err := tx.Commit(ctx); err != nil {
		return User{}, fmt.Errorf("commit registration: %w", err)
	}
	return user, nil
}

func (repository *Repository) UserByIdentifier(ctx context.Context, identifier string) (User, error) {
	return repository.scanUser(repository.pool.QueryRow(ctx, `
		SELECT id::text, identifier, COALESCE(password_hash, ''), role, created_at
		FROM users WHERE identifier = $1`, identifier))
}

func (repository *Repository) UserByID(ctx context.Context, id string) (User, error) {
	return repository.scanUser(repository.pool.QueryRow(ctx, `
		SELECT id::text, identifier, COALESCE(password_hash, ''), role, created_at
		FROM users WHERE id = $1`, id))
}

func (repository *Repository) GoogleUser(ctx context.Context, subject, email string, now time.Time) (User, error) {
	tx, err := repository.pool.Begin(ctx)
	if err != nil {
		return User{}, fmt.Errorf("begin Google identity login: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	var user User
	err = tx.QueryRow(ctx, `
		SELECT u.id::text, u.identifier, COALESCE(u.password_hash, ''), u.role, u.created_at
		FROM oauth_identities i JOIN users u ON u.id = i.user_id
		WHERE i.provider = 'google' AND i.provider_subject = $1`, subject,
	).Scan(&user.ID, &user.Identifier, &user.PasswordHash, &user.Role, &user.CreatedAt)
	if err == nil {
		if _, err := tx.Exec(ctx, `UPDATE oauth_identities SET last_login_at = $2 WHERE provider = 'google' AND provider_subject = $1`, subject, now); err != nil {
			return User{}, fmt.Errorf("update Google identity login: %w", err)
		}
		if err := tx.Commit(ctx); err != nil {
			return User{}, fmt.Errorf("commit Google identity login: %w", err)
		}
		return user, nil
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return User{}, fmt.Errorf("read Google identity: %w", err)
	}

	err = tx.QueryRow(ctx, `
		INSERT INTO users (identifier, password_hash) VALUES ($1, NULL)
		ON CONFLICT (identifier) DO NOTHING
		RETURNING id::text, identifier, COALESCE(password_hash, ''), role, created_at`, email,
	).Scan(&user.ID, &user.Identifier, &user.PasswordHash, &user.Role, &user.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return User{}, ErrConflict
	}
	if err != nil {
		return User{}, fmt.Errorf("resolve Google user: %w", err)
	}

	var linkedUserID string
	err = tx.QueryRow(ctx, `
		INSERT INTO oauth_identities (user_id, provider, provider_subject, last_login_at)
		VALUES ($1::uuid, 'google', $2, $3)
		ON CONFLICT (provider, provider_subject) DO UPDATE SET last_login_at = EXCLUDED.last_login_at
		RETURNING user_id::text`, user.ID, subject, now,
	).Scan(&linkedUserID)
	if err != nil {
		return User{}, fmt.Errorf("link Google identity: %w", err)
	}
	if linkedUserID != user.ID {
		err = tx.QueryRow(ctx, `SELECT id::text, identifier, COALESCE(password_hash, ''), role, created_at FROM users WHERE id = $1::uuid`, linkedUserID).
			Scan(&user.ID, &user.Identifier, &user.PasswordHash, &user.Role, &user.CreatedAt)
		if err != nil {
			return User{}, fmt.Errorf("read linked Google user: %w", err)
		}
	}
	if err := tx.Commit(ctx); err != nil {
		return User{}, fmt.Errorf("commit Google identity link: %w", err)
	}
	return user, nil
}

type rowScanner interface{ Scan(dest ...any) error }

func (repository *Repository) scanUser(row rowScanner) (User, error) {
	var user User
	if err := row.Scan(&user.ID, &user.Identifier, &user.PasswordHash, &user.Role, &user.CreatedAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return User{}, ErrInvalidLogin
		}
		return User{}, fmt.Errorf("read user: %w", err)
	}
	return user, nil
}

func (repository *Repository) CreateSession(ctx context.Context, userID string, digest []byte, expires time.Time) error {
	_, err := repository.pool.Exec(ctx, `
		INSERT INTO refresh_sessions (family_id, user_id, token_digest, expires_at)
		VALUES (gen_random_uuid(), $1, $2, $3)`, userID, digest, expires)
	if err != nil {
		return fmt.Errorf("create refresh session: %w", err)
	}
	return nil
}

func (repository *Repository) RotateSession(ctx context.Context, digest, nextDigest []byte, nextExpiry, now time.Time) (User, error) {
	tx, err := repository.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return User{}, fmt.Errorf("begin refresh rotation: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	var sessionID, familyID string
	var expiresAt time.Time
	var revokedAt *time.Time
	var replacedBy *string
	var user User
	err = tx.QueryRow(ctx, `
		SELECT s.id::text, s.family_id::text, s.expires_at, s.revoked_at, s.replaced_by::text,
		       u.id::text, u.identifier, COALESCE(u.password_hash, ''), u.role, u.created_at
		FROM refresh_sessions s JOIN users u ON u.id = s.user_id
		WHERE s.token_digest = $1 FOR UPDATE`, digest,
	).Scan(&sessionID, &familyID, &expiresAt, &revokedAt, &replacedBy,
		&user.ID, &user.Identifier, &user.PasswordHash, &user.Role, &user.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return User{}, ErrInvalidRefresh
	}
	if err != nil {
		return User{}, fmt.Errorf("read refresh session: %w", err)
	}

	if revokedAt != nil || replacedBy != nil {
		if _, err := tx.Exec(ctx, `UPDATE refresh_sessions SET revoked_at = COALESCE(revoked_at, $2) WHERE family_id = $1`, familyID, now); err != nil {
			return User{}, fmt.Errorf("revoke refresh family: %w", err)
		}
		if err := tx.Commit(ctx); err != nil {
			return User{}, fmt.Errorf("commit refresh family revocation: %w", err)
		}
		return User{}, ErrRefreshReuse
	}
	if !expiresAt.After(now) {
		if _, err := tx.Exec(ctx, `UPDATE refresh_sessions SET revoked_at = $2 WHERE id = $1`, sessionID, now); err != nil {
			return User{}, fmt.Errorf("expire refresh session: %w", err)
		}
		if err := tx.Commit(ctx); err != nil {
			return User{}, fmt.Errorf("commit refresh expiry: %w", err)
		}
		return User{}, ErrInvalidRefresh
	}

	var nextID string
	if err := tx.QueryRow(ctx, `
		INSERT INTO refresh_sessions (family_id, user_id, token_digest, expires_at)
		VALUES ($1, $2, $3, $4) RETURNING id::text`, familyID, user.ID, nextDigest, nextExpiry,
	).Scan(&nextID); err != nil {
		return User{}, fmt.Errorf("create rotated session: %w", err)
	}
	if _, err := tx.Exec(ctx, `
		UPDATE refresh_sessions SET revoked_at = $2, last_used_at = $2, replaced_by = $3
		WHERE id = $1`, sessionID, now, nextID); err != nil {
		return User{}, fmt.Errorf("replace refresh session: %w", err)
	}
	if err := tx.Commit(ctx); err != nil {
		return User{}, fmt.Errorf("commit refresh rotation: %w", err)
	}
	return user, nil
}

func (repository *Repository) RevokeSession(ctx context.Context, digest []byte, now time.Time) error {
	_, err := repository.pool.Exec(ctx, `
		UPDATE refresh_sessions SET revoked_at = COALESCE(revoked_at, $2)
		WHERE token_digest = $1`, digest, now)
	if err != nil {
		return fmt.Errorf("revoke refresh session: %w", err)
	}
	return nil
}
