package server

import (
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestHealth(t *testing.T) {
	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodGet, "/health", nil)
	New(slog.New(slog.NewTextHandler(io.Discard, nil))).ServeHTTP(recorder, request)

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d; want %d", recorder.Code, http.StatusOK)
	}

	var response HealthResponse
	if err := json.Unmarshal(recorder.Body.Bytes(), &response); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if response.Status != "ok" || response.Service != "api" {
		t.Fatalf("response = %#v; want API health response", response)
	}
}

func TestLegacySwaggerUIRedirectsToDocs(t *testing.T) {
	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodGet, "/swagger/index.html", nil)
	New(slog.New(slog.NewTextHandler(io.Discard, nil))).ServeHTTP(recorder, request)

	if recorder.Code != http.StatusTemporaryRedirect {
		t.Fatalf("status = %d; want %d", recorder.Code, http.StatusTemporaryRedirect)
	}
	if location := recorder.Header().Get("Location"); location != "/docs" {
		t.Fatalf("Location = %q; want /docs", location)
	}
}

func TestScalarDocsRouteExists(t *testing.T) {
	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodGet, "/docs", nil)
	New(slog.New(slog.NewTextHandler(io.Discard, nil))).ServeHTTP(recorder, request)

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d; want %d", recorder.Code, http.StatusOK)
	}
	for _, expected := range []string{"LostLink API Reference", "@scalar/api-reference@1.63.0", "docs/swagger.yaml"} {
		if !strings.Contains(recorder.Body.String(), expected) {
			t.Fatalf("Scalar documentation page does not contain %q", expected)
		}
	}
}

func TestOpenAPIDocumentRouteExists(t *testing.T) {
	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodGet, "/docs/swagger.yaml", nil)
	New(slog.New(slog.NewTextHandler(io.Discard, nil))).ServeHTTP(recorder, request)

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d; want %d", recorder.Code, http.StatusOK)
	}
	if contentType := recorder.Header().Get("Content-Type"); !strings.Contains(contentType, "application/yaml") {
		t.Fatalf("Content-Type = %q; want application/yaml", contentType)
	}
	for _, expected := range []string{"openapi: 3.1.0", "    ## Introduction", "  /health:", "    HealthResponse:"} {
		if !strings.Contains(recorder.Body.String(), expected) {
			t.Fatalf("OpenAPI document does not contain %q", expected)
		}
	}
}
