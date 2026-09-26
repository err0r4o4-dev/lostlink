// Package server configures the public Gin HTTP boundary.
package server

import (
	"fmt"
	"io"
	"net/http"

	apiDocs "github.com/err0r4o4-dev/lostlink/apps/api/docs"
	"github.com/err0r4o4-dev/lostlink/apps/api/internal/admin"
	"github.com/err0r4o4-dev/lostlink/apps/api/internal/aichat"
	"github.com/err0r4o4-dev/lostlink/apps/api/internal/auth"
	"github.com/err0r4o4-dev/lostlink/apps/api/internal/claim"
	"github.com/err0r4o4-dev/lostlink/apps/api/internal/matching"
	"github.com/err0r4o4-dev/lostlink/apps/api/internal/notification"
	"github.com/err0r4o4-dev/lostlink/apps/api/internal/report"
	"github.com/err0r4o4-dev/lostlink/apps/api/internal/tracking"
	"github.com/gin-gonic/gin"
	"github.com/watchakorn-18k/scalar-go"
)

type HealthResponse struct {
	Status  string `json:"status" example:"ok"`
	Service string `json:"service" example:"api"`
}

type Options struct {
	Auth          *auth.Service
	Reports       *report.Service
	WebOrigin     string
	SecureCookies bool
	GoogleOAuth   *auth.GoogleOAuth
	Matching      *matching.Service
	Claims        *claim.Service
	Tracking      *tracking.Service
	Notifications *notification.Service
	Admin         *admin.Repository
	AIChat        *aichat.Service
}

func New(requestLogWriter io.Writer, configured ...Options) http.Handler {
	var options Options
	if len(configured) > 0 {
		options = configured[0]
	}
	router := gin.New()
	router.Use(gin.LoggerWithConfig(gin.LoggerConfig{
		Formatter: readableRequestLog,
		Output:    requestLogWriter,
		SkipPaths: []string{"/health"},
	}), gin.Recovery())
	router.GET("/health", health)
	if options.Auth != nil {
		v1 := router.Group("/v1")
		auth.RegisterRoutes(v1.Group("/auth"), options.Auth, options.WebOrigin, options.SecureCookies, options.GoogleOAuth)
		if options.Reports != nil {
			report.RegisterRoutes(v1.Group("/reports"), options.Reports, options.Auth)
		}
		if options.Matching != nil {
			matching.RegisterRoutes(v1, options.Matching, options.Auth)
		}
		if options.Claims != nil {
			claim.RegisterRoutes(v1, options.Claims, options.Auth)
		}
		if options.Tracking != nil {
			tracking.RegisterRoutes(v1, options.Tracking, options.Auth)
		}
		if options.Notifications != nil {
			notification.RegisterRoutes(v1, options.Notifications, options.Auth)
		}
		if options.AIChat != nil {
			aichat.RegisterRoutes(v1, options.AIChat, options.Auth)
		}
		staff := v1.Group("/staff")
		if options.Reports != nil {
			report.RegisterStaffRoutes(staff, options.Reports, options.Auth)
		}
		if options.Matching != nil {
			matching.RegisterStaffRoutes(staff, options.Matching, options.Auth)
		}
		if options.Claims != nil {
			claim.RegisterStaffRoutes(staff, options.Claims, options.Auth)
		}
		if options.Tracking != nil {
			tracking.RegisterStaffRoutes(staff, options.Tracking, options.Auth)
		}
		if options.Admin != nil {
			admin.RegisterStaffRoutes(staff, options.Admin, options.Auth)
			admin.RegisterAdminRoutes(v1.Group("/admin"), options.Admin, options.Auth)
		}
	}
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
