package aichat

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/google/uuid"
)

type memoryChatStore struct {
	sessions     map[uuid.UUID]Session
	messages     map[uuid.UUID]Message
	history      map[uuid.UUID][]Message
	createCalls  int
	appendCalls  int
	replaceCalls int
	messageReads int
}

func newMemoryChatStore(session Session, messages []Message) *memoryChatStore {
	store := &memoryChatStore{
		sessions: map[uuid.UUID]Session{}, messages: map[uuid.UUID]Message{}, history: map[uuid.UUID][]Message{},
	}
	if session.ID != uuid.Nil {
		store.sessions[session.ID] = session
		store.history[session.ID] = append([]Message(nil), messages...)
	}
	for _, message := range messages {
		store.messages[message.ID] = message
	}
	return store
}

func (store *memoryChatStore) ListSessions(_ context.Context, userID uuid.UUID) ([]Session, error) {
	var sessions []Session
	for _, session := range store.sessions {
		if session.UserID == userID {
			sessions = append(sessions, session)
		}
	}
	return sessions, nil
}

func (store *memoryChatStore) DeleteSession(_ context.Context, sessionID uuid.UUID) error {
	delete(store.sessions, sessionID)
	delete(store.history, sessionID)
	return nil
}

func (store *memoryChatStore) GetSession(_ context.Context, sessionID uuid.UUID) (*Session, error) {
	session, ok := store.sessions[sessionID]
	if !ok {
		return nil, ErrSessionNotFound
	}
	return &session, nil
}

func (store *memoryChatStore) GetMessage(_ context.Context, messageID uuid.UUID) (*Message, error) {
	store.messageReads++
	message, ok := store.messages[messageID]
	if !ok {
		return nil, ErrMessageNotFound
	}
	return &message, nil
}

func (store *memoryChatStore) GetMessages(_ context.Context, sessionID uuid.UUID) ([]Message, error) {
	return append([]Message(nil), store.history[sessionID]...), nil
}

func (store *memoryChatStore) CreateSessionTurn(_ context.Context, session Session, userMessage, aiMessage Message) error {
	store.createCalls++
	store.sessions[session.ID] = session
	store.messages[userMessage.ID] = userMessage
	store.messages[aiMessage.ID] = aiMessage
	store.history[session.ID] = []Message{userMessage, aiMessage}
	return nil
}

func (store *memoryChatStore) AppendTurn(
	_ context.Context,
	sessionID, _ uuid.UUID,
	expectedUpdatedAt time.Time,
	title string,
	updatedAt time.Time,
	userMessage, aiMessage Message,
) error {
	if !store.sessions[sessionID].UpdatedAt.Equal(expectedUpdatedAt) {
		return ErrHistoryChanged
	}
	store.appendCalls++
	store.messages[userMessage.ID] = userMessage
	store.messages[aiMessage.ID] = aiMessage
	store.history[sessionID] = append(store.history[sessionID], userMessage, aiMessage)
	session := store.sessions[sessionID]
	if title != "" {
		session.Title = title
	}
	session.UpdatedAt = updatedAt
	store.sessions[sessionID] = session
	return nil
}

func (store *memoryChatStore) ReplaceTurn(
	_ context.Context,
	sessionID, _ uuid.UUID,
	targetMessageID uuid.UUID,
	expectedUpdatedAt time.Time,
	title string,
	updatedAt time.Time,
	userMessage, aiMessage Message,
) error {
	if !store.sessions[sessionID].UpdatedAt.Equal(expectedUpdatedAt) {
		return ErrHistoryChanged
	}
	store.replaceCalls++
	history := store.history[sessionID]
	index := -1
	for candidateIndex := range history {
		if history[candidateIndex].ID == targetMessageID {
			index = candidateIndex
			break
		}
	}
	if index < 0 {
		return ErrMessageNotFound
	}
	for _, removed := range history[index:] {
		delete(store.messages, removed.ID)
	}
	store.messages[userMessage.ID] = userMessage
	store.messages[aiMessage.ID] = aiMessage
	store.history[sessionID] = append(append([]Message(nil), history[:index]...), userMessage, aiMessage)
	session := store.sessions[sessionID]
	if title != "" {
		session.Title = title
	}
	session.UpdatedAt = updatedAt
	store.sessions[sessionID] = session
	return nil
}

type fakeChatGenerator struct {
	response *ChatResponse
	err      error
	requests []ChatRequest
	onCall   func()
}

func (generator *fakeChatGenerator) GenerateChat(_ context.Context, request ChatRequest) (*ChatResponse, error) {
	generator.requests = append(generator.requests, request)
	if generator.onCall != nil {
		generator.onCall()
	}
	return generator.response, generator.err
}

func chatFixture() (uuid.UUID, Session, []Message) {
	userID := uuid.MustParse("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa")
	session := Session{
		ID: uuid.MustParse("11111111-1111-4111-8111-111111111111"), UserID: userID, Title: "Test chat",
		CreatedAt: time.Date(2026, 9, 26, 8, 0, 0, 0, time.UTC), UpdatedAt: time.Date(2026, 9, 26, 8, 0, 1, 0, time.UTC),
	}
	messages := []Message{
		{ID: uuid.MustParse("21111111-1111-4111-8111-111111111111"), SessionID: session.ID, Role: "user", Content: "First question", CreatedAt: session.CreatedAt},
		{ID: uuid.MustParse("31111111-1111-4111-8111-111111111111"), SessionID: session.ID, Role: "ai", Content: "First reply", CreatedAt: session.UpdatedAt},
	}
	return userID, session, messages
}

func TestSendMessageAIFailureDoesNotCommit(t *testing.T) {
	userID, session, messages := chatFixture()
	store := newMemoryChatStore(session, messages)
	generator := &fakeChatGenerator{err: ErrAIUnavailable}
	service := NewService(store, generator)

	_, _, _, err := service.SendMessage(
		context.Background(), session.ID, userID,
		uuid.MustParse("41111111-1111-4111-8111-111111111111"), "New question",
	)
	if !errors.Is(err, ErrAIUnavailable) {
		t.Fatalf("error = %v; want ErrAIUnavailable", err)
	}
	if store.appendCalls != 0 || len(store.history[session.ID]) != len(messages) {
		t.Fatalf("append calls = %d, history = %#v", store.appendCalls, store.history[session.ID])
	}
}

func TestCreateSessionAIFailureDoesNotCreateHistory(t *testing.T) {
	store := newMemoryChatStore(Session{}, nil)
	service := NewService(store, &fakeChatGenerator{err: ErrAIUnavailable})

	_, _, _, err := service.CreateSession(
		context.Background(),
		uuid.MustParse("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"),
		uuid.MustParse("41111111-1111-4111-8111-111111111111"),
		"Start a chat",
	)
	if !errors.Is(err, ErrAIUnavailable) {
		t.Fatalf("error = %v; want ErrAIUnavailable", err)
	}
	if store.createCalls != 0 || len(store.sessions) != 0 || len(store.messages) != 0 {
		t.Fatalf(
			"create calls = %d, sessions = %d, messages = %d",
			store.createCalls, len(store.sessions), len(store.messages),
		)
	}
}

func TestSendMessageCommitsPairAfterGeneration(t *testing.T) {
	userID, session, messages := chatFixture()
	store := newMemoryChatStore(session, messages)
	title := "Updated chat"
	generator := &fakeChatGenerator{response: &ChatResponse{Reply: "New reply", GeneratedTitle: &title}}
	service := NewService(store, generator)
	turnID := uuid.MustParse("41111111-1111-4111-8111-111111111111")

	updatedSession, userMessage, aiMessage, err := service.SendMessage(
		context.Background(), session.ID, userID, turnID, "New question",
	)
	if err != nil {
		t.Fatal(err)
	}
	if store.appendCalls != 1 || len(store.history[session.ID]) != len(messages)+2 {
		t.Fatalf("append calls = %d, history length = %d", store.appendCalls, len(store.history[session.ID]))
	}
	if userMessage.ID != turnID || aiMessage.ID != assistantMessageID(turnID) || updatedSession.Title != title {
		t.Fatalf("session=%#v user=%#v ai=%#v", updatedSession, userMessage, aiMessage)
	}
	requestMessages := generator.requests[0].Messages
	if len(requestMessages) != 3 || requestMessages[2].Content != "New question" {
		t.Fatalf("AI history = %#v", requestMessages)
	}
}

func TestEditMessageAIFailurePreservesOriginalBranch(t *testing.T) {
	userID, session, messages := chatFixture()
	messages = append(messages,
		Message{ID: uuid.MustParse("51111111-1111-4111-8111-111111111111"), SessionID: session.ID, Role: "user", Content: "Future question", CreatedAt: session.UpdatedAt.Add(time.Second)},
		Message{ID: uuid.MustParse("61111111-1111-4111-8111-111111111111"), SessionID: session.ID, Role: "ai", Content: "Future reply", CreatedAt: session.UpdatedAt.Add(2 * time.Second)},
	)
	store := newMemoryChatStore(session, messages)
	service := NewService(store, &fakeChatGenerator{err: ErrAIUnavailable})

	_, _, _, err := service.EditMessage(
		context.Background(), session.ID, userID, messages[0].ID,
		uuid.MustParse("71111111-1111-4111-8111-111111111111"), "Edited question",
	)
	if !errors.Is(err, ErrAIUnavailable) {
		t.Fatalf("error = %v; want ErrAIUnavailable", err)
	}
	if store.replaceCalls != 0 || len(store.history[session.ID]) != len(messages) {
		t.Fatalf("replace calls = %d, history = %#v", store.replaceCalls, store.history[session.ID])
	}
}

func TestSendMessageIdempotentRetrySkipsAI(t *testing.T) {
	userID, session, messages := chatFixture()
	turnID := uuid.MustParse("41111111-1111-4111-8111-111111111111")
	committedUser := Message{ID: turnID, SessionID: session.ID, Role: "user", Content: "Already sent", CreatedAt: session.UpdatedAt.Add(time.Second)}
	committedAI := Message{ID: assistantMessageID(turnID), SessionID: session.ID, Role: "ai", Content: "Already answered", CreatedAt: session.UpdatedAt.Add(2 * time.Second)}
	messages = append(messages, committedUser, committedAI)
	store := newMemoryChatStore(session, messages)
	generator := &fakeChatGenerator{response: &ChatResponse{Reply: "Should not run"}}
	service := NewService(store, generator)

	_, userMessage, aiMessage, err := service.SendMessage(context.Background(), session.ID, userID, turnID, "Already sent")
	if err != nil {
		t.Fatal(err)
	}
	if len(generator.requests) != 0 || store.appendCalls != 0 {
		t.Fatalf("AI calls = %d, append calls = %d", len(generator.requests), store.appendCalls)
	}
	if userMessage.ID != committedUser.ID || aiMessage.ID != committedAI.ID {
		t.Fatalf("user=%#v ai=%#v", userMessage, aiMessage)
	}
}

func TestEditMessageUsesRetainedHistoryAndReplacesAtomically(t *testing.T) {
	userID, session, messages := chatFixture()
	target := Message{ID: uuid.MustParse("51111111-1111-4111-8111-111111111111"), SessionID: session.ID, Role: "user", Content: "Old question", CreatedAt: session.UpdatedAt.Add(time.Second)}
	messages = append(messages,
		target,
		Message{ID: uuid.MustParse("61111111-1111-4111-8111-111111111111"), SessionID: session.ID, Role: "ai", Content: "Old reply", CreatedAt: session.UpdatedAt.Add(2 * time.Second)},
		Message{ID: uuid.MustParse("71111111-1111-4111-8111-111111111111"), SessionID: session.ID, Role: "user", Content: "Future question", CreatedAt: session.UpdatedAt.Add(3 * time.Second)},
	)
	store := newMemoryChatStore(session, messages)
	generator := &fakeChatGenerator{response: &ChatResponse{Reply: "Edited reply"}}
	service := NewService(store, generator)
	turnID := uuid.MustParse("81111111-1111-4111-8111-111111111111")

	_, _, _, err := service.EditMessage(context.Background(), session.ID, userID, target.ID, turnID, "Edited question")
	if err != nil {
		t.Fatal(err)
	}
	if store.replaceCalls != 1 {
		t.Fatalf("replace calls = %d", store.replaceCalls)
	}
	requestMessages := generator.requests[0].Messages
	if len(requestMessages) != 3 || requestMessages[0].Content != "First question" || requestMessages[2].Content != "Edited question" {
		t.Fatalf("AI history = %#v", requestMessages)
	}
	updatedHistory := store.history[session.ID]
	if len(updatedHistory) != 4 || updatedHistory[2].ID != turnID || updatedHistory[3].ID != assistantMessageID(turnID) {
		t.Fatalf("updated history = %#v", updatedHistory)
	}
}

func TestSendMessageAuthorizesSessionBeforeLookingUpClientTurn(t *testing.T) {
	ownerID, session, messages := chatFixture()
	store := newMemoryChatStore(session, messages)
	service := NewService(store, &fakeChatGenerator{response: &ChatResponse{Reply: "Should not run"}})
	otherUserID := uuid.MustParse("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb")

	_, _, _, err := service.SendMessage(
		context.Background(), session.ID, otherUserID, messages[0].ID, "First question",
	)
	if !errors.Is(err, ErrUnauthorized) {
		t.Fatalf("error = %v; want ErrUnauthorized (owner %s)", err, ownerID)
	}
	if store.messageReads != 0 {
		t.Fatalf("message reads = %d; unauthorized requests must not probe turn ids", store.messageReads)
	}
}

func TestSendMessageRejectsAStaleHistorySnapshot(t *testing.T) {
	userID, session, messages := chatFixture()
	store := newMemoryChatStore(session, messages)
	generator := &fakeChatGenerator{response: &ChatResponse{Reply: "Stale reply"}}
	generator.onCall = func() {
		concurrentSession := store.sessions[session.ID]
		concurrentSession.UpdatedAt = concurrentSession.UpdatedAt.Add(time.Second)
		store.sessions[session.ID] = concurrentSession
	}
	service := NewService(store, generator)

	_, _, _, err := service.SendMessage(
		context.Background(), session.ID, userID,
		uuid.MustParse("91111111-1111-4111-8111-111111111111"), "Question from stale history",
	)
	if !errors.Is(err, ErrHistoryChanged) {
		t.Fatalf("error = %v; want ErrHistoryChanged", err)
	}
	if store.appendCalls != 0 || len(store.history[session.ID]) != len(messages) {
		t.Fatalf("append calls = %d, history = %#v", store.appendCalls, store.history[session.ID])
	}
}
