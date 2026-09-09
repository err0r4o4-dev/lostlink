// Package server configures the public Gin HTTP boundary.
package server

import (
	"log/slog"
	"net/http"
	"time"

	apiDocs "github.com/err0r4o4-dev/lostlink/apps/api/docs"
	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

type HealthResponse struct {
	Status  string `json:"status" example:"ok"`
	Service string `json:"service" example:"api"`
}

func New(logger *slog.Logger) http.Handler {
	router := gin.New()
	router.Use(gin.Recovery(), requestLogger(logger))
	router.GET("/health", health)
	swaggerUI := ginSwagger.WrapHandler(swaggerFiles.Handler, ginSwagger.URL("openapi.yaml"))
	router.GET("/swagger/*any", func(c *gin.Context) {
		if c.Param("any") == "/openapi.yaml" {
			c.Data(http.StatusOK, "application/yaml; charset=utf-8", apiDocs.OpenAPI)
			return
		}
		swaggerUI(c)
	})
	return router
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
