package aichat

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

func (r *Repository) CreateSession(ctx context.Context, session *Session) error {
	query := `
		INSERT INTO ai_chat_sessions (id, user_id, title, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5)
	`
	_, err := r.db.Exec(ctx, query, session.ID, session.UserID, session.Title, session.CreatedAt, session.UpdatedAt)
	return err
}

func (r *Repository) UpdateSessionTitle(ctx context.Context, sessionID uuid.UUID, title string) error {
	query := `
		UPDATE ai_chat_sessions
		SET title = $1, updated_at = NOW()
		WHERE id = $2
	`
	_, err := r.db.Exec(ctx, query, title, sessionID)
	return err
}

func (r *Repository) ListSessions(ctx context.Context, userID uuid.UUID) ([]Session, error) {
	query := `
		SELECT id, user_id, title, created_at, updated_at
		FROM ai_chat_sessions
		WHERE user_id = $1
		ORDER BY updated_at DESC
	`
	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var sessions []Session
	for rows.Next() {
		var s Session
		if err := rows.Scan(&s.ID, &s.UserID, &s.Title, &s.CreatedAt, &s.UpdatedAt); err != nil {
			return nil, err
		}
		sessions = append(sessions, s)
	}
	return sessions, nil
}

func (r *Repository) DeleteSession(ctx context.Context, sessionID uuid.UUID) error {
	query := `DELETE FROM ai_chat_sessions WHERE id = $1`
	_, err := r.db.Exec(ctx, query, sessionID)
	return err
}

func (r *Repository) GetSession(ctx context.Context, sessionID uuid.UUID) (*Session, error) {
	query := `
		SELECT id, user_id, title, created_at, updated_at
		FROM ai_chat_sessions
		WHERE id = $1
	`
	var s Session
	err := r.db.QueryRow(ctx, query, sessionID).Scan(&s.ID, &s.UserID, &s.Title, &s.CreatedAt, &s.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *Repository) DeleteMessagesFrom(ctx context.Context, sessionID uuid.UUID, fromCreatedAt time.Time) error {
	query := `DELETE FROM ai_chat_messages WHERE session_id = $1 AND created_at >= $2`
	_, err := r.db.Exec(ctx, query, sessionID, fromCreatedAt)
	return err
}

func (r *Repository) GetMessage(ctx context.Context, messageID uuid.UUID) (*Message, error) {
	query := `
		SELECT id, session_id, role, content, analysis_data, created_at
		FROM ai_chat_messages
		WHERE id = $1
	`
	var m Message
	err := r.db.QueryRow(ctx, query, messageID).Scan(&m.ID, &m.SessionID, &m.Role, &m.Content, &m.AnalysisData, &m.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *Repository) CreateMessage(ctx context.Context, message *Message) error {
	query := `
		INSERT INTO ai_chat_messages (id, session_id, role, content, analysis_data, created_at)
		VALUES ($1, $2, $3, $4, $5, $6)
	`
	_, err := r.db.Exec(ctx, query, message.ID, message.SessionID, message.Role, message.Content, message.AnalysisData, message.CreatedAt)
	return err
}

func (r *Repository) GetMessages(ctx context.Context, sessionID uuid.UUID) ([]Message, error) {
	query := `
		SELECT id, session_id, role, content, analysis_data, created_at
		FROM ai_chat_messages
		WHERE session_id = $1
		ORDER BY created_at ASC
	`
	rows, err := r.db.Query(ctx, query, sessionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var messages []Message
	for rows.Next() {
		var m Message
		if err := rows.Scan(&m.ID, &m.SessionID, &m.Role, &m.Content, &m.AnalysisData, &m.CreatedAt); err != nil {
			return nil, err
		}
		messages = append(messages, m)
	}
	return messages, nil
}
