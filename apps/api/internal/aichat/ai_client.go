package aichat

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

var ErrAIUnavailable = errors.New("ai service is currently unavailable")

type AIClient struct {
	baseURL string
	token   string
	client  *http.Client
}

func NewAIClient(baseURL, token string) *AIClient {
	return &AIClient{
		baseURL: strings.TrimRight(baseURL, "/"),
		token:   token,
		client:  &http.Client{Timeout: 15 * time.Second}, // Chat generation can take longer
	}
}

func (client *AIClient) GenerateChat(ctx context.Context, request ChatRequest) (*ChatResponse, error) {
	body, err := json.Marshal(request)
	if err != nil {
		return nil, fmt.Errorf("encode chat request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, client.baseURL+"/chat/generate", bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("create chat request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	// If the AI Service is set up to require a service token
	if client.token != "" {
		req.Header.Set("X-LostLink-Service-Token", client.token)
	}

	response, err := client.client.Do(req)
	if err != nil {
		if ctxErr := ctx.Err(); ctxErr != nil {
			return nil, ctxErr
		}
		return nil, fmt.Errorf("%w: request failed", ErrAIUnavailable)
	}
	defer response.Body.Close()

	if response.StatusCode != http.StatusOK {
		b, _ := io.ReadAll(io.LimitReader(response.Body, 4096))
		return nil, fmt.Errorf("%w: status %d, %s", ErrAIUnavailable, response.StatusCode, string(b))
	}

	var result ChatResponse
	decoder := json.NewDecoder(io.LimitReader(response.Body, 1<<20))
	if err := decoder.Decode(&result); err != nil {
		return nil, fmt.Errorf("%w: decode chat response", ErrAIUnavailable)
	}

	return &result, nil
}
