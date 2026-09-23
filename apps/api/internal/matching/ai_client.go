package matching

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

type Embedder interface {
	Embed(context.Context, []EmbeddingInput) (EmbeddingResult, error)
}

type AIClient struct {
	baseURL string
	token   string
	client  *http.Client
}

func NewAIClient(baseURL, token string) *AIClient {
	return &AIClient{
		baseURL: strings.TrimRight(baseURL, "/"),
		token:   token,
		client:  &http.Client{Timeout: 5 * time.Second},
	}
}

func (client *AIClient) Embed(ctx context.Context, items []EmbeddingInput) (EmbeddingResult, error) {
	body, err := json.Marshal(struct {
		Items []EmbeddingInput `json:"items"`
	}{Items: items})
	if err != nil {
		return EmbeddingResult{}, fmt.Errorf("encode embedding request: %w", err)
	}
	request, err := http.NewRequestWithContext(ctx, http.MethodPost, client.baseURL+"/internal/v1/embeddings", bytes.NewReader(body))
	if err != nil {
		return EmbeddingResult{}, fmt.Errorf("create embedding request: %w", err)
	}
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("X-LostLink-Service-Token", client.token)
	response, err := client.client.Do(request)
	if err != nil {
		return EmbeddingResult{}, ErrAIUnavailable
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		_, _ = io.Copy(io.Discard, io.LimitReader(response.Body, 4096))
		return EmbeddingResult{}, ErrAIUnavailable
	}
	var result EmbeddingResult
	decoder := json.NewDecoder(io.LimitReader(response.Body, 1<<20))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&result); err != nil {
		return EmbeddingResult{}, ErrAIUnavailable
	}
	return result, nil
}
