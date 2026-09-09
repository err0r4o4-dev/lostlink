package config

import "testing"

func setValidAuthEnvironment(t *testing.T) {
	t.Helper()
	t.Setenv("APP_ENV", "test")
	t.Setenv("API_PORT", "8080")
	t.Setenv("JWT_ACCESS_TTL", "15m")
	t.Setenv("JWT_REFRESH_TTL", "720h")
	t.Setenv("JWT_SIGNING_KEY", "test-only-signing-key-at-least-32-bytes")
	t.Setenv("GOOGLE_OAUTH_CLIENT_ID", "")
	t.Setenv("GOOGLE_OAUTH_CLIENT_SECRET", "")
	t.Setenv("GOOGLE_OAUTH_REDIRECT_URL", "")
}

func TestLoadAcceptsValidAuthConfiguration(t *testing.T) {
	setValidAuthEnvironment(t)

	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load() unexpected error: %v", err)
	}
	if cfg.JWTIssuer != "lostlink-api" || cfg.JWTAudience != "lostlink-web" {
		t.Fatalf("Load() returned unexpected token identity: %#v", cfg)
	}
}

func TestLoadRejectsExplicitlyEmptyEnvironment(t *testing.T) {
	setValidAuthEnvironment(t)
	t.Setenv("APP_ENV", "")

	if _, err := Load(); err == nil {
		t.Fatal("Load() expected an error for an explicitly empty APP_ENV")
	}
}

func TestLoadRejectsInvalidPort(t *testing.T) {
	setValidAuthEnvironment(t)
	t.Setenv("API_PORT", "not-a-port")

	if _, err := Load(); err == nil {
		t.Fatal("Load() expected an error for an invalid API_PORT")
	}
}

func TestLoadRejectsShortSigningKey(t *testing.T) {
	setValidAuthEnvironment(t)
	t.Setenv("JWT_SIGNING_KEY", "short")

	if _, err := Load(); err == nil {
		t.Fatal("Load() expected an error for a short JWT signing key")
	}
}

func TestLoadRejectsRefreshTTLNotLongerThanAccessTTL(t *testing.T) {
	setValidAuthEnvironment(t)
	t.Setenv("JWT_REFRESH_TTL", "15m")

	if _, err := Load(); err == nil {
		t.Fatal("Load() expected an error for an invalid refresh TTL")
	}
}

func TestLoadAcceptsCompleteGoogleOAuthConfiguration(t *testing.T) {
	setValidAuthEnvironment(t)
	t.Setenv("GOOGLE_OAUTH_CLIENT_ID", "google-client-id")
	t.Setenv("GOOGLE_OAUTH_CLIENT_SECRET", "google-client-secret")
	t.Setenv("GOOGLE_OAUTH_REDIRECT_URL", "http://localhost:8088/api/v1/auth/google/callback")

	cfg, err := Load()
	if err != nil || cfg.GoogleClientID != "google-client-id" {
		t.Fatalf("Load() Google config = %#v, %v", cfg, err)
	}
}

func TestLoadRejectsPartialGoogleOAuthConfiguration(t *testing.T) {
	setValidAuthEnvironment(t)
	t.Setenv("GOOGLE_OAUTH_CLIENT_ID", "google-client-id")

	if _, err := Load(); err == nil {
		t.Fatal("Load() expected an error for partial Google OAuth configuration")
	}
}

func TestLoadRequiresHTTPSGoogleCallbackInProduction(t *testing.T) {
	setValidAuthEnvironment(t)
	t.Setenv("APP_ENV", "production")
	t.Setenv("JWT_SIGNING_KEY", "production-only-signing-key-at-least-32-bytes")
	t.Setenv("GOOGLE_OAUTH_CLIENT_ID", "google-client-id")
	t.Setenv("GOOGLE_OAUTH_CLIENT_SECRET", "google-client-secret")
	t.Setenv("GOOGLE_OAUTH_REDIRECT_URL", "http://example.com/api/v1/auth/google/callback")

	if _, err := Load(); err == nil {
		t.Fatal("Load() expected an error for a non-HTTPS production callback")
	}
}
