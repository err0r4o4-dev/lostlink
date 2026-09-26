package aichat

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

func (r *Repository) ListSessions(ctx context.Context, userID uuid.UUID) ([]Session, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, user_id, title, created_at, updated_at
		FROM ai_chat_sessions
		WHERE user_id = $1
		ORDER BY updated_at DESC
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var sessions []Session
	for rows.Next() {
		var session Session
		if err := rows.Scan(&session.ID, &session.UserID, &session.Title, &session.CreatedAt, &session.UpdatedAt); err != nil {
			return nil, err
		}
		sessions = append(sessions, session)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return sessions, nil
}

func (r *Repository) DeleteSession(ctx context.Context, sessionID uuid.UUID) error {
	_, err := r.db.Exec(ctx, `DELETE FROM ai_chat_sessions WHERE id = $1`, sessionID)
	return err
}

func (r *Repository) GetSession(ctx context.Context, sessionID uuid.UUID) (*Session, error) {
	var session Session
	err := r.db.QueryRow(ctx, `
		SELECT id, user_id, title, created_at, updated_at
		FROM ai_chat_sessions
		WHERE id = $1
	`, sessionID).Scan(&session.ID, &session.UserID, &session.Title, &session.CreatedAt, &session.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrSessionNotFound
	}
	if err != nil {
		return nil, err
	}
	return &session, nil
}

func (r *Repository) GetMessage(ctx context.Context, messageID uuid.UUID) (*Message, error) {
	var message Message
	err := r.db.QueryRow(ctx, `
		SELECT id, session_id, role, content, analysis_data, created_at
		FROM ai_chat_messages
		WHERE id = $1
	`, messageID).Scan(
		&message.ID, &message.SessionID, &message.Role, &message.Content, &message.AnalysisData, &message.CreatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrMessageNotFound
	}
	if err != nil {
		return nil, err
	}
	return &message, nil
}

func (r *Repository) GetMessages(ctx context.Context, sessionID uuid.UUID) ([]Message, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, session_id, role, content, analysis_data, created_at
		FROM ai_chat_messages
		WHERE session_id = $1
		ORDER BY created_at ASC, id ASC
	`, sessionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var messages []Message
	for rows.Next() {
		var message Message
		if err := rows.Scan(
			&message.ID, &message.SessionID, &message.Role, &message.Content, &message.AnalysisData, &message.CreatedAt,
		); err != nil {
			return nil, err
		}
		messages = append(messages, message)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return messages, nil
}

func (r *Repository) CreateSessionTurn(ctx context.Context, session Session, userMessage, aiMessage Message) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin chat session turn: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	if _, err := tx.Exec(ctx, `
		INSERT INTO ai_chat_sessions (id, user_id, title, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5)
	`, session.ID, session.UserID, session.Title, session.CreatedAt, session.UpdatedAt); err != nil {
		return fmt.Errorf("create chat session: %w", err)
	}
	if err := insertMessage(ctx, tx, userMessage); err != nil {
		return err
	}
	if err := insertMessage(ctx, tx, aiMessage); err != nil {
		return err
	}
	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("commit chat session turn: %w", err)
	}
	return nil
}

func (r *Repository) AppendTurn(
	ctx context.Context,
	sessionID, userID uuid.UUID,
	expectedUpdatedAt time.Time,
	title string,
	updatedAt time.Time,
	userMessage, aiMessage Message,
) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin chat turn: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	if err := lockOwnedSession(ctx, tx, sessionID, userID, expectedUpdatedAt); err != nil {
		return err
	}
	if err := insertMessage(ctx, tx, userMessage); err != nil {
		return err
	}
	if err := insertMessage(ctx, tx, aiMessage); err != nil {
		return err
	}
	if err := updateSession(ctx, tx, sessionID, title, updatedAt); err != nil {
		return err
	}
	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("commit chat turn: %w", err)
	}
	return nil
}

func (r *Repository) ReplaceTurn(
	ctx context.Context,
	sessionID, userID, targetMessageID uuid.UUID,
	expectedUpdatedAt time.Time,
	title string,
	updatedAt time.Time,
	userMessage, aiMessage Message,
) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin chat replacement: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	if err := lockOwnedSession(ctx, tx, sessionID, userID, expectedUpdatedAt); err != nil {
		return err
	}

	var targetCreatedAt time.Time
	var targetRole string
	err = tx.QueryRow(ctx, `
		SELECT created_at, role
		FROM ai_chat_messages
		WHERE id = $1 AND session_id = $2
		FOR UPDATE
	`, targetMessageID, sessionID).Scan(&targetCreatedAt, &targetRole)
	if errors.Is(err, pgx.ErrNoRows) {
		return ErrMessageNotFound
	}
	if err != nil {
		return fmt.Errorf("lock replacement target: %w", err)
	}
	if targetRole != "user" {
		return ErrInvalidMessage
	}

	if _, err := tx.Exec(ctx, `
		DELETE FROM ai_chat_messages
		WHERE session_id = $1 AND created_at >= $2
	`, sessionID, targetCreatedAt); err != nil {
		return fmt.Errorf("remove replaced chat branch: %w", err)
	}
	if err := insertMessage(ctx, tx, userMessage); err != nil {
		return err
	}
	if err := insertMessage(ctx, tx, aiMessage); err != nil {
		return err
	}
	if err := updateSession(ctx, tx, sessionID, title, updatedAt); err != nil {
		return err
	}
	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("commit chat replacement: %w", err)
	}
	return nil
}

func lockOwnedSession(
	ctx context.Context,
	tx pgx.Tx,
	sessionID, userID uuid.UUID,
	expectedUpdatedAt time.Time,
) error {
	var ownerID uuid.UUID
	var currentUpdatedAt time.Time
	err := tx.QueryRow(ctx, `
		SELECT user_id, updated_at FROM ai_chat_sessions WHERE id = $1 FOR UPDATE
	`, sessionID).Scan(&ownerID, &currentUpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return ErrSessionNotFound
	}
	if err != nil {
		return fmt.Errorf("lock chat session: %w", err)
	}
	if ownerID != userID {
		return ErrUnauthorized
	}
	if !currentUpdatedAt.Equal(expectedUpdatedAt) {
		return ErrHistoryChanged
	}
	return nil
}

func insertMessage(ctx context.Context, tx pgx.Tx, message Message) error {
	if _, err := tx.Exec(ctx, `
		INSERT INTO ai_chat_messages (id, session_id, role, content, analysis_data, created_at)
		VALUES ($1, $2, $3, $4, $5, $6)
	`, message.ID, message.SessionID, message.Role, message.Content, message.AnalysisData, message.CreatedAt); err != nil {
		return fmt.Errorf("create chat message: %w", err)
	}
	return nil
}

func updateSession(ctx context.Context, tx pgx.Tx, sessionID uuid.UUID, title string, updatedAt time.Time) error {
	if _, err := tx.Exec(ctx, `
		UPDATE ai_chat_sessions
		SET title = CASE WHEN $2 = '' THEN title ELSE $2 END,
		    updated_at = $3
		WHERE id = $1
	`, sessionID, title, updatedAt); err != nil {
		return fmt.Errorf("update chat session: %w", err)
	}
	return nil
}
