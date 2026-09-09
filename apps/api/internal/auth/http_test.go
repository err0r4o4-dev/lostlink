package auth

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

func testAuthRouter(service *Service) http.Handler {
	return testAuthRouterWithGoogle(service, nil)
}

func testAuthRouterWithGoogle(service *Service, googleOAuth *GoogleOAuth) http.Handler {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	RegisterRoutes(router.Group("/v1/auth"), service, "http://localhost:8088", false, googleOAuth)
	return router
}

func authRequest(t *testing.T, router http.Handler, method, path, body, origin string, cookies ...*http.Cookie) *httptest.ResponseRecorder {
	t.Helper()
	request := httptest.NewRequest(method, path, strings.NewReader(body))
	request.Header.Set("Content-Type", "application/json")
	if origin != "" {
		request.Header.Set("Origin", origin)
	}
	for _, cookie := range cookies {
		request.AddCookie(cookie)
	}
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, request)
	return recorder
}

func TestAuthHTTPFlow(t *testing.T) {
	service := newTestService(new(memoryStore))
	router := testAuthRouter(service)
	body := `{"identifier":"student@example.edu","password":"a sufficiently long password"}`

	register := authRequest(t, router, http.MethodPost, "/v1/auth/register", body, "http://localhost:8088")
	if register.Code != http.StatusCreated {
		t.Fatalf("register status = %d, body = %s", register.Code, register.Body.String())
	}
	cookies := register.Result().Cookies()
	if len(cookies) != 1 || !cookies[0].HttpOnly || cookies[0].SameSite != http.SameSiteStrictMode {
		t.Fatalf("refresh cookie = %#v", cookies)
	}
	var session sessionResponse
	if err := json.Unmarshal(register.Body.Bytes(), &session); err != nil {
		t.Fatal(err)
	}
	if session.AccessToken == "" || bytes.Contains(register.Body.Bytes(), []byte("password")) {
		t.Fatal("unsafe or incomplete session response")
	}

	meRequest := httptest.NewRequest(http.MethodGet, "/v1/auth/me", nil)
	meRequest.Header.Set("Authorization", "Bearer "+session.AccessToken)
	me := httptest.NewRecorder()
	router.ServeHTTP(me, meRequest)
	if me.Code != http.StatusOK {
		t.Fatalf("me status = %d, body = %s", me.Code, me.Body.String())
	}

	refresh := authRequest(t, router, http.MethodPost, "/v1/auth/refresh", "", "http://localhost:8088", cookies[0])
	if refresh.Code != http.StatusOK {
		t.Fatalf("refresh status = %d, body = %s", refresh.Code, refresh.Body.String())
	}
}

func TestAuthRejectsUntrustedOriginAndMissingBearer(t *testing.T) {
	service := newTestService(new(memoryStore))
	router := testAuthRouter(service)
	body := `{"identifier":"student@example.edu","password":"a sufficiently long password"}`

	untrusted := authRequest(t, router, http.MethodPost, "/v1/auth/register", body, "https://evil.example")
	if untrusted.Code != http.StatusForbidden {
		t.Fatalf("untrusted origin status = %d", untrusted.Code)
	}
	if bytes.Contains(untrusted.Body.Bytes(), []byte("evil.example")) {
		t.Fatal("error reflected untrusted origin")
	}

	request := httptest.NewRequest(http.MethodGet, "/v1/auth/me", nil)
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, request)
	if recorder.Code != http.StatusUnauthorized {
		t.Fatalf("missing bearer status = %d", recorder.Code)
	}
	if _, err := io.ReadAll(recorder.Result().Body); err != nil {
		t.Fatal(err)
	}
}

func TestAuthLimitsLoginAttemptsAndRequestSize(t *testing.T) {
	service := newTestService(new(memoryStore))
	router := testAuthRouter(service)
	body := `{"identifier":"missing@example.edu","password":"a sufficiently long password"}`

	for attempt := 1; attempt <= 5; attempt++ {
		response := authRequest(t, router, http.MethodPost, "/v1/auth/login", body, "http://localhost:8088")
		if response.Code != http.StatusUnauthorized {
			t.Fatalf("attempt %d status = %d; want 401", attempt, response.Code)
		}
	}
	limited := authRequest(t, router, http.MethodPost, "/v1/auth/login", body, "http://localhost:8088")
	if limited.Code != http.StatusTooManyRequests {
		t.Fatalf("limited status = %d; want 429", limited.Code)
	}

	oversized := `{"identifier":"student@example.edu","password":"` + strings.Repeat("x", 17<<10) + `"}`
	response := authRequest(t, router, http.MethodPost, "/v1/auth/register", oversized, "http://localhost:8088")
	if response.Code != http.StatusBadRequest {
		t.Fatalf("oversized status = %d; want 400", response.Code)
	}
}

func TestGoogleStartIsUnavailableWithoutConfiguration(t *testing.T) {
	response := authRequest(t, testAuthRouter(newTestService(new(memoryStore))), http.MethodGet, "/v1/auth/google/start", "", "")
	if response.Code != http.StatusServiceUnavailable {
		t.Fatalf("Google start status = %d; want 503", response.Code)
	}
	if !strings.Contains(response.Body.String(), "google_oauth_unavailable") {
		t.Fatalf("Google start body = %s", response.Body.String())
	}
}
