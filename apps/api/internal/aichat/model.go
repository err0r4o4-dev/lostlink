package aichat

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type Session struct {
	ID        uuid.UUID `json:"id"`
	UserID    uuid.UUID `json:"user_id"`
	Title     string    `json:"title"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type Message struct {
	ID           uuid.UUID       `json:"id"`
	SessionID    uuid.UUID       `json:"session_id"`
	Role         string          `json:"role"`
	Content      string          `json:"content"`
	AnalysisData json.RawMessage `json:"analysis_data,omitempty"`
	CreatedAt    time.Time       `json:"created_at"`
}

// ChatRequest matches the Python API schema
type ChatRequest struct {
	SessionID *string       `json:"session_id,omitempty"`
	Messages  []ChatMessage `json:"messages"`
}

type ChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// ChatResponse matches the Python API schema
type ChatResponse struct {
	Reply          string          `json:"reply"`
	GeneratedTitle *string         `json:"generated_title,omitempty"`
	Analysis       json.RawMessage `json:"analysis,omitempty"`
}

type ChatAnalysis struct {
	ExtractedKeywords []string `json:"extracted_keywords"`
	Reasoning         *string  `json:"reasoning,omitempty"`
	MatchedItemIDs    []string `json:"matched_item_ids"`
	ConfidenceScore   *float64 `json:"confidence_score,omitempty"`
}
