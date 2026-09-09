package auth

import (
	"context"
	"errors"
	"os"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

func TestRepositoryGoogleUserRefresh(t *testing.T) {
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		t.Skip("DATABASE_URL is not configured")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	pool, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(pool.Close)

	identifier := "google-oauth-integration@invalid.example"
	collisionIdentifier := "google-oauth-collision@invalid.example"
	if _, err := pool.Exec(ctx, `DELETE FROM users WHERE identifier IN ($1, $2)`, identifier, collisionIdentifier); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() {
		cleanupCtx, cleanupCancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cleanupCancel()
		if _, err := pool.Exec(cleanupCtx, `DELETE FROM users WHERE identifier IN ($1, $2)`, identifier, collisionIdentifier); err != nil {
			t.Errorf("cleanup Google test user: %v", err)
		}
	})

	repository := NewRepository(pool)
	service := NewService(repository, NewTokenManager("test-issuer", "test-audience", "test-only-signing-key-at-least-32-bytes", 15*time.Minute, 24*time.Hour))
	user, err := repository.GoogleUser(ctx, "google-integration-subject", identifier, time.Now().UTC())
	if err != nil {
		t.Fatal(err)
	}
	if user.PasswordHash != "" || user.Role != RoleUser {
		t.Fatalf("Google user = %#v", user)
	}
	session, err := service.newSession(ctx, user)
	if err != nil {
		t.Fatal(err)
	}
	if _, err := service.Refresh(ctx, session.RefreshToken); err != nil {
		t.Fatalf("refresh Google-only session: %v", err)
	}
	if _, err := service.Login(ctx, identifier, "any password must not work"); !errors.Is(err, ErrInvalidLogin) {
		t.Fatalf("password login for Google-only user error = %v; want ErrInvalidLogin", err)
	}
	if _, err := pool.Exec(ctx, `INSERT INTO users (identifier, password_hash) VALUES ($1, '$argon2id$test-placeholder')`, collisionIdentifier); err != nil {
		t.Fatal(err)
	}
	if _, err := repository.GoogleUser(ctx, "different-google-subject", collisionIdentifier, time.Now().UTC()); !errors.Is(err, ErrConflict) {
		t.Fatalf("GoogleUser() collision error = %v; want ErrConflict", err)
	}
}
