package auth

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type TokenManager struct {
	issuer     string
	audience   string
	key        []byte
	accessTTL  time.Duration
	refreshTTL time.Duration
	now        func() time.Time
}

type accessClaims struct {
	Role Role `json:"role"`
	jwt.RegisteredClaims
}

func NewTokenManager(issuer, audience, signingKey string, accessTTL, refreshTTL time.Duration) *TokenManager {
	return &TokenManager{issuer: issuer, audience: audience, key: []byte(signingKey), accessTTL: accessTTL, refreshTTL: refreshTTL, now: time.Now}
}

func (manager *TokenManager) accessToken(user User) (string, time.Time, error) {
	now := manager.now().UTC()
	expires := now.Add(manager.accessTTL)
	jti, err := randomToken(16)
	if err != nil {
		return "", time.Time{}, err
	}
	claims := accessClaims{Role: user.Role, RegisteredClaims: jwt.RegisteredClaims{
		Issuer: manager.issuer, Subject: user.ID, Audience: jwt.ClaimStrings{manager.audience},
		IssuedAt: jwt.NewNumericDate(now), ExpiresAt: jwt.NewNumericDate(expires), ID: jti,
	}}
	token, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString(manager.key)
	return token, expires, err
}

func (manager *TokenManager) parseAccess(tokenString string) (User, error) {
	claims := new(accessClaims)
	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (any, error) {
		if token.Method != jwt.SigningMethodHS256 {
			return nil, errors.New("unexpected signing algorithm")
		}
		return manager.key, nil
	}, jwt.WithIssuer(manager.issuer), jwt.WithAudience(manager.audience), jwt.WithExpirationRequired(), jwt.WithIssuedAt(), jwt.WithTimeFunc(manager.now))
	if err != nil || !token.Valid || claims.Subject == "" || claims.ID == "" || !validRole(claims.Role) {
		return User{}, errors.New("invalid access token")
	}
	return User{ID: claims.Subject, Role: claims.Role}, nil
}

func randomToken(size int) (string, error) {
	value := make([]byte, size)
	if _, err := rand.Read(value); err != nil {
		return "", fmt.Errorf("generate token: %w", err)
	}
	return base64.RawURLEncoding.EncodeToString(value), nil
}

func digestRefresh(token string) []byte {
	digest := sha256.Sum256([]byte(token))
	return digest[:]
}

func validRole(role Role) bool { return role == RoleUser || role == RoleStaff || role == RoleAdmin }
