package aichat

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/google/uuid"
)

const maxChatMessageRunes = 4000

var (
	ErrSessionNotFound = errors.New("chat session not found")
	ErrMessageNotFound = errors.New("chat message not found")
	ErrUnauthorized    = errors.New("unauthorized access to chat session")
	ErrInvalidMessage  = errors.New("invalid chat message")
	ErrTurnConflict    = errors.New("chat turn id conflicts with an existing turn")
	ErrHistoryChanged  = errors.New("chat history changed during generation")
)

type chatStore interface {
	ListSessions(context.Context, uuid.UUID) ([]Session, error)
	DeleteSession(context.Context, uuid.UUID) error
	GetSession(context.Context, uuid.UUID) (*Session, error)
	GetMessage(context.Context, uuid.UUID) (*Message, error)
	GetMessages(context.Context, uuid.UUID) ([]Message, error)
	CreateSessionTurn(context.Context, Session, Message, Message) error
	AppendTurn(context.Context, uuid.UUID, uuid.UUID, time.Time, string, time.Time, Message, Message) error
	ReplaceTurn(context.Context, uuid.UUID, uuid.UUID, uuid.UUID, time.Time, string, time.Time, Message, Message) error
}

type chatGenerator interface {
	GenerateChat(context.Context, ChatRequest) (*ChatResponse, error)
}

type Service struct {
	repo     chatStore
	aiClient chatGenerator
}

func NewService(repo chatStore, aiClient chatGenerator) *Service {
	return &Service{repo: repo, aiClient: aiClient}
}

func (s *Service) CreateSession(
	ctx context.Context,
	userID, clientTurnID uuid.UUID,
	initialMessage string,
) (*Session, *Message, *Message, error) {
	if err := validateMessage(initialMessage); err != nil {
		return nil, nil, nil, err
	}

	sessionID := uuid.NewSHA1(clientTurnID, []byte("session"))
	if session, userMessage, aiMessage, found, err := s.committedTurn(
		ctx, userID, sessionID, clientTurnID, initialMessage,
	); err != nil || found {
		return session, userMessage, aiMessage, err
	}

	aiResponse, err := s.generate(ctx, sessionID, []ChatMessage{{Role: "user", Content: initialMessage}})
	if err != nil {
		return nil, nil, nil, err
	}

	userMessage, aiMessage := buildTurn(sessionID, clientTurnID, initialMessage, aiResponse)
	title := "New Chat"
	if aiResponse.GeneratedTitle != nil && strings.TrimSpace(*aiResponse.GeneratedTitle) != "" {
		title = strings.TrimSpace(*aiResponse.GeneratedTitle)
	}
	session := Session{
		ID:        sessionID,
		UserID:    userID,
		Title:     title,
		CreatedAt: userMessage.CreatedAt,
		UpdatedAt: aiMessage.CreatedAt,
	}

	if err := s.repo.CreateSessionTurn(ctx, session, *userMessage, *aiMessage); err != nil {
		if committedSession, committedUser, committedAI, found, lookupErr := s.committedTurn(
			ctx, userID, sessionID, clientTurnID, initialMessage,
		); lookupErr == nil && found {
			return committedSession, committedUser, committedAI, nil
		}
		return nil, nil, nil, fmt.Errorf("commit initial chat turn: %w", err)
	}
	return &session, userMessage, aiMessage, nil
}

func (s *Service) SendMessage(
	ctx context.Context,
	sessionID, userID, clientTurnID uuid.UUID,
	content string,
) (*Session, *Message, *Message, error) {
	if err := validateMessage(content); err != nil {
		return nil, nil, nil, err
	}
	session, history, err := s.authorizedHistory(ctx, sessionID, userID)
	if err != nil {
		return nil, nil, nil, err
	}
	if session, userMessage, aiMessage, found, err := s.committedTurn(
		ctx, userID, sessionID, clientTurnID, content,
	); err != nil || found {
		return session, userMessage, aiMessage, err
	}
	chatHistory := toChatMessages(history)
	chatHistory = append(chatHistory, ChatMessage{Role: "user", Content: content})
	expectedUpdatedAt := session.UpdatedAt

	aiResponse, err := s.generate(ctx, sessionID, chatHistory)
	if err != nil {
		return nil, nil, nil, err
	}
	userMessage, aiMessage := buildTurn(sessionID, clientTurnID, content, aiResponse)
	title := generatedTitle(aiResponse)
	if title != "" {
		session.Title = title
	}
	session.UpdatedAt = aiMessage.CreatedAt

	if err := s.repo.AppendTurn(
		ctx, sessionID, userID, expectedUpdatedAt, title, session.UpdatedAt, *userMessage, *aiMessage,
	); err != nil {
		if committedSession, committedUser, committedAI, found, lookupErr := s.committedTurn(
			ctx, userID, sessionID, clientTurnID, content,
		); lookupErr == nil && found {
			return committedSession, committedUser, committedAI, nil
		}
		return nil, nil, nil, fmt.Errorf("commit chat turn: %w", err)
	}
	return session, userMessage, aiMessage, nil
}

func (s *Service) EditMessage(
	ctx context.Context,
	sessionID, userID, targetMessageID, clientTurnID uuid.UUID,
	content string,
) (*Session, *Message, *Message, error) {
	if err := validateMessage(content); err != nil {
		return nil, nil, nil, err
	}
	session, history, err := s.authorizedHistory(ctx, sessionID, userID)
	if err != nil {
		return nil, nil, nil, err
	}
	if session, userMessage, aiMessage, found, err := s.committedTurn(
		ctx, userID, sessionID, clientTurnID, content,
	); err != nil || found {
		return session, userMessage, aiMessage, err
	}
	targetIndex := -1
	for index := range history {
		if history[index].ID == targetMessageID {
			targetIndex = index
			break
		}
	}
	if targetIndex < 0 {
		return nil, nil, nil, ErrMessageNotFound
	}
	if history[targetIndex].Role != "user" {
		return nil, nil, nil, ErrInvalidMessage
	}

	chatHistory := toChatMessages(history[:targetIndex])
	chatHistory = append(chatHistory, ChatMessage{Role: "user", Content: content})
	expectedUpdatedAt := session.UpdatedAt
	aiResponse, err := s.generate(ctx, sessionID, chatHistory)
	if err != nil {
		return nil, nil, nil, err
	}
	userMessage, aiMessage := buildTurn(sessionID, clientTurnID, content, aiResponse)
	title := generatedTitle(aiResponse)
	if title != "" {
		session.Title = title
	}
	session.UpdatedAt = aiMessage.CreatedAt

	if err := s.repo.ReplaceTurn(
		ctx, sessionID, userID, targetMessageID, expectedUpdatedAt,
		title, session.UpdatedAt, *userMessage, *aiMessage,
	); err != nil {
		if committedSession, committedUser, committedAI, found, lookupErr := s.committedTurn(
			ctx, userID, sessionID, clientTurnID, content,
		); lookupErr == nil && found {
			return committedSession, committedUser, committedAI, nil
		}
		return nil, nil, nil, fmt.Errorf("commit edited chat turn: %w", err)
	}
	return session, userMessage, aiMessage, nil
}

func (s *Service) DeleteSession(ctx context.Context, sessionID uuid.UUID, userID uuid.UUID) error {
	session, err := s.repo.GetSession(ctx, sessionID)
	if err != nil {
		return err
	}
	if session.UserID != userID {
		return ErrUnauthorized
	}
	return s.repo.DeleteSession(ctx, sessionID)
}

func (s *Service) ListSessions(ctx context.Context, userID uuid.UUID) ([]Session, error) {
	return s.repo.ListSessions(ctx, userID)
}

func (s *Service) GetMessages(ctx context.Context, sessionID uuid.UUID, userID uuid.UUID) ([]Message, error) {
	_, history, err := s.authorizedHistory(ctx, sessionID, userID)
	return history, err
}

func (s *Service) authorizedHistory(
	ctx context.Context,
	sessionID, userID uuid.UUID,
) (*Session, []Message, error) {
	session, err := s.repo.GetSession(ctx, sessionID)
	if err != nil {
		return nil, nil, err
	}
	if session.UserID != userID {
		return nil, nil, ErrUnauthorized
	}
	history, err := s.repo.GetMessages(ctx, sessionID)
	if err != nil {
		return nil, nil, fmt.Errorf("fetch chat history: %w", err)
	}
	return session, history, nil
}

func (s *Service) committedTurn(
	ctx context.Context,
	userID, expectedSessionID, clientTurnID uuid.UUID,
	content string,
) (*Session, *Message, *Message, bool, error) {
	userMessage, err := s.repo.GetMessage(ctx, clientTurnID)
	if errors.Is(err, ErrMessageNotFound) {
		return nil, nil, nil, false, nil
	}
	if err != nil {
		return nil, nil, nil, false, fmt.Errorf("read committed chat turn: %w", err)
	}
	if userMessage.SessionID != expectedSessionID || userMessage.Role != "user" || userMessage.Content != content {
		return nil, nil, nil, false, ErrTurnConflict
	}

	session, err := s.repo.GetSession(ctx, userMessage.SessionID)
	if err != nil {
		return nil, nil, nil, false, ErrTurnConflict
	}
	if session.UserID != userID {
		return nil, nil, nil, false, ErrTurnConflict
	}

	aiMessage, err := s.repo.GetMessage(ctx, assistantMessageID(clientTurnID))
	if err != nil || aiMessage.SessionID != expectedSessionID || aiMessage.Role != "ai" {
		return nil, nil, nil, false, ErrTurnConflict
	}
	return session, userMessage, aiMessage, true, nil
}

func (s *Service) generate(ctx context.Context, sessionID uuid.UUID, history []ChatMessage) (*ChatResponse, error) {
	sessionIDValue := sessionID.String()
	response, err := s.aiClient.GenerateChat(ctx, ChatRequest{SessionID: &sessionIDValue, Messages: history})
	if err != nil {
		if ctxErr := ctx.Err(); ctxErr != nil {
			return nil, ctxErr
		}
		return nil, fmt.Errorf("%w: generate chat", ErrAIUnavailable)
	}
	if response == nil || strings.TrimSpace(response.Reply) == "" {
		return nil, fmt.Errorf("%w: empty reply", ErrAIUnavailable)
	}
	return response, nil
}

func buildTurn(
	sessionID, clientTurnID uuid.UUID,
	content string,
	response *ChatResponse,
) (*Message, *Message) {
	userCreatedAt := time.Now().UTC()
	userMessage := &Message{
		ID:        clientTurnID,
		SessionID: sessionID,
		Role:      "user",
		Content:   content,
		CreatedAt: userCreatedAt,
	}

	var analysisData json.RawMessage
	if response.Analysis != nil {
		analysisData = append(json.RawMessage(nil), response.Analysis...)
	}
	aiMessage := &Message{
		ID:           assistantMessageID(clientTurnID),
		SessionID:    sessionID,
		Role:         "ai",
		Content:      response.Reply,
		AnalysisData: analysisData,
		CreatedAt:    userCreatedAt.Add(time.Microsecond),
	}
	return userMessage, aiMessage
}

func assistantMessageID(clientTurnID uuid.UUID) uuid.UUID {
	return uuid.NewSHA1(clientTurnID, []byte("assistant"))
}

func toChatMessages(messages []Message) []ChatMessage {
	result := make([]ChatMessage, 0, len(messages))
	for _, message := range messages {
		result = append(result, ChatMessage{Role: message.Role, Content: message.Content})
	}
	return result
}

func generatedTitle(response *ChatResponse) string {
	if response.GeneratedTitle == nil {
		return ""
	}
	return strings.TrimSpace(*response.GeneratedTitle)
}

func validateMessage(content string) error {
	if strings.TrimSpace(content) == "" || utf8.RuneCountInString(content) > maxChatMessageRunes {
		return ErrInvalidMessage
	}
	return nil
}
