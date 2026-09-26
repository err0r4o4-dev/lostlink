package aichat

import (
	"errors"
	"net/http"

	"github.com/err0r4o4-dev/lostlink/apps/api/internal/auth"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type HTTPHandler struct{ service *Service }

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
		chats.DELETE("/:sessionID/messages/:messageID/rewind", handler.rewindSession)
	}
}

func (h *HTTPHandler) listSessions(c *gin.Context) {
	principal := auth.PrincipalFrom(c)
	userID, err := uuid.Parse(principal.ID)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	sessions, err := h.service.ListSessions(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list sessions"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"sessions": sessions})
}

type CreateSessionRequest struct {
	Message string `json:"message" binding:"required"`
}

func (h *HTTPHandler) createSession(c *gin.Context) {
	principal := auth.PrincipalFrom(c)
	userID, err := uuid.Parse(principal.ID)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var req CreateSessionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	session, userMsg, aiMsg, err := h.service.CreateSession(c.Request.Context(), userID, req.Message)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create session"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"session": session,
		"user_message": userMsg,
		"ai_message": aiMsg,
	})
}

func (h *HTTPHandler) deleteSession(c *gin.Context) {
	principal := auth.PrincipalFrom(c)
	userID, err := uuid.Parse(principal.ID)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	sessionID, err := uuid.Parse(c.Param("sessionID"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid session id"})
		return
	}

	if err := h.service.DeleteSession(c.Request.Context(), sessionID, userID); err != nil {
		if errors.Is(err, ErrUnauthorized) {
			c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
			return
		}
		if errors.Is(err, ErrSessionNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete session"})
		return
	}

	c.Status(http.StatusNoContent)
}

func (h *HTTPHandler) listMessages(c *gin.Context) {
	principal := auth.PrincipalFrom(c)
	userID, err := uuid.Parse(principal.ID)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	sessionID, err := uuid.Parse(c.Param("sessionID"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid session id"})
		return
	}

	messages, err := h.service.GetMessages(c.Request.Context(), sessionID, userID)
	if err != nil {
		if errors.Is(err, ErrUnauthorized) {
			c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
			return
		}
		if errors.Is(err, ErrSessionNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get messages"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"messages": messages})
}

type SendMessageRequest struct {
	Message string `json:"message" binding:"required"`
}

func (h *HTTPHandler) sendMessage(c *gin.Context) {
	principal := auth.PrincipalFrom(c)
	userID, err := uuid.Parse(principal.ID)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	sessionID, err := uuid.Parse(c.Param("sessionID"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid session id"})
		return
	}

	var req SendMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	session, userMsg, aiMsg, err := h.service.SendMessage(c.Request.Context(), sessionID, userID, req.Message)
	if err != nil {
		if errors.Is(err, ErrUnauthorized) {
			c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
			return
		}
		if errors.Is(err, ErrSessionNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to send message"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"session": session,
		"user_message": userMsg,
		"ai_message": aiMsg,
	})
}

func (h *HTTPHandler) rewindSession(c *gin.Context) {
	principal := auth.PrincipalFrom(c)
	userID, err := uuid.Parse(principal.ID)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	sessionID, err := uuid.Parse(c.Param("sessionID"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid session id"})
		return
	}

	messageID, err := uuid.Parse(c.Param("messageID"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid message id"})
		return
	}

	if err := h.service.RewindSession(c.Request.Context(), sessionID, userID, messageID); err != nil {
		if errors.Is(err, ErrUnauthorized) {
			c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
			return
		}
		if errors.Is(err, ErrSessionNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to rewind session"})
		return
	}

	c.Status(http.StatusNoContent)
}
