package matching

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestAIClientAuthenticatesAndDecodesEmbeddings(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		if request.Header.Get("X-LostLink-Service-Token") != "internal-test-token-value" {
			http.Error(writer, "unauthorized", http.StatusUnauthorized)
			return
		}
		writer.Header().Set("Content-Type", "application/json")
		_, _ = writer.Write([]byte(`{"model_version":"test-model","config_version":"test-config","items":[{"id":"report-1","vector":[1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]}]}`))
	}))
	defer server.Close()

	result, err := NewAIClient(server.URL, "internal-test-token-value").Embed(
		context.Background(), []EmbeddingInput{{ID: "report-1", Text: "public-safe text"}},
	)
	if err != nil {
		t.Fatal(err)
	}
	if result.ModelVersion != "test-model" || len(result.Items) != 1 || len(result.Items[0].Vector) != 32 {
		t.Fatalf("result = %#v", result)
	}
}

func TestAIClientMapsInternalFailureToUnavailable(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, _ *http.Request) {
		writer.WriteHeader(http.StatusServiceUnavailable)
	}))
	defer server.Close()

	_, err := NewAIClient(server.URL, "internal-test-token-value").Embed(
		context.Background(), []EmbeddingInput{{ID: "report-1", Text: "public-safe text"}},
	)
	if !errors.Is(err, ErrAIUnavailable) {
		t.Fatalf("error = %v", err)
	}
}
