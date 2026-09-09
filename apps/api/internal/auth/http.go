package auth

import (
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

const refreshCookie = "lostlink_refresh"

const (
	googleStateCookie    = "lostlink_google_state"
	googleVerifierCookie = "lostlink_google_verifier"
	googleNonceCookie    = "lostlink_google_nonce"
)

type HTTPHandler struct {
	service       *Service
	webOrigin     string
	secureCookies bool
	loginAttempts *attemptLimiter
	google        *GoogleOAuth
}

type credentialsRequest struct {
	Identifier string `json:"identifier" binding:"required"`
	Password   string `json:"password" binding:"required"`
}

type sessionResponse struct {
	AccessToken string     `json:"access_token"`
	TokenType   string     `json:"token_type"`
	ExpiresAt   time.Time  `json:"expires_at"`
	User        PublicUser `json:"user"`
}

func RegisterRoutes(router *gin.RouterGroup, service *Service, webOrigin string, secureCookies bool, googleOAuth *GoogleOAuth) {
	handler := &HTTPHandler{service: service, webOrigin: strings.TrimRight(webOrigin, "/"), secureCookies: secureCookies, loginAttempts: newAttemptLimiter(5, time.Minute), google: googleOAuth}
	router.POST("/register", handler.requireOrigin, handler.register)
	router.POST("/login", handler.requireOrigin, handler.login)
	router.POST("/refresh", handler.requireOrigin, handler.refresh)
	router.POST("/logout", handler.requireOrigin, handler.logout)
	router.GET("/me", handler.authenticate, handler.me)
	router.GET("/google/start", handler.googleStart)
	router.GET("/google/callback", handler.googleCallback)
}

func (handler *HTTPHandler) register(c *gin.Context) {
	var request credentialsRequest
	if err := bindJSON(c, &request); err != nil {
		writeError(c, http.StatusBadRequest, "validation_failed", "Request validation failed")
		return
	}
	session, err := handler.service.Register(c.Request.Context(), request.Identifier, request.Password)
	if errors.Is(err, ErrConflict) {
		writeError(c, http.StatusConflict, "account_exists", "Account already exists")
		return
	}
	if err != nil {
		if strings.Contains(err.Error(), "must be between") {
			writeError(c, http.StatusUnprocessableEntity, "validation_failed", err.Error())
			return
		}
		writeError(c, http.StatusInternalServerError, "internal_error", "The request could not be completed")
		return
	}
	handler.writeSession(c, http.StatusCreated, session)
}

func (handler *HTTPHandler) login(c *gin.Context) {
	var request credentialsRequest
	if err := bindJSON(c, &request); err != nil {
		writeError(c, http.StatusBadRequest, "validation_failed", "Request validation failed")
		return
	}
	loginKey := normalizeIdentifier(request.Identifier)
	if !handler.loginAttempts.Allow(loginKey, time.Now()) {
		writeError(c, http.StatusTooManyRequests, "rate_limited", "Too many login attempts; try again later")
		return
	}
	session, err := handler.service.Login(c.Request.Context(), request.Identifier, request.Password)
	if errors.Is(err, ErrInvalidLogin) {
		writeError(c, http.StatusUnauthorized, "invalid_credentials", "Invalid identifier or password")
		return
	}
	if err != nil {
		writeError(c, http.StatusInternalServerError, "internal_error", "The request could not be completed")
		return
	}
	handler.loginAttempts.Reset(loginKey)
	handler.writeSession(c, http.StatusOK, session)
}

func (handler *HTTPHandler) refresh(c *gin.Context) {
	token, err := c.Cookie(refreshCookie)
	if err != nil {
		writeError(c, http.StatusUnauthorized, "invalid_session", "Authentication required")
		return
	}
	session, err := handler.service.Refresh(c.Request.Context(), token)
	if err != nil {
		handler.clearRefresh(c)
		writeError(c, http.StatusUnauthorized, "invalid_session", "Authentication required")
		return
	}
	handler.writeSession(c, http.StatusOK, session)
}

func (handler *HTTPHandler) logout(c *gin.Context) {
	token, _ := c.Cookie(refreshCookie)
	if err := handler.service.Logout(c.Request.Context(), token); err != nil {
		writeError(c, http.StatusInternalServerError, "internal_error", "The request could not be completed")
		return
	}
	handler.clearRefresh(c)
	c.Status(http.StatusNoContent)
}

func (handler *HTTPHandler) me(c *gin.Context) {
	principal := PrincipalFrom(c)
	user, err := handler.service.User(c.Request.Context(), principal.ID)
	if err != nil {
		writeError(c, http.StatusUnauthorized, "invalid_session", "Authentication required")
		return
	}
	c.JSON(http.StatusOK, gin.H{"user": publicUser(user)})
}

func (handler *HTTPHandler) writeSession(c *gin.Context, status int, session Session) {
	handler.setRefresh(c, session)
	c.JSON(status, sessionResponse{AccessToken: session.AccessToken, TokenType: "Bearer", ExpiresAt: session.AccessExpiry, User: publicUser(session.User)})
}

func (handler *HTTPHandler) setRefresh(c *gin.Context, session Session) {
	http.SetCookie(c.Writer, &http.Cookie{Name: refreshCookie, Value: session.RefreshToken, Path: "/", MaxAge: int(handler.service.tokens.refreshTTL.Seconds()), HttpOnly: true, Secure: handler.secureCookies, SameSite: http.SameSiteStrictMode})
}

func (handler *HTTPHandler) clearRefresh(c *gin.Context) {
	http.SetCookie(c.Writer, &http.Cookie{Name: refreshCookie, Value: "", Path: "/", MaxAge: -1, Expires: time.Unix(1, 0), HttpOnly: true, Secure: handler.secureCookies, SameSite: http.SameSiteStrictMode})
}

func (handler *HTTPHandler) requireOrigin(c *gin.Context) {
	if handler.webOrigin == "" || c.GetHeader("Origin") != handler.webOrigin {
		writeError(c, http.StatusForbidden, "origin_not_allowed", "Request origin is not allowed")
		c.Abort()
		return
	}
	c.Next()
}

func (handler *HTTPHandler) googleStart(c *gin.Context) {
	c.Header("Cache-Control", "no-store")
	if handler.google == nil {
		writeError(c, http.StatusServiceUnavailable, "google_oauth_unavailable", "Google sign-in is not configured")
		return
	}
	state, stateErr := randomToken(32)
	verifier, verifierErr := randomToken(32)
	nonce, nonceErr := randomToken(32)
	if stateErr != nil || verifierErr != nil || nonceErr != nil {
		writeError(c, http.StatusInternalServerError, "internal_error", "The request could not be completed")
		return
	}
	handler.setOAuthCookie(c, googleStateCookie, state)
	handler.setOAuthCookie(c, googleVerifierCookie, verifier)
	handler.setOAuthCookie(c, googleNonceCookie, nonce)
	c.Redirect(http.StatusFound, handler.google.AuthorizationURL(state, verifier, nonce))
}

func (handler *HTTPHandler) googleCallback(c *gin.Context) {
	c.Header("Cache-Control", "no-store")
	stateCookie, stateErr := c.Cookie(googleStateCookie)
	verifier, verifierErr := c.Cookie(googleVerifierCookie)
	nonce, nonceErr := c.Cookie(googleNonceCookie)
	handler.clearOAuthCookies(c)
	if handler.google == nil || stateErr != nil || verifierErr != nil || nonceErr != nil ||
		c.Query("error") != "" || c.Query("code") == "" || !constantTimeEqual(stateCookie, c.Query("state")) {
		handler.redirectGoogleResult(c, false)
		return
	}
	identity, err := handler.google.Exchange(c.Request.Context(), c.Query("code"), verifier, nonce)
	if err != nil {
		handler.redirectGoogleResult(c, false)
		return
	}
	session, err := handler.service.LoginGoogle(c.Request.Context(), identity.Subject, identity.Email)
	if err != nil {
		handler.redirectGoogleResult(c, false)
		return
	}
	handler.setRefresh(c, session)
	handler.redirectGoogleResult(c, true)
}

func (handler *HTTPHandler) setOAuthCookie(c *gin.Context, name, value string) {
	http.SetCookie(c.Writer, &http.Cookie{Name: name, Value: value, Path: "/", MaxAge: 600, HttpOnly: true, Secure: handler.secureCookies, SameSite: http.SameSiteLaxMode})
}

func (handler *HTTPHandler) clearOAuthCookies(c *gin.Context) {
	for _, name := range []string{googleStateCookie, googleVerifierCookie, googleNonceCookie} {
		http.SetCookie(c.Writer, &http.Cookie{Name: name, Value: "", Path: "/", MaxAge: -1, Expires: time.Unix(1, 0), HttpOnly: true, Secure: handler.secureCookies, SameSite: http.SameSiteLaxMode})
	}
}

func (handler *HTTPHandler) redirectGoogleResult(c *gin.Context, success bool) {
	destination := handler.webOrigin + "/auth/callback"
	if !success {
		destination += "?error=google_sign_in_failed"
	}
	c.Redirect(http.StatusSeeOther, destination)
}

func (handler *HTTPHandler) authenticate(c *gin.Context) {
	header := c.GetHeader("Authorization")
	if !strings.HasPrefix(header, "Bearer ") {
		writeError(c, http.StatusUnauthorized, "authentication_required", "Authentication required")
		c.Abort()
		return
	}
	principal, err := handler.service.Authenticate(strings.TrimSpace(strings.TrimPrefix(header, "Bearer ")))
	if err != nil {
		writeError(c, http.StatusUnauthorized, "authentication_required", "Authentication required")
		c.Abort()
		return
	}
	c.Set(principalKey, principal)
	c.Next()
}

const principalKey = "authenticated-principal"

func PrincipalFrom(c *gin.Context) User {
	principal, _ := c.Get(principalKey)
	user, _ := principal.(User)
	return user
}

func RequireRoles(service *Service, roles ...Role) gin.HandlerFunc {
	allowed := make(map[Role]struct{}, len(roles))
	for _, role := range roles {
		allowed[role] = struct{}{}
	}
	handler := &HTTPHandler{service: service}
	return func(c *gin.Context) {
		handler.authenticate(c)
		if c.IsAborted() {
			return
		}
		if _, ok := allowed[PrincipalFrom(c).Role]; !ok {
			writeError(c, http.StatusForbidden, "forbidden", "You are not allowed to perform this action")
			c.Abort()
			return
		}
	}
}

func writeError(c *gin.Context, status int, code, message string) {
	c.JSON(status, gin.H{"error": gin.H{"code": code, "message": message}})
}

func bindJSON(c *gin.Context, destination any) error {
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, 16<<10)
	return c.ShouldBindJSON(destination)
}
