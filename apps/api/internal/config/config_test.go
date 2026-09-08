package config

import "testing"

func TestLoadRejectsExplicitlyEmptyEnvironment(t *testing.T) {
	t.Setenv("APP_ENV", "")
	t.Setenv("API_PORT", "8080")

	if _, err := Load(); err == nil {
		t.Fatal("Load() expected an error for an explicitly empty APP_ENV")
	}
}

func TestLoadRejectsInvalidPort(t *testing.T) {
	t.Setenv("APP_ENV", "test")
	t.Setenv("API_PORT", "not-a-port")

	if _, err := Load(); err == nil {
		t.Fatal("Load() expected an error for an invalid API_PORT")
	}
}
