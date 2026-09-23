package admin

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/err0r4o4-dev/lostlink/apps/api/internal/auth"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Dashboard struct {
	OpenReports       int `json:"open_reports"`
	PotentialMatches  int `json:"potential_matches"`
	ClaimsToReview    int `json:"claims_to_review"`
	ReturnsInProgress int `json:"returns_in_progress"`
}

type AuditEvent struct {
	ID          string          `json:"id"`
	ActorID     *string         `json:"actor_id,omitempty"`
	Action      string          `json:"action"`
	SubjectType string          `json:"subject_type"`
	SubjectID   string          `json:"subject_id"`
	Metadata    json.RawMessage `json:"metadata"`
	CreatedAt   time.Time       `json:"created_at"`
}

type Repository struct{ pool *pgxpool.Pool }

func NewRepository(pool *pgxpool.Pool) *Repository { return &Repository{pool: pool} }

func (repository *Repository) Dashboard(ctx context.Context) (Dashboard, error) {
	var value Dashboard
	err := repository.pool.QueryRow(ctx, `
		SELECT
			(SELECT count(*) FROM reports WHERE status = 'active'),
			(SELECT count(*) FROM matches WHERE review_status = 'pending'),
			(SELECT count(*) FROM claims WHERE status IN ('submitted', 'under_review')),
			(SELECT count(*) FROM return_arrangements WHERE status IN ('scheduling', 'scheduled', 'picked_up', 'returned'))
	`).Scan(&value.OpenReports, &value.PotentialMatches, &value.ClaimsToReview, &value.ReturnsInProgress)
	if err != nil {
		return Dashboard{}, fmt.Errorf("load staff dashboard: %w", err)
	}
	return value, nil
}

func (repository *Repository) AuditEvents(ctx context.Context, limit, offset int) ([]AuditEvent, error) {
	rows, err := repository.pool.Query(ctx, `
		SELECT id::text, actor_id::text, action, subject_type, subject_id::text, metadata, created_at
		FROM audit_events ORDER BY created_at DESC, id DESC LIMIT $1 OFFSET $2`, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("list audit events: %w", err)
	}
	defer rows.Close()
	values := make([]AuditEvent, 0)
	for rows.Next() {
		var value AuditEvent
		if err := rows.Scan(&value.ID, &value.ActorID, &value.Action, &value.SubjectType, &value.SubjectID, &value.Metadata, &value.CreatedAt); err != nil {
			return nil, fmt.Errorf("scan audit event: %w", err)
		}
		values = append(values, value)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate audit events: %w", err)
	}
	return values, nil
}

type HTTPHandler struct{ repository *Repository }

func RegisterStaffRoutes(router *gin.RouterGroup, repository *Repository, authService *auth.Service) {
	handler := &HTTPHandler{repository: repository}
	router.GET("/dashboard", auth.RequireRoles(authService, auth.RoleStaff, auth.RoleAdmin), handler.dashboard)
}

func RegisterAdminRoutes(router *gin.RouterGroup, repository *Repository, authService *auth.Service) {
	handler := &HTTPHandler{repository: repository}
	router.GET("/audit-events", auth.RequireRoles(authService, auth.RoleAdmin), handler.auditEvents)
}

func (handler *HTTPHandler) dashboard(c *gin.Context) {
	value, err := handler.repository.Dashboard(c.Request.Context())
	if err != nil {
		writeError(c, http.StatusInternalServerError, "internal_error", "The request could not be completed")
		return
	}
	c.JSON(http.StatusOK, gin.H{"dashboard": value})
}

func (handler *HTTPHandler) auditEvents(c *gin.Context) {
	limit, limitErr := optionalInt(c.Query("limit"))
	offset, offsetErr := optionalInt(c.Query("offset"))
	if limitErr != nil || offsetErr != nil {
		writeError(c, http.StatusBadRequest, "validation_failed", "Pagination parameters are invalid")
		return
	}
	limit, offset = pageBounds(limit, offset)
	values, err := handler.repository.AuditEvents(c.Request.Context(), limit, offset)
	if err != nil {
		writeError(c, http.StatusInternalServerError, "internal_error", "The request could not be completed")
		return
	}
	c.JSON(http.StatusOK, gin.H{"audit_events": values, "pagination": gin.H{"limit": limit, "offset": offset}})
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
	if limit > 100 {
		limit = 100
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
