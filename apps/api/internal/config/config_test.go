package config

import (
	"strings"
	"testing"
)

func setValidAuthEnvironment(t *testing.T) {
	t.Helper()
	t.Setenv("APP_ENV", "test")
	t.Setenv("API_PORT", "8081")
	t.Setenv("JWT_ACCESS_TTL", "15m")
	t.Setenv("JWT_REFRESH_TTL", "720h")
	t.Setenv("JWT_SECRET", strings.Repeat("a", minimumJWTSecretBytes))
	t.Setenv("GOOGLE_OAUTH_CLIENT_ID", "")
	t.Setenv("GOOGLE_OAUTH_CLIENT_SECRET", "")
	t.Setenv("GOOGLE_OAUTH_REDIRECT_URL", "")
	t.Setenv("AI_SERVICE_URL", "http://localhost:8000")
	t.Setenv("AI_SERVICE_TOKEN", "test-internal-service-token-value")
	t.Setenv("STORAGE_ENDPOINT", "")
	t.Setenv("STORAGE_BUCKET", "")
	t.Setenv("STORAGE_ACCESS_KEY", "")
	t.Setenv("STORAGE_SECRET_KEY", "")
	t.Setenv("STORAGE_USE_SSL", "false")
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

func TestLoadAccepts29ByteJWTSecret(t *testing.T) {
	setValidAuthEnvironment(t)
	t.Setenv("JWT_SECRET", strings.Repeat("a", 29))

	if _, err := Load(); err != nil {
		t.Fatalf("Load() unexpected error for a 29-byte JWT secret: %v", err)
	}
}

func TestLoadRejects28ByteJWTSecret(t *testing.T) {
	setValidAuthEnvironment(t)
	t.Setenv("JWT_SECRET", strings.Repeat("a", 28))

	if _, err := Load(); err == nil {
		t.Fatal("Load() expected an error for a 28-byte JWT secret")
	}
}

func TestLoadDoesNotAcceptLegacyJWTSigningKey(t *testing.T) {
	setValidAuthEnvironment(t)
	t.Setenv("JWT_SECRET", "")
	t.Setenv("JWT_SIGNING_KEY", "legacy-signing-key-at-least-32-bytes")

	if _, err := Load(); err == nil {
		t.Fatal("Load() expected JWT_SIGNING_KEY to be ignored")
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
	t.Setenv("JWT_SECRET", "production-only-signing-key-at-least-32-bytes")
	t.Setenv("GOOGLE_OAUTH_CLIENT_ID", "google-client-id")
	t.Setenv("GOOGLE_OAUTH_CLIENT_SECRET", "google-client-secret")
	t.Setenv("GOOGLE_OAUTH_REDIRECT_URL", "http://example.com/api/v1/auth/google/callback")

	if _, err := Load(); err == nil {
		t.Fatal("Load() expected an error for a non-HTTPS production callback")
	}
}

func TestLoadRejectsShortAIServiceToken(t *testing.T) {
	setValidAuthEnvironment(t)
	t.Setenv("AI_SERVICE_TOKEN", "too-short")

	if _, err := Load(); err == nil {
		t.Fatal("Load() expected an error for a short AI service token")
	}
}

func TestLoadRejectsPartialStorageConfiguration(t *testing.T) {
	setValidAuthEnvironment(t)
	t.Setenv("STORAGE_ENDPOINT", "localhost:9000")

	if _, err := Load(); err == nil {
		t.Fatal("Load() expected an error for partial storage configuration")
	}
}

func TestLoadAcceptsCompleteStorageConfiguration(t *testing.T) {
	setValidAuthEnvironment(t)
	t.Setenv("STORAGE_ENDPOINT", "localhost:9000")
	t.Setenv("STORAGE_BUCKET", "lostlink-test")
	t.Setenv("STORAGE_ACCESS_KEY", "access-key")
	t.Setenv("STORAGE_SECRET_KEY", "secret-key")
	t.Setenv("STORAGE_USE_SSL", "true")

	cfg, err := Load()
	if err != nil || !cfg.StorageUseSSL || cfg.StorageBucket != "lostlink-test" {
		t.Fatalf("Load() storage config = %#v, %v", cfg, err)
	}
}
