// Package main starts the public LostLink API.
package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/err0r4o4-dev/lostlink/apps/api/internal/admin"
	"github.com/err0r4o4-dev/lostlink/apps/api/internal/aichat"
	"github.com/err0r4o4-dev/lostlink/apps/api/internal/auth"
	"github.com/err0r4o4-dev/lostlink/apps/api/internal/claim"
	"github.com/err0r4o4-dev/lostlink/apps/api/internal/config"
	"github.com/err0r4o4-dev/lostlink/apps/api/internal/database"
	"github.com/err0r4o4-dev/lostlink/apps/api/internal/matching"
	"github.com/err0r4o4-dev/lostlink/apps/api/internal/notification"
	"github.com/err0r4o4-dev/lostlink/apps/api/internal/report"
	"github.com/err0r4o4-dev/lostlink/apps/api/internal/server"
	objectstorage "github.com/err0r4o4-dev/lostlink/apps/api/internal/storage"
	"github.com/err0r4o4-dev/lostlink/apps/api/internal/tracking"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	cfg, err := config.Load()
	if err != nil {
		logger.Error("invalid configuration", "error", err)
		os.Exit(1)
	}

	rootCtx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	pool, err := database.Open(rootCtx, cfg.DatabaseURL)
	if err != nil {
		logger.Error("database connection failed", "error", err)
		os.Exit(1)
	}
	if pool != nil {
		defer pool.Close()
	}

	var authService *auth.Service
	var reportService *report.Service
	var matchingService *matching.Service
	var claimService *claim.Service
	var trackingService *tracking.Service
	var notificationService *notification.Service
	var adminRepository *admin.Repository
	var aichatService *aichat.Service
	var googleOAuth *auth.GoogleOAuth
	if pool != nil {
		var objects objectstorage.Store
		if cfg.StorageEndpoint != "" {
			storageClient, err := objectstorage.NewS3Store(
				cfg.StorageEndpoint, cfg.StorageBucket, cfg.StorageAccessKey, cfg.StorageSecretKey, cfg.StorageUseSSL,
			)
			if err != nil {
				logger.Error("object storage configuration failed", "error", err)
				os.Exit(1)
			}
			storageCtx, cancel := context.WithTimeout(rootCtx, 5*time.Second)
			if err := storageClient.EnsureBucket(storageCtx); err != nil {
				cancel()
				logger.Error("object storage initialization failed", "error", err)
				os.Exit(1)
			}
			cleaned, failed, cleanupErr := objectstorage.ProcessCleanup(storageCtx, pool, storageClient, 100)
			if cleanupErr != nil || failed > 0 {
				logger.Warn("object cleanup retry incomplete", "cleaned", cleaned, "failed", failed, "error", cleanupErr)
			} else if cleaned > 0 {
				logger.Info("object cleanup retry completed", "cleaned", cleaned)
			}
			cancel()
			objects = storageClient
		}
		authService = auth.NewService(auth.NewRepository(pool), auth.NewTokenManager(
			cfg.JWTIssuer, cfg.JWTAudience, cfg.JWTSecret, cfg.JWTAccessTTL, cfg.RefreshTTL,
		))
		reportService = report.NewService(report.NewRepository(pool), objects)
		matchingService = matching.NewService(matching.NewRepository(pool), matching.NewAIClient(cfg.AIServiceURL, cfg.AIServiceToken))
		claimService = claim.NewService(claim.NewRepository(pool), objects)
		trackingService = tracking.NewService(tracking.NewRepository(pool))
		notificationService = notification.NewService(notification.NewRepository(pool))
		adminRepository = admin.NewRepository(pool)
		aichatService = aichat.NewService(aichat.NewRepository(pool), aichat.NewAIClient(cfg.AIServiceURL, cfg.AIServiceToken))
		googleOAuth = auth.NewGoogleOAuth(cfg.GoogleClientID, cfg.GoogleClientSecret, cfg.GoogleRedirectURL)
	}

	httpServer := &http.Server{
		Addr: ":" + cfg.Port,
		Handler: server.New(os.Stdout, server.Options{
			Auth: authService, Reports: reportService, Matching: matchingService, Claims: claimService,
			Tracking: trackingService, Notifications: notificationService, Admin: adminRepository,
			AIChat:    aichatService,
			WebOrigin: cfg.WebOrigin, SecureCookies: cfg.Environment == "production", GoogleOAuth: googleOAuth,
		}),
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       15 * time.Second,
		WriteTimeout:      15 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	serverErrors := make(chan error, 1)
	go func() {
		logger.Info("api listening", "address", httpServer.Addr, "environment", cfg.Environment)
		serverErrors <- httpServer.ListenAndServe()
	}()

	select {
	case <-rootCtx.Done():
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		if err := httpServer.Shutdown(shutdownCtx); err != nil {
			logger.Error("api shutdown failed", "error", err)
			os.Exit(1)
		}
	case err := <-serverErrors:
		if !errors.Is(err, http.ErrServerClosed) {
			logger.Error("api stopped unexpectedly", "error", err)
			os.Exit(1)
		}
	}
}
