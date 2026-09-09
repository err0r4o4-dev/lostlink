// Package server configures the public Gin HTTP boundary.
package server

import (
	"fmt"
	"io"
	"net/http"

	apiDocs "github.com/err0r4o4-dev/lostlink/apps/api/docs"
	"github.com/gin-gonic/gin"
	"github.com/watchakorn-18k/scalar-go"
)

type HealthResponse struct {
	Status  string `json:"status" example:"ok"`
	Service string `json:"service" example:"api"`
}

func New(requestLogWriter io.Writer) http.Handler {
	router := gin.New()
	router.Use(gin.LoggerWithConfig(gin.LoggerConfig{
		Formatter: readableRequestLog,
		Output:    requestLogWriter,
		SkipPaths: []string{"/health"},
	}), gin.Recovery())
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

func readableRequestLog(param gin.LogFormatterParams) string {
	// Deliberately omit RawQuery: LostLink search terms and opaque references may
	// contain private data that must not be retained in routine access logs.
	return fmt.Sprintf("[GIN] %s | %3d | %13v | %15s | %-7s %q\n",
		param.TimeStamp.Format("2006/01/02 - 15:04:05"),
		param.StatusCode,
		param.Latency,
		param.ClientIP,
		param.Method,
		param.Request.URL.Path,
	)
}
