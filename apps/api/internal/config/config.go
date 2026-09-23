// Package config loads environment-backed API configuration.
package config

import (
	"fmt"
	"net"
	"net/url"
	"os"
	"strconv"
	"strings"
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
	AIServiceURL       string
	AIServiceToken     string
	StorageEndpoint    string
	StorageBucket      string
	StorageAccessKey   string
	StorageSecretKey   string
	StorageUseSSL      bool
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
		AIServiceURL:       valueOrDefault("AI_SERVICE_URL", "http://localhost:8000"),
		AIServiceToken:     valueOrDefault("AI_SERVICE_TOKEN", "replace-me-internal-service-token"),
		StorageEndpoint:    os.Getenv("STORAGE_ENDPOINT"),
		StorageBucket:      os.Getenv("STORAGE_BUCKET"),
		StorageAccessKey:   os.Getenv("STORAGE_ACCESS_KEY"),
		StorageSecretKey:   os.Getenv("STORAGE_SECRET_KEY"),
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
	aiURL, err := url.ParseRequestURI(cfg.AIServiceURL)
	if err != nil || aiURL.Host == "" || (aiURL.Scheme != "http" && aiURL.Scheme != "https") || aiURL.User != nil || aiURL.RawQuery != "" || aiURL.Fragment != "" {
		return Config{}, fmt.Errorf("AI_SERVICE_URL must be an absolute HTTP(S) URL without credentials, query, or fragment")
	}
	if len(cfg.AIServiceToken) < 24 {
		return Config{}, fmt.Errorf("AI_SERVICE_TOKEN must contain at least 24 bytes")
	}
	if cfg.Environment == "production" && cfg.AIServiceToken == "replace-me-internal-service-token" {
		return Config{}, fmt.Errorf("AI_SERVICE_TOKEN placeholder is forbidden in production")
	}
	storageValues := 0
	for _, value := range []string{cfg.StorageEndpoint, cfg.StorageBucket, cfg.StorageAccessKey, cfg.StorageSecretKey} {
		if value != "" {
			storageValues++
		}
	}
	if storageValues != 0 && storageValues != 4 {
		return Config{}, fmt.Errorf("STORAGE_ENDPOINT, STORAGE_BUCKET, STORAGE_ACCESS_KEY, and STORAGE_SECRET_KEY must be configured together")
	}
	if strings.Contains(cfg.StorageEndpoint, "://") {
		return Config{}, fmt.Errorf("STORAGE_ENDPOINT must be host:port without a URL scheme")
	}
	if cfg.StorageUseSSL, err = strconv.ParseBool(valueOrDefault("STORAGE_USE_SSL", "false")); err != nil {
		return Config{}, fmt.Errorf("STORAGE_USE_SSL must be true or false")
	}

	return cfg, nil
}

func valueOrDefault(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}
