// Package server configures the public Gin HTTP boundary.
package server

import (
	"log/slog"
	"net/http"
	"time"

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
	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
	return router
}

// health reports process liveness only.
// @Summary API health
// @Description Reports whether the API process is accepting HTTP requests.
// @Tags operations
// @Produce json
// @Success 200 {object} HealthResponse
// @Router /health [get]
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
