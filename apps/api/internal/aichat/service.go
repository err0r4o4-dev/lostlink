package aichat

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
)

var (
	ErrSessionNotFound = errors.New("chat session not found")
	ErrUnauthorized    = errors.New("unauthorized access to chat session")
)

type Service struct {
	repo     *Repository
	aiClient *AIClient
}

func NewService(repo *Repository, aiClient *AIClient) *Service {
	return &Service{
		repo:     repo,
		aiClient: aiClient,
	}
}

func (s *Service) CreateSession(ctx context.Context, userID uuid.UUID, initialMessage string) (*Session, *Message, *Message, error) {
	now := time.Now()
	sessionID := uuid.New()

	// Create a placeholder session first
	session := &Session{
		ID:        sessionID,
		UserID:    userID,
		Title:     "New Chat",
		CreatedAt: now,
		UpdatedAt: now,
	}
	if err := s.repo.CreateSession(ctx, session); err != nil {
		return nil, nil, nil, fmt.Errorf("create session: %w", err)
	}

	return s.SendMessage(ctx, sessionID, userID, initialMessage)
}

func (s *Service) SendMessage(ctx context.Context, sessionID uuid.UUID, userID uuid.UUID, content string) (*Session, *Message, *Message, error) {
	session, err := s.repo.GetSession(ctx, sessionID)
	if err != nil {
		return nil, nil, nil, ErrSessionNotFound
	}
	if session.UserID != userID {
		return nil, nil, nil, ErrUnauthorized
	}

	now := time.Now()
	userMessage := &Message{
		ID:        uuid.New(),
		SessionID: sessionID,
		Role:      "user",
		Content:   content,
		CreatedAt: now,
	}

	if err := s.repo.CreateMessage(ctx, userMessage); err != nil {
		return nil, nil, nil, fmt.Errorf("create user message: %w", err)
	}

	// Fetch history to send to AI
	history, err := s.repo.GetMessages(ctx, sessionID)
	if err != nil {
		return nil, nil, nil, fmt.Errorf("fetch history: %w", err)
	}

	var chatMsgs []ChatMessage
	for _, m := range history {
		chatMsgs = append(chatMsgs, ChatMessage{
			Role:    m.Role,
			Content: m.Content,
		})
	}

	sessionIDStr := sessionID.String()
	aiResp, err := s.aiClient.GenerateChat(ctx, ChatRequest{
		SessionID: &sessionIDStr,
		Messages:  chatMsgs,
	})

	if err != nil {
		return nil, nil, nil, fmt.Errorf("generate chat: %w", err)
	}

	// Process response
	if aiResp.GeneratedTitle != nil && *aiResp.GeneratedTitle != "" {
		if err := s.repo.UpdateSessionTitle(ctx, sessionID, *aiResp.GeneratedTitle); err != nil {
			// Log error but continue
			fmt.Printf("failed to update session title: %v\n", err)
		}
		session.Title = *aiResp.GeneratedTitle
	}

	var analysisData json.RawMessage
	if aiResp.Analysis != nil {
		analysisData = aiResp.Analysis
	}

	aiMessage := &Message{
		ID:           uuid.New(),
		SessionID:    sessionID,
		Role:         "ai",
		Content:      aiResp.Reply,
		AnalysisData: analysisData,
		CreatedAt:    time.Now(),
	}

	if err := s.repo.CreateMessage(ctx, aiMessage); err != nil {
		return nil, nil, nil, fmt.Errorf("create ai message: %w", err)
	}

	return session, userMessage, aiMessage, nil
}

func (s *Service) DeleteSession(ctx context.Context, sessionID uuid.UUID, userID uuid.UUID) error {
	session, err := s.repo.GetSession(ctx, sessionID)
	if err != nil {
		return ErrSessionNotFound
	}
	if session.UserID != userID {
		return ErrUnauthorized
	}
	return s.repo.DeleteSession(ctx, sessionID)
}

func (s *Service) RewindSession(ctx context.Context, sessionID uuid.UUID, userID uuid.UUID, messageID uuid.UUID) error {
	session, err := s.repo.GetSession(ctx, sessionID)
	if err != nil {
		return ErrSessionNotFound
	}
	if session.UserID != userID {
		return ErrUnauthorized
	}

	msg, err := s.repo.GetMessage(ctx, messageID)
	if err != nil {
		return err
	}
	if msg.SessionID != sessionID {
		return ErrUnauthorized
	}

	return s.repo.DeleteMessagesFrom(ctx, sessionID, msg.CreatedAt)
}

func (s *Service) ListSessions(ctx context.Context, userID uuid.UUID) ([]Session, error) {
	return s.repo.ListSessions(ctx, userID)
}

func (s *Service) GetMessages(ctx context.Context, sessionID uuid.UUID, userID uuid.UUID) ([]Message, error) {
	session, err := s.repo.GetSession(ctx, sessionID)
	if err != nil {
		return nil, ErrSessionNotFound
	}
	if session.UserID != userID {
		return nil, ErrUnauthorized
	}
	return s.repo.GetMessages(ctx, sessionID)
}
