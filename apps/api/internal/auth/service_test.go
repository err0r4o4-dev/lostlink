package auth

import (
	"context"
	"errors"
	"testing"
	"time"
)

type memoryStore struct {
	user          User
	digest        []byte
	nextDigest    []byte
	revoked       bool
	refreshReused bool
}

func (store *memoryStore) CreateUserWithSession(_ context.Context, identifier, hash string, digest []byte, _ time.Time) (User, error) {
	if store.user.ID != "" {
		return User{}, ErrConflict
	}
	store.user = User{ID: "user-1", Identifier: identifier, PasswordHash: hash, Role: RoleUser, CreatedAt: time.Unix(100, 0).UTC()}
	store.digest = append([]byte(nil), digest...)
	return store.user, nil
}
func (store *memoryStore) UserByIdentifier(_ context.Context, identifier string) (User, error) {
	if store.user.Identifier != identifier {
		return User{}, ErrInvalidLogin
	}
	return store.user, nil
}
func (store *memoryStore) UserByID(_ context.Context, id string) (User, error) {
	if store.user.ID != id {
		return User{}, ErrInvalidLogin
	}
	return store.user, nil
}
func (store *memoryStore) GoogleUser(_ context.Context, subject, email string, _ time.Time) (User, error) {
	if subject == "" || email == "" {
		return User{}, ErrInvalidLogin
	}
	if store.user.ID == "" {
		store.user = User{ID: "user-1", Identifier: email, Role: RoleUser, CreatedAt: time.Unix(100, 0).UTC()}
	}
	return store.user, nil
}
func (store *memoryStore) CreateSession(_ context.Context, _ string, digest []byte, _ time.Time) error {
	store.digest = append([]byte(nil), digest...)
	return nil
}
func (store *memoryStore) RotateSession(_ context.Context, digest, next []byte, _ time.Time, _ time.Time) (User, error) {
	if store.refreshReused || string(digest) != string(store.digest) {
		return User{}, ErrRefreshReuse
	}
	store.refreshReused = true
	store.nextDigest = append([]byte(nil), next...)
	return store.user, nil
}
func (store *memoryStore) RevokeSession(_ context.Context, digest []byte, _ time.Time) error {
	if len(digest) == 0 {
		return errors.New("empty digest")
	}
	store.revoked = true
	return nil
}

func newTestService(store Store) *Service {
	manager := NewTokenManager("issuer", "audience", "01234567890123456789012345678901", 15*time.Minute, 24*time.Hour)
	manager.now = func() time.Time { return time.Unix(1_700_000_000, 0).UTC() }
	return NewService(store, manager)
}

func TestRegisterLoginRefreshAndLogout(t *testing.T) {
	store := new(memoryStore)
	service := newTestService(store)
	ctx := context.Background()

	registered, err := service.Register(ctx, " Student@Example.edu ", "a sufficiently long password")
	if err != nil {
		t.Fatalf("register: %v", err)
	}
	if registered.User.Identifier != "student@example.edu" {
		t.Fatalf("identifier = %q", registered.User.Identifier)
	}
	if registered.RefreshToken == "" || registered.AccessToken == "" {
		t.Fatal("register did not issue both credentials")
	}
	if registered.User.PasswordHash == "" || registered.User.PasswordHash == "a sufficiently long password" {
		t.Fatal("password was not hashed")
	}

	loggedIn, err := service.Login(ctx, "STUDENT@example.edu", "a sufficiently long password")
	if err != nil {
		t.Fatalf("login: %v", err)
	}
	principal, err := service.Authenticate(loggedIn.AccessToken)
	if err != nil || principal.ID != "user-1" || principal.Role != RoleUser {
		t.Fatalf("principal = %#v, err = %v", principal, err)
	}

	rotated, err := service.Refresh(ctx, loggedIn.RefreshToken)
	if err != nil {
		t.Fatalf("refresh: %v", err)
	}
	if rotated.RefreshToken == loggedIn.RefreshToken {
		t.Fatal("refresh credential was not rotated")
	}
	if _, err := service.Refresh(ctx, loggedIn.RefreshToken); !errors.Is(err, ErrRefreshReuse) {
		t.Fatalf("reused refresh error = %v", err)
	}

	if err := service.Logout(ctx, rotated.RefreshToken); err != nil {
		t.Fatalf("logout: %v", err)
	}
	if !store.revoked {
		t.Fatal("logout did not revoke the refresh session")
	}
}

func TestLoginUsesGenericCredentialError(t *testing.T) {
	store := new(memoryStore)
	service := newTestService(store)
	if _, err := service.Register(context.Background(), "student@example.edu", "a sufficiently long password"); err != nil {
		t.Fatal(err)
	}
	for _, test := range []struct{ identifier, password string }{{"unknown@example.edu", "anything at all"}, {"student@example.edu", "wrong password"}} {
		if _, err := service.Login(context.Background(), test.identifier, test.password); !errors.Is(err, ErrInvalidLogin) {
			t.Fatalf("login error = %v; want generic ErrInvalidLogin", err)
		}
	}
}

func TestPasswordValidationAndHashVerification(t *testing.T) {
	if err := validatePassword("short"); err == nil {
		t.Fatal("short password accepted")
	}
	hash, err := hashPassword("a sufficiently long password")
	if err != nil {
		t.Fatal(err)
	}
	if !verifyPassword(hash, "a sufficiently long password") {
		t.Fatal("valid password rejected")
	}
	if verifyPassword(hash, "another long password") {
		t.Fatal("invalid password accepted")
	}
}
