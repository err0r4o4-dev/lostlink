// Package config loads environment-backed API configuration.
package config

import (
	"fmt"
	"net"
	"os"
)

type Config struct {
	Environment string
	Port        string
	DatabaseURL string
}

func Load() (Config, error) {
	cfg := Config{
		Environment: valueOrDefault("APP_ENV", "development"),
		Port:        valueOrDefault("API_PORT", "8080"),
		DatabaseURL: os.Getenv("DATABASE_URL"),
	}

	if cfg.Environment == "" {
		return Config{}, fmt.Errorf("APP_ENV must not be empty")
	}
	if _, err := net.LookupPort("tcp", cfg.Port); err != nil {
		return Config{}, fmt.Errorf("API_PORT must be a valid TCP port: %w", err)
	}

	return cfg, nil
}

func valueOrDefault(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}
