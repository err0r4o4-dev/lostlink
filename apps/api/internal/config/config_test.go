package config

import "testing"

func setValidAuthEnvironment(t *testing.T) {
	t.Helper()
	t.Setenv("APP_ENV", "test")
	t.Setenv("API_PORT", "8080")
	t.Setenv("JWT_ACCESS_TTL", "15m")
	t.Setenv("JWT_REFRESH_TTL", "720h")
	t.Setenv("JWT_SIGNING_KEY", "test-only-signing-key-at-least-32-bytes")
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
