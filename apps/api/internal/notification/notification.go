package notification

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"regexp"
	"strconv"
	"time"

	"github.com/err0r4o4-dev/lostlink/apps/api/internal/auth"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	ErrNotFound = errors.New("notification not found")
	uuidPattern = regexp.MustCompile(`^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$`)
)

type Notification struct {
	ID               string     `json:"id"`
	NotificationType string     `json:"notification_type"`
	Title            string     `json:"title"`
	Message          string     `json:"message"`
	RelatedPath      *string    `json:"related_path,omitempty"`
	ReadAt           *time.Time `json:"read_at,omitempty"`
	CreatedAt        time.Time  `json:"created_at"`
}

type Store interface {
	List(context.Context, string, int, int) ([]Notification, error)
	MarkRead(context.Context, string, string) (Notification, error)
	MarkAllRead(context.Context, string) error
}

type Repository struct{ pool *pgxpool.Pool }

func NewRepository(pool *pgxpool.Pool) *Repository { return &Repository{pool: pool} }

const columns = `id::text, notification_type, title, message, related_path, read_at, created_at`

func (repository *Repository) List(ctx context.Context, userID string, limit, offset int) ([]Notification, error) {
	rows, err := repository.pool.Query(ctx, `
		SELECT `+columns+` FROM notifications
		WHERE user_id = $1::uuid
		ORDER BY created_at DESC, id DESC LIMIT $2 OFFSET $3`, userID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("list notifications: %w", err)
	}
	defer rows.Close()
	values := make([]Notification, 0)
	for rows.Next() {
		value, err := scanNotification(rows)
		if err != nil {
			return nil, fmt.Errorf("scan notification: %w", err)
		}
		values = append(values, value)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate notifications: %w", err)
	}
	return values, nil
}

func (repository *Repository) MarkRead(ctx context.Context, userID, notificationID string) (Notification, error) {
	value, err := scanNotification(repository.pool.QueryRow(ctx, `
		UPDATE notifications SET read_at = COALESCE(read_at, now())
		WHERE id = $1::uuid AND user_id = $2::uuid
		RETURNING `+columns, notificationID, userID))
	if errors.Is(err, pgx.ErrNoRows) {
		return Notification{}, ErrNotFound
	}
	if err != nil {
		return Notification{}, fmt.Errorf("mark notification read: %w", err)
	}
	return value, nil
}

func (repository *Repository) MarkAllRead(ctx context.Context, userID string) error {
	_, err := repository.pool.Exec(ctx, `
		UPDATE notifications SET read_at = COALESCE(read_at, now())
		WHERE user_id = $1::uuid AND read_at IS NULL`, userID)
	if err != nil {
		return fmt.Errorf("mark notifications read: %w", err)
	}
	return nil
}

type rowScanner interface{ Scan(...any) error }

func scanNotification(row rowScanner) (Notification, error) {
	var value Notification
	err := row.Scan(&value.ID, &value.NotificationType, &value.Title, &value.Message, &value.RelatedPath, &value.ReadAt, &value.CreatedAt)
	return value, err
}

type Service struct{ store Store }

func NewService(store Store) *Service { return &Service{store: store} }

func (service *Service) List(ctx context.Context, userID string, limit, offset int) ([]Notification, int, int, error) {
	limit, offset = pageBounds(limit, offset)
	values, err := service.store.List(ctx, userID, limit, offset)
	return values, limit, offset, err
}

func (service *Service) MarkRead(ctx context.Context, userID, notificationID string) (Notification, error) {
	if !uuidPattern.MatchString(notificationID) {
		return Notification{}, ErrNotFound
	}
	return service.store.MarkRead(ctx, userID, notificationID)
}

func (service *Service) MarkAllRead(ctx context.Context, userID string) error {
	return service.store.MarkAllRead(ctx, userID)
}

func RegisterRoutes(v1 *gin.RouterGroup, service *Service, authService *auth.Service) {
	handler := &HTTPHandler{service: service}
	authenticated := auth.RequireRoles(authService, auth.RoleUser, auth.RoleStaff, auth.RoleAdmin)
	v1.GET("/notifications", authenticated, handler.list)
	v1.POST("/notifications/:notificationID/read", authenticated, handler.markRead)
	v1.POST("/notifications/read-all", authenticated, handler.markAllRead)
}

type HTTPHandler struct{ service *Service }

func (handler *HTTPHandler) list(c *gin.Context) {
	limit, limitErr := optionalInt(c.Query("limit"))
	offset, offsetErr := optionalInt(c.Query("offset"))
	if limitErr != nil || offsetErr != nil {
		writeError(c, http.StatusBadRequest, "validation_failed", "Pagination parameters are invalid")
		return
	}
	values, boundedLimit, boundedOffset, err := handler.service.List(c.Request.Context(), auth.PrincipalFrom(c).ID, limit, offset)
	if err != nil {
		writeError(c, http.StatusInternalServerError, "internal_error", "The request could not be completed")
		return
	}
	c.JSON(http.StatusOK, gin.H{"notifications": values, "pagination": gin.H{"limit": boundedLimit, "offset": boundedOffset}})
}

func (handler *HTTPHandler) markRead(c *gin.Context) {
	value, err := handler.service.MarkRead(c.Request.Context(), auth.PrincipalFrom(c).ID, c.Param("notificationID"))
	if errors.Is(err, ErrNotFound) {
		writeError(c, http.StatusNotFound, "not_found", "Notification not found")
		return
	}
	if err != nil {
		writeError(c, http.StatusInternalServerError, "internal_error", "The request could not be completed")
		return
	}
	c.JSON(http.StatusOK, gin.H{"notification": value})
}

func (handler *HTTPHandler) markAllRead(c *gin.Context) {
	if err := handler.service.MarkAllRead(c.Request.Context(), auth.PrincipalFrom(c).ID); err != nil {
		writeError(c, http.StatusInternalServerError, "internal_error", "The request could not be completed")
		return
	}
	c.Status(http.StatusNoContent)
}

func optionalInt(value string) (int, error) {
	if value == "" {
		return 0, nil
	}
	return strconv.Atoi(value)
}

func pageBounds(limit, offset int) (int, int) {
	if limit <= 0 {
		limit = 20
	}
	if limit > 50 {
		limit = 50
	}
	if offset < 0 {
		offset = 0
	}
	if offset > 10_000 {
		offset = 10_000
	}
	return limit, offset
}

func writeError(c *gin.Context, status int, code, message string) {
	c.JSON(status, gin.H{"error": gin.H{"code": code, "message": message}})
}
