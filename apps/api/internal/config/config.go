// Package config loads environment-backed API configuration.
package config

import (
	"fmt"
	"net"
	"net/url"
	"os"
	"time"
)

const minimumJWTSecretBytes = 29

type Config struct {
	Environment        string
	Port               string
	DatabaseURL        string
	WebOrigin          string
	JWTIssuer          string
	JWTAudience        string
	JWTAccessTTL       time.Duration
	RefreshTTL         time.Duration
	JWTSecret          string
	GoogleClientID     string
	GoogleClientSecret string
	GoogleRedirectURL  string
}

func Load() (Config, error) {
	cfg := Config{
		Environment:        valueOrDefault("APP_ENV", "development"),
		Port:               valueOrDefault("API_PORT", "8080"),
		DatabaseURL:        os.Getenv("DATABASE_URL"),
		WebOrigin:          valueOrDefault("WEB_ORIGIN", "http://localhost:8088"),
		JWTIssuer:          valueOrDefault("JWT_ISSUER", "lostlink-api"),
		JWTAudience:        valueOrDefault("JWT_AUDIENCE", "lostlink-web"),
		JWTSecret:          os.Getenv("JWT_SECRET"),
		GoogleClientID:     os.Getenv("GOOGLE_OAUTH_CLIENT_ID"),
		GoogleClientSecret: os.Getenv("GOOGLE_OAUTH_CLIENT_SECRET"),
		GoogleRedirectURL:  os.Getenv("GOOGLE_OAUTH_REDIRECT_URL"),
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
	if len(cfg.JWTSecret) < minimumJWTSecretBytes {
		return Config{}, fmt.Errorf("JWT_SECRET must contain at least %d bytes", minimumJWTSecretBytes)
	}
	if cfg.Environment == "production" && cfg.JWTSecret == "replace-me-with-at-least-32-random-bytes" {
		return Config{}, fmt.Errorf("JWT_SECRET placeholder is forbidden in production")
	}
	googleValues := 0
	for _, value := range []string{cfg.GoogleClientID, cfg.GoogleClientSecret, cfg.GoogleRedirectURL} {
		if value != "" {
			googleValues++
		}
	}
	if googleValues != 0 && googleValues != 3 {
		return Config{}, fmt.Errorf("GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, and GOOGLE_OAUTH_REDIRECT_URL must be configured together")
	}
	if googleValues == 3 {
		redirect, err := url.ParseRequestURI(cfg.GoogleRedirectURL)
		if err != nil || redirect.Host == "" || (redirect.Scheme != "http" && redirect.Scheme != "https") || redirect.RawQuery != "" || redirect.Fragment != "" {
			return Config{}, fmt.Errorf("GOOGLE_OAUTH_REDIRECT_URL must be an absolute URL without a query or fragment")
		}
		if cfg.Environment == "production" && redirect.Scheme != "https" {
			return Config{}, fmt.Errorf("GOOGLE_OAUTH_REDIRECT_URL must use HTTPS in production")
		}
	}

	return cfg, nil
}

func valueOrDefault(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}
