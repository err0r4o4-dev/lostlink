package server

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestHealth(t *testing.T) {
	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodGet, "/health", nil)
	New(io.Discard).ServeHTTP(recorder, request)

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
	New(io.Discard).ServeHTTP(recorder, request)

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
	New(io.Discard).ServeHTTP(recorder, request)

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
	New(io.Discard).ServeHTTP(recorder, request)

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

func TestReadableRequestLogOmitsQueryValues(t *testing.T) {
	var logs bytes.Buffer
	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodGet, "/docs?status=ALL&private=evidence", nil)
	request.RemoteAddr = "172.18.0.1:12345"
	New(&logs).ServeHTTP(recorder, request)

	output := logs.String()
	for _, expected := range []string{"[GIN] ", "| 200 |", "172.18.0.1", "GET", `"/docs"`} {
		if !strings.Contains(output, expected) {
			t.Fatalf("request log %q does not contain %q", output, expected)
		}
	}
	for _, privateValue := range []string{"status=ALL", "private=evidence"} {
		if strings.Contains(output, privateValue) {
			t.Fatalf("request log contains query value %q", privateValue)
		}
	}
}
