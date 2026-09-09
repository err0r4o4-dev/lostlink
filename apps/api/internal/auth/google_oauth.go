package auth

import (
	"context"
	"crypto/subtle"
	"errors"
	"time"

	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"google.golang.org/api/idtoken"
)

var ErrGoogleIdentity = errors.New("invalid Google identity")

type GoogleIdentity struct {
	Subject string
	Email   string
}

type googleTokenValidator func(context.Context, string, string) (*idtoken.Payload, error)

type GoogleOAuth struct {
	config   *oauth2.Config
	validate googleTokenValidator
}

func NewGoogleOAuth(clientID, clientSecret, redirectURL string) *GoogleOAuth {
	if clientID == "" || clientSecret == "" || redirectURL == "" {
		return nil
	}
	return &GoogleOAuth{config: &oauth2.Config{
		ClientID: clientID, ClientSecret: clientSecret, RedirectURL: redirectURL,
		Endpoint: google.Endpoint, Scopes: []string{"openid", "email"},
	}, validate: idtoken.Validate}
}

func (googleOAuth *GoogleOAuth) AuthorizationURL(state, verifier, nonce string) string {
	return googleOAuth.config.AuthCodeURL(state,
		oauth2.AccessTypeOnline,
		oauth2.S256ChallengeOption(verifier),
		oauth2.SetAuthURLParam("nonce", nonce),
	)
}

func (googleOAuth *GoogleOAuth) Exchange(ctx context.Context, code, verifier, expectedNonce string) (GoogleIdentity, error) {
	requestCtx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()
	token, err := googleOAuth.config.Exchange(requestCtx, code, oauth2.VerifierOption(verifier))
	if err != nil {
		return GoogleIdentity{}, ErrGoogleIdentity
	}
	rawIDToken, ok := token.Extra("id_token").(string)
	if !ok || rawIDToken == "" {
		return GoogleIdentity{}, ErrGoogleIdentity
	}
	payload, err := googleOAuth.validate(requestCtx, rawIDToken, googleOAuth.config.ClientID)
	if err != nil || payload.Subject == "" || (payload.Issuer != "https://accounts.google.com" && payload.Issuer != "accounts.google.com") {
		return GoogleIdentity{}, ErrGoogleIdentity
	}
	email, emailOK := payload.Claims["email"].(string)
	emailVerified, verifiedOK := payload.Claims["email_verified"].(bool)
	nonce, nonceOK := payload.Claims["nonce"].(string)
	if !emailOK || email == "" || !verifiedOK || !emailVerified || !nonceOK || !constantTimeEqual(nonce, expectedNonce) {
		return GoogleIdentity{}, ErrGoogleIdentity
	}
	return GoogleIdentity{Subject: payload.Subject, Email: email}, nil
}

func constantTimeEqual(left, right string) bool {
	if len(left) != len(right) {
		return false
	}
	return subtle.ConstantTimeCompare([]byte(left), []byte(right)) == 1
}
