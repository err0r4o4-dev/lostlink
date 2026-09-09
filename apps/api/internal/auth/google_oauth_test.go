package auth

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"

	"golang.org/x/oauth2"
	"google.golang.org/api/idtoken"
)

func testGoogleOAuth(t *testing.T) *GoogleOAuth {
	t.Helper()
	tokenServer := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		if err := request.ParseForm(); err != nil {
			t.Fatal(err)
		}
		if request.Form.Get("code_verifier") == "" {
			t.Error("token exchange did not include the PKCE verifier")
		}
		writer.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(writer).Encode(map[string]any{"access_token": "unused-google-access", "token_type": "Bearer", "id_token": "validated-by-test-double"})
	}))
	t.Cleanup(tokenServer.Close)
	googleOAuth := NewGoogleOAuth("client-id", "client-secret", "http://localhost:8088/api/v1/auth/google/callback")
	googleOAuth.config.Endpoint = oauth2.Endpoint{AuthURL: "https://accounts.google.com/o/oauth2/v2/auth", TokenURL: tokenServer.URL}
	googleOAuth.validate = func(_ context.Context, rawToken, audience string) (*idtoken.Payload, error) {
		if rawToken != "validated-by-test-double" || audience != "client-id" {
			t.Fatalf("validator received token=%q audience=%q", rawToken, audience)
		}
		return &idtoken.Payload{Issuer: "https://accounts.google.com", Subject: "google-subject", Claims: map[string]any{
			"email": "student@example.edu", "email_verified": true, "nonce": "expected-nonce",
		}}, nil
	}
	return googleOAuth
}

func TestGoogleAuthorizationURLUsesStatePKCEAndNonce(t *testing.T) {
	googleOAuth := testGoogleOAuth(t)
	location, err := url.Parse(googleOAuth.AuthorizationURL("expected-state", "expected-verifier", "expected-nonce"))
	if err != nil {
		t.Fatal(err)
	}
	query := location.Query()
	for key, expected := range map[string]string{"state": "expected-state", "nonce": "expected-nonce", "code_challenge_method": "S256", "response_type": "code"} {
		if query.Get(key) != expected {
			t.Errorf("%s = %q; want %q", key, query.Get(key), expected)
		}
	}
	if query.Get("code_challenge") == "" {
		t.Error("authorization URL is missing a PKCE challenge")
	}
}

func TestGoogleExchangeValidatesIdentityClaims(t *testing.T) {
	googleOAuth := testGoogleOAuth(t)
	identity, err := googleOAuth.Exchange(context.Background(), "authorization-code", "verifier", "expected-nonce")
	if err != nil {
		t.Fatal(err)
	}
	if identity.Subject != "google-subject" || identity.Email != "student@example.edu" {
		t.Fatalf("identity = %#v", identity)
	}
	if _, err := googleOAuth.Exchange(context.Background(), "authorization-code", "verifier", "wrong-nonce"); err == nil {
		t.Fatal("Exchange() accepted an invalid nonce")
	}
}

func TestGoogleHTTPFlowSetsTransientAndRefreshCookies(t *testing.T) {
	service := newTestService(new(memoryStore))
	googleOAuth := testGoogleOAuth(t)
	ginRouter := testAuthRouterWithGoogle(service, googleOAuth)

	startRequest := httptest.NewRequest(http.MethodGet, "/v1/auth/google/start", nil)
	start := httptest.NewRecorder()
	ginRouter.ServeHTTP(start, startRequest)
	if start.Code != http.StatusFound {
		t.Fatalf("start status = %d", start.Code)
	}
	location, err := url.Parse(start.Header().Get("Location"))
	if err != nil {
		t.Fatal(err)
	}
	cookies := start.Result().Cookies()
	if len(cookies) != 3 {
		t.Fatalf("transient cookies = %d; want 3", len(cookies))
	}
	nonceValue := ""
	for _, cookie := range cookies {
		if !cookie.HttpOnly || cookie.SameSite != http.SameSiteLaxMode {
			t.Fatalf("unsafe transient cookie: %#v", cookie)
		}
		if cookie.Name == googleNonceCookie {
			nonceValue = cookie.Value
		}
	}
	googleOAuth.validate = func(_ context.Context, _, _ string) (*idtoken.Payload, error) {
		return &idtoken.Payload{Issuer: "https://accounts.google.com", Subject: "google-subject", Claims: map[string]any{"email": "student@example.edu", "email_verified": true, "nonce": nonceValue}}, nil
	}

	callbackRequest := httptest.NewRequest(http.MethodGet, "/v1/auth/google/callback?code=authorization-code&state="+url.QueryEscape(location.Query().Get("state")), nil)
	for _, cookie := range cookies {
		callbackRequest.AddCookie(cookie)
	}
	callback := httptest.NewRecorder()
	ginRouter.ServeHTTP(callback, callbackRequest)
	if callback.Code != http.StatusSeeOther || callback.Header().Get("Location") != "http://localhost:8088/auth/callback" {
		t.Fatalf("callback status=%d location=%q", callback.Code, callback.Header().Get("Location"))
	}
	foundRefresh := false
	for _, cookie := range callback.Result().Cookies() {
		if cookie.Name == refreshCookie && cookie.HttpOnly && cookie.SameSite == http.SameSiteStrictMode {
			foundRefresh = true
		}
	}
	if !foundRefresh {
		t.Fatal("callback did not set a protected refresh cookie")
	}
}
