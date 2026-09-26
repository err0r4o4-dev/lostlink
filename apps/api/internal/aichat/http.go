package aichat

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"github.com/err0r4o4-dev/lostlink/apps/api/internal/auth"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

const maxChatRequestBytes = 20 << 10

type HTTPHandler struct{ service *Service }

type turnRequest struct {
	Message      string `json:"message"`
	ClientTurnID string `json:"client_turn_id" binding:"required"`
}

type sessionResponse struct {
	ID        uuid.UUID `json:"id"`
	UserID    uuid.UUID `json:"user_id"`
	Title     string    `json:"title"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type messageResponse struct {
	ID           uuid.UUID       `json:"id"`
	SessionID    uuid.UUID       `json:"session_id"`
	Role         string          `json:"role"`
	Content      string          `json:"content"`
	AnalysisData json.RawMessage `json:"analysis_data,omitempty"`
	CreatedAt    time.Time       `json:"created_at"`
}

func RegisterRoutes(v1 *gin.RouterGroup, service *Service, authService *auth.Service) {
	handler := &HTTPHandler{service: service}
	authenticated := auth.RequireRoles(authService, auth.RoleUser, auth.RoleStaff, auth.RoleAdmin)

	chats := v1.Group("/chats", authenticated)
	{
		chats.GET("", handler.listSessions)
		chats.POST("", handler.createSession)
		chats.DELETE("/:sessionID", handler.deleteSession)
		chats.GET("/:sessionID/messages", handler.listMessages)
		chats.POST("/:sessionID/messages", handler.sendMessage)
		chats.PUT("/:sessionID/messages/:messageID", handler.editMessage)
	}
}

func (h *HTTPHandler) listSessions(c *gin.Context) {
	userID, ok := principalID(c)
	if !ok {
		return
	}
	sessions, err := h.service.ListSessions(c.Request.Context(), userID)
	if h.writeError(c, err) {
		return
	}
	responses := make([]sessionResponse, 0, len(sessions))
	for index := range sessions {
		responses = append(responses, sessionDTO(&sessions[index]))
	}
	c.JSON(http.StatusOK, gin.H{"sessions": responses})
}

func (h *HTTPHandler) createSession(c *gin.Context) {
	userID, ok := principalID(c)
	if !ok {
		return
	}
	request, clientTurnID, ok := bindTurn(c)
	if !ok {
		return
	}
	session, userMessage, aiMessage, err := h.service.CreateSession(
		c.Request.Context(), userID, clientTurnID, request.Message,
	)
	if h.writeError(c, err) {
		return
	}
	h.writeTurn(c, http.StatusCreated, session, userMessage, aiMessage)
}

func (h *HTTPHandler) deleteSession(c *gin.Context) {
	userID, ok := principalID(c)
	if !ok {
		return
	}
	sessionID, err := uuid.Parse(c.Param("sessionID"))
	if err != nil {
		writeHTTPError(c, http.StatusBadRequest, "validation_failed", "Session id is invalid")
		return
	}
	if h.writeError(c, h.service.DeleteSession(c.Request.Context(), sessionID, userID)) {
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *HTTPHandler) listMessages(c *gin.Context) {
	userID, ok := principalID(c)
	if !ok {
		return
	}
	sessionID, err := uuid.Parse(c.Param("sessionID"))
	if err != nil {
		writeHTTPError(c, http.StatusBadRequest, "validation_failed", "Session id is invalid")
		return
	}
	messages, err := h.service.GetMessages(c.Request.Context(), sessionID, userID)
	if h.writeError(c, err) {
		return
	}
	responses := make([]messageResponse, 0, len(messages))
	for index := range messages {
		responses = append(responses, messageDTO(&messages[index]))
	}
	c.JSON(http.StatusOK, gin.H{"messages": responses})
}

func (h *HTTPHandler) sendMessage(c *gin.Context) {
	userID, ok := principalID(c)
	if !ok {
		return
	}
	sessionID, err := uuid.Parse(c.Param("sessionID"))
	if err != nil {
		writeHTTPError(c, http.StatusBadRequest, "validation_failed", "Session id is invalid")
		return
	}
	request, clientTurnID, ok := bindTurn(c)
	if !ok {
		return
	}
	session, userMessage, aiMessage, err := h.service.SendMessage(
		c.Request.Context(), sessionID, userID, clientTurnID, request.Message,
	)
	if h.writeError(c, err) {
		return
	}
	h.writeTurn(c, http.StatusOK, session, userMessage, aiMessage)
}

func (h *HTTPHandler) editMessage(c *gin.Context) {
	userID, ok := principalID(c)
	if !ok {
		return
	}
	sessionID, err := uuid.Parse(c.Param("sessionID"))
	if err != nil {
		writeHTTPError(c, http.StatusBadRequest, "validation_failed", "Session id is invalid")
		return
	}
	messageID, err := uuid.Parse(c.Param("messageID"))
	if err != nil {
		writeHTTPError(c, http.StatusBadRequest, "validation_failed", "Message id is invalid")
		return
	}
	request, clientTurnID, ok := bindTurn(c)
	if !ok {
		return
	}
	session, userMessage, aiMessage, err := h.service.EditMessage(
		c.Request.Context(), sessionID, userID, messageID, clientTurnID, request.Message,
	)
	if h.writeError(c, err) {
		return
	}
	h.writeTurn(c, http.StatusOK, session, userMessage, aiMessage)
}

func bindTurn(c *gin.Context) (turnRequest, uuid.UUID, bool) {
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxChatRequestBytes)
	var request turnRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		writeHTTPError(c, http.StatusBadRequest, "validation_failed", "Request validation failed")
		return turnRequest{}, uuid.Nil, false
	}
	clientTurnID, err := uuid.Parse(request.ClientTurnID)
	if err != nil {
		writeHTTPError(c, http.StatusBadRequest, "validation_failed", "Client turn id is invalid")
		return turnRequest{}, uuid.Nil, false
	}
	return request, clientTurnID, true
}

func principalID(c *gin.Context) (uuid.UUID, bool) {
	userID, err := uuid.Parse(auth.PrincipalFrom(c).ID)
	if err != nil {
		writeHTTPError(c, http.StatusUnauthorized, "authentication_required", "Authentication required")
		return uuid.Nil, false
	}
	return userID, true
}

func (h *HTTPHandler) writeTurn(
	c *gin.Context,
	status int,
	session *Session,
	userMessage, aiMessage *Message,
) {
	c.JSON(status, gin.H{
		"session":      sessionDTO(session),
		"user_message": messageDTO(userMessage),
		"ai_message":   messageDTO(aiMessage),
	})
}

func (h *HTTPHandler) writeError(c *gin.Context, err error) bool {
	if err == nil {
		return false
	}
	if c.Request.Context().Err() != nil &&
		(errors.Is(err, context.Canceled) || errors.Is(err, context.DeadlineExceeded)) {
		return true
	}
	switch {
	case errors.Is(err, ErrInvalidMessage):
		writeHTTPError(c, http.StatusUnprocessableEntity, "validation_failed", "Message must contain 1 to 4000 characters")
	case errors.Is(err, ErrSessionNotFound), errors.Is(err, ErrMessageNotFound):
		writeHTTPError(c, http.StatusNotFound, "not_found", "Chat session or message not found")
	case errors.Is(err, ErrUnauthorized):
		writeHTTPError(c, http.StatusForbidden, "forbidden", "You are not allowed to access this chat")
	case errors.Is(err, ErrTurnConflict):
		writeHTTPError(c, http.StatusConflict, "turn_conflict", "This chat turn id was already used for different content")
	case errors.Is(err, ErrHistoryChanged):
		writeHTTPError(c, http.StatusConflict, "chat_history_changed", "The chat changed while AI was responding. Retry this message")
	case errors.Is(err, ErrAIUnavailable):
		writeHTTPError(c, http.StatusServiceUnavailable, "ai_temporarily_unavailable", "AI is temporarily unavailable. This message was not sent or saved")
	default:
		writeHTTPError(c, http.StatusInternalServerError, "internal_error", "The request could not be completed")
	}
	return true
}

func writeHTTPError(c *gin.Context, status int, code, message string) {
	c.JSON(status, gin.H{"error": gin.H{"code": code, "message": message}})
}

func sessionDTO(session *Session) sessionResponse {
	return sessionResponse{
		ID: session.ID, UserID: session.UserID, Title: session.Title,
		CreatedAt: session.CreatedAt, UpdatedAt: session.UpdatedAt,
	}
}

func messageDTO(message *Message) messageResponse {
	return messageResponse{
		ID: message.ID, SessionID: message.SessionID, Role: message.Role,
		Content: message.Content, AnalysisData: message.AnalysisData, CreatedAt: message.CreatedAt,
	}
}
