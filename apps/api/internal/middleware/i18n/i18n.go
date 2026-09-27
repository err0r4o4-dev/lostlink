package i18n

import (
	"context"
	"strings"

	"github.com/gin-gonic/gin"
)

type contextKey string

const languageKey contextKey = "language"

// DefaultLanguage is the fallback language if none is provided.
const DefaultLanguage = "th"

// Middleware parses the Accept-Language header and stores it in the context.
func Middleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		lang := c.GetHeader("Accept-Language")
		if lang == "" {
			lang = DefaultLanguage
		} else {
			// Extract primary language tag (e.g., "th-TH,th;q=0.9" -> "th")
			lang = strings.Split(lang, "-")[0]
			lang = strings.Split(lang, ",")[0]
			lang = strings.ToLower(strings.TrimSpace(lang))
		}

		// Save in gin.Context for quick access in handlers
		c.Set("language", lang)

		// Save in context.Context for services
		ctx := context.WithValue(c.Request.Context(), languageKey, lang)
		c.Request = c.Request.WithContext(ctx)

		c.Next()
	}
}

// FromContext retrieves the language from a context.Context.
func FromContext(ctx context.Context) string {
	if lang, ok := ctx.Value(languageKey).(string); ok && lang != "" {
		return lang
	}
	return DefaultLanguage
}
