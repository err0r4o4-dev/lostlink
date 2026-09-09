// Package config loads environment-backed API configuration.
package config

import (
	"fmt"
	"net"
	"os"
	"time"
)

type Config struct {
	Environment   string
	Port          string
	DatabaseURL   string
	WebOrigin     string
	JWTIssuer     string
	JWTAudience   string
	JWTAccessTTL  time.Duration
	RefreshTTL    time.Duration
	JWTSigningKey string
}

func Load() (Config, error) {
	cfg := Config{
		Environment:   valueOrDefault("APP_ENV", "development"),
		Port:          valueOrDefault("API_PORT", "8080"),
		DatabaseURL:   os.Getenv("DATABASE_URL"),
		WebOrigin:     valueOrDefault("WEB_ORIGIN", "http://localhost:8088"),
		JWTIssuer:     valueOrDefault("JWT_ISSUER", "lostlink-api"),
		JWTAudience:   valueOrDefault("JWT_AUDIENCE", "lostlink-web"),
		JWTSigningKey: os.Getenv("JWT_SIGNING_KEY"),
	}

	if cfg.Environment == "" {
		return Config{}, fmt.Errorf("APP_ENV must not be empty")
	}
	if _, err := net.LookupPort("tcp", cfg.Port); err != nil {
		return Config{}, fmt.Errorf("API_PORT must be a valid TCP port: %w", err)
	}
	var err error
	if cfg.JWTAccessTTL, err = time.ParseDuration(valueOrDefault("JWT_ACCESS_TTL", "15m")); err != nil || cfg.JWTAccessTTL <= 0 {
		return Config{}, fmt.Errorf("JWT_ACCESS_TTL must be a positive duration")
	}
	if cfg.RefreshTTL, err = time.ParseDuration(valueOrDefault("JWT_REFRESH_TTL", "720h")); err != nil || cfg.RefreshTTL <= cfg.JWTAccessTTL {
		return Config{}, fmt.Errorf("JWT_REFRESH_TTL must be longer than JWT_ACCESS_TTL")
	}
	if len(cfg.JWTSigningKey) < 32 {
		return Config{}, fmt.Errorf("JWT_SIGNING_KEY must contain at least 32 bytes")
	}
	if cfg.Environment == "production" && cfg.JWTSigningKey == "replace-me-with-at-least-32-random-bytes" {
		return Config{}, fmt.Errorf("JWT_SIGNING_KEY placeholder is forbidden in production")
	}

	return cfg, nil
}

func valueOrDefault(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}
