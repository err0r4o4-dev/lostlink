package auth

import (
	"context"
	"errors"
	"strings"
	"time"
	"unicode/utf8"
)

type Store interface {
	CreateUserWithSession(context.Context, string, string, []byte, time.Time) (User, error)
	UserByIdentifier(context.Context, string) (User, error)
	UserByID(context.Context, string) (User, error)
	CreateSession(context.Context, string, []byte, time.Time) error
	RotateSession(context.Context, []byte, []byte, time.Time, time.Time) (User, error)
	RevokeSession(context.Context, []byte, time.Time) error
}

type Service struct {
	store             Store
	tokens            *TokenManager
	dummyPasswordHash string
}

func NewService(store Store, tokens *TokenManager) *Service {
	dummyHash, _ := hashPassword("lostlink-dummy-password-value")
	return &Service{store: store, tokens: tokens, dummyPasswordHash: dummyHash}
}

func (service *Service) Register(ctx context.Context, identifier, password string) (Session, error) {
	identifier = normalizeIdentifier(identifier)
	if length := utf8.RuneCountInString(identifier); length < 3 || length > 254 {
		return Session{}, errors.New("identifier must be between 3 and 254 characters")
	}
	if err := validatePassword(password); err != nil {
		return Session{}, err
	}
	hash, err := hashPassword(password)
	if err != nil {
		return Session{}, err
	}
	refresh, err := randomToken(32)
	if err != nil {
		return Session{}, err
	}
	now := service.tokens.now().UTC()
	user, err := service.store.CreateUserWithSession(ctx, identifier, hash, digestRefresh(refresh), now.Add(service.tokens.refreshTTL))
	if err != nil {
		return Session{}, err
	}
	access, expiry, err := service.tokens.accessToken(user)
	if err != nil {
		return Session{}, err
	}
	return Session{AccessToken: access, RefreshToken: refresh, AccessExpiry: expiry, User: user}, nil
}

func (service *Service) Login(ctx context.Context, identifier, password string) (Session, error) {
	user, err := service.store.UserByIdentifier(ctx, normalizeIdentifier(identifier))
	if errors.Is(err, ErrInvalidLogin) {
		verifyPassword(service.dummyPasswordHash, password)
		return Session{}, ErrInvalidLogin
	}
	if err != nil {
		return Session{}, err
	}
	if !verifyPassword(user.PasswordHash, password) {
		return Session{}, ErrInvalidLogin
	}
	return service.newSession(ctx, user)
}

func (service *Service) newSession(ctx context.Context, user User) (Session, error) {
	refresh, err := randomToken(32)
	if err != nil {
		return Session{}, err
	}
	now := service.tokens.now().UTC()
	if err := service.store.CreateSession(ctx, user.ID, digestRefresh(refresh), now.Add(service.tokens.refreshTTL)); err != nil {
		return Session{}, err
	}
	access, expiry, err := service.tokens.accessToken(user)
	if err != nil {
		return Session{}, err
	}
	return Session{AccessToken: access, RefreshToken: refresh, AccessExpiry: expiry, User: user}, nil
}

func (service *Service) Refresh(ctx context.Context, refresh string) (Session, error) {
	if refresh == "" {
		return Session{}, ErrInvalidRefresh
	}
	next, err := randomToken(32)
	if err != nil {
		return Session{}, err
	}
	now := service.tokens.now().UTC()
	user, err := service.store.RotateSession(ctx, digestRefresh(refresh), digestRefresh(next), now.Add(service.tokens.refreshTTL), now)
	if err != nil {
		return Session{}, err
	}
	access, expiry, err := service.tokens.accessToken(user)
	if err != nil {
		return Session{}, err
	}
	return Session{AccessToken: access, RefreshToken: next, AccessExpiry: expiry, User: user}, nil
}

func (service *Service) Logout(ctx context.Context, refresh string) error {
	if refresh == "" {
		return nil
	}
	return service.store.RevokeSession(ctx, digestRefresh(refresh), service.tokens.now().UTC())
}

func (service *Service) Authenticate(access string) (User, error) {
	return service.tokens.parseAccess(access)
}

func (service *Service) User(ctx context.Context, id string) (User, error) {
	return service.store.UserByID(ctx, id)
}

func normalizeIdentifier(value string) string { return strings.ToLower(strings.TrimSpace(value)) }
