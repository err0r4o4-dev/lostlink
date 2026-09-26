package aichat

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestAIClientAuthenticatesAndDecodesChat(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		if request.Method != http.MethodPost || request.URL.Path != "/chat/generate" {
			t.Errorf("request = %s %s", request.Method, request.URL.Path)
		}
		if request.Header.Get("X-LostLink-Service-Token") != "internal-test-token-value" {
			http.Error(writer, "unauthorized", http.StatusUnauthorized)
			return
		}
		var body ChatRequest
		if err := json.NewDecoder(request.Body).Decode(&body); err != nil {
			t.Errorf("decode request: %v", err)
			http.Error(writer, "bad request", http.StatusBadRequest)
			return
		}
		if len(body.Messages) != 1 || body.Messages[0].Content != "Find my wallet" {
			t.Errorf("request body = %#v", body)
		}

		writer.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(writer).Encode(ChatResponse{Reply: "Please add a location."}); err != nil {
			t.Errorf("encode response: %v", err)
		}
	}))
	defer server.Close()

	result, err := NewAIClient(server.URL, "internal-test-token-value").GenerateChat(
		context.Background(),
		ChatRequest{Messages: []ChatMessage{{Role: "user", Content: "Find my wallet"}}},
	)
	if err != nil {
		t.Fatal(err)
	}
	if result.Reply != "Please add a location." {
		t.Fatalf("result = %#v", result)
	}
}

func TestAIClientMapsFailureWithoutExposingResponseBody(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, _ *http.Request) {
		http.Error(writer, "private provider diagnostic", http.StatusServiceUnavailable)
	}))
	defer server.Close()

	_, err := NewAIClient(server.URL, "internal-test-token-value").GenerateChat(
		context.Background(),
		ChatRequest{Messages: []ChatMessage{{Role: "user", Content: "Find my wallet"}}},
	)
	if !errors.Is(err, ErrAIUnavailable) {
		t.Fatalf("error = %v; want ErrAIUnavailable", err)
	}
	if strings.Contains(err.Error(), "private provider diagnostic") {
		t.Fatalf("error exposed response body: %v", err)
	}
}
