package matching

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestAIClientAuthenticatesAndDecodesEmbeddings(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		if request.Method != http.MethodPost || request.URL.Path != "/internal/v1/embeddings" {
			t.Errorf("request = %s %s", request.Method, request.URL.Path)
		}
		if request.Header.Get("X-LostLink-Service-Token") != "internal-test-token-value" {
			http.Error(writer, "unauthorized", http.StatusUnauthorized)
			return
		}
		var body struct {
			Items []EmbeddingInput `json:"items"`
		}
		if err := json.NewDecoder(request.Body).Decode(&body); err != nil {
			t.Errorf("decode request: %v", err)
			http.Error(writer, "bad request", http.StatusBadRequest)
			return
		}
		if len(body.Items) != 1 || body.Items[0].ID != "report-1" || body.Items[0].Text != "public-safe text" {
			t.Errorf("request body = %#v", body)
		}

		vector := make([]float64, embeddingDimensions)
		vector[0] = 1
		writer.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(writer).Encode(EmbeddingResult{
			ModelVersion:  "test-model",
			ConfigVersion: "test-config",
			Items:         []Embedding{{ID: "report-1", Vector: vector}},
		}); err != nil {
			t.Errorf("encode response: %v", err)
		}
	}))
	defer server.Close()

	result, err := NewAIClient(server.URL, "internal-test-token-value").Embed(
		context.Background(), []EmbeddingInput{{ID: "report-1", Text: "public-safe text"}},
	)
	if err != nil {
		t.Fatal(err)
	}
	if result.ModelVersion != "test-model" || len(result.Items) != 1 || len(result.Items[0].Vector) != embeddingDimensions {
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
