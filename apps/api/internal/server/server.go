// Package server configures the public Gin HTTP boundary.
package server

import (
	"log/slog"
	"net/http"
	"time"

	apiDocs "github.com/err0r4o4-dev/lostlink/apps/api/docs"
	"github.com/gin-gonic/gin"
	"github.com/watchakorn-18k/scalar-go"
)

type HealthResponse struct {
	Status  string `json:"status" example:"ok"`
	Service string `json:"service" example:"api"`
}

func New(logger *slog.Logger) http.Handler {
	router := gin.New()
	router.Use(gin.Recovery(), requestLogger(logger))
	router.GET("/health", health)
	docsHTML, docsErr := scalar.ApiReferenceHTML(&scalar.Options{
		CDN:         "https://cdn.jsdelivr.net/npm/@scalar/api-reference@1.63.0",
		Layout:      scalar.LayoutModern,
		SpecURL:     "docs/swagger.yaml",
		SpecContent: string(apiDocs.OpenAPI),
		DarkMode:    true,
		ShowSidebar: true,
		CustomOptions: scalar.CustomOptions{
			PageTitle: "LostLink API Reference",
		},
	})
	router.GET("/docs", func(c *gin.Context) {
		if docsErr != nil {
			c.String(http.StatusInternalServerError, "API documentation is unavailable")
			return
		}
		c.Data(http.StatusOK, "text/html; charset=utf-8", []byte(docsHTML))
	})
	router.GET("/docs/swagger.yaml", serveOpenAPI)
	router.GET("/swagger/*any", func(c *gin.Context) {
		if c.Param("any") == "/openapi.yaml" {
			serveOpenAPI(c)
			return
		}
		c.Redirect(http.StatusTemporaryRedirect, "/docs")
	})
	return router
}

func serveOpenAPI(c *gin.Context) {
	c.Data(http.StatusOK, "application/yaml; charset=utf-8", apiDocs.OpenAPI)
}

// health reports process liveness only.
func health(c *gin.Context) {
	c.JSON(http.StatusOK, HealthResponse{Status: "ok", Service: "api"})
}

func requestLogger(logger *slog.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		started := time.Now()
		c.Next()
		logger.Info("http request",
			"method", c.Request.Method,
			"path", c.FullPath(),
			"status", c.Writer.Status(),
			"duration_ms", time.Since(started).Milliseconds(),
		)
	}
}
