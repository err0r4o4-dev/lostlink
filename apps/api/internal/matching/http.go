package matching

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/err0r4o4-dev/lostlink/apps/api/internal/auth"
	"github.com/gin-gonic/gin"
)

type HTTPHandler struct{ service *Service }

func RegisterRoutes(v1 *gin.RouterGroup, service *Service, authService *auth.Service) {
	handler := &HTTPHandler{service: service}
	authenticated := auth.RequireRoles(authService, auth.RoleUser, auth.RoleStaff, auth.RoleAdmin)
	v1.POST("/reports/:reportID/matching-runs", authenticated, handler.run)
	v1.GET("/reports/:reportID/matches", authenticated, handler.list)
	v1.GET("/matches/:matchID", authenticated, handler.byID)
}

func RegisterStaffRoutes(router *gin.RouterGroup, service *Service, authService *auth.Service) {
	handler := &HTTPHandler{service: service}
	staff := auth.RequireRoles(authService, auth.RoleStaff, auth.RoleAdmin)
	router.GET("/matches", staff, handler.staffList)
	router.POST("/matches/:matchID/review-actions", staff, handler.review)
}

func (handler *HTTPHandler) run(c *gin.Context) {
	run, matches, err := handler.service.Run(
		c.Request.Context(), auth.PrincipalFrom(c), c.Param("reportID"), c.GetHeader("Idempotency-Key"),
	)
	if handler.writeError(c, err) {
		return
	}
	c.JSON(http.StatusCreated, gin.H{"run": run, "matches": matches})
}

func (handler *HTTPHandler) list(c *gin.Context) {
	values, err := handler.service.List(c.Request.Context(), auth.PrincipalFrom(c), c.Param("reportID"))
	if handler.writeError(c, err) {
		return
	}
	c.JSON(http.StatusOK, gin.H{"matches": values})
}

func (handler *HTTPHandler) byID(c *gin.Context) {
	value, err := handler.service.ByID(c.Request.Context(), auth.PrincipalFrom(c), c.Param("matchID"))
	if handler.writeError(c, err) {
		return
	}
	c.JSON(http.StatusOK, gin.H{"match": value})
}

func (handler *HTTPHandler) staffList(c *gin.Context) {
	limit, limitErr := optionalInt(c.Query("limit"))
	offset, offsetErr := optionalInt(c.Query("offset"))
	if limitErr != nil || offsetErr != nil {
		writeHTTPError(c, http.StatusBadRequest, "validation_failed", "Pagination parameters are invalid")
		return
	}
	values, err := handler.service.StaffList(c.Request.Context(), c.Query("review_status"), limit, offset)
	if handler.writeError(c, err) {
		return
	}
	boundedLimit, boundedOffset := pageBounds(limit, offset)
	c.JSON(http.StatusOK, gin.H{"matches": values, "pagination": gin.H{"limit": boundedLimit, "offset": boundedOffset}})
}

func (handler *HTTPHandler) review(c *gin.Context) {
	var request struct {
		Action ReviewAction `json:"action" binding:"required"`
	}
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, 4<<10)
	if err := c.ShouldBindJSON(&request); err != nil {
		writeHTTPError(c, http.StatusBadRequest, "validation_failed", "Request validation failed")
		return
	}
	value, err := handler.service.Review(c.Request.Context(), auth.PrincipalFrom(c).ID, c.Param("matchID"), request.Action)
	if handler.writeError(c, err) {
		return
	}
	c.JSON(http.StatusOK, gin.H{"match": value})
}

func (handler *HTTPHandler) writeError(c *gin.Context, err error) bool {
	if err == nil {
		return false
	}
	switch {
	case errors.Is(err, ErrInvalid):
		writeHTTPError(c, http.StatusUnprocessableEntity, "validation_failed", "Request fields are invalid")
	case errors.Is(err, ErrNotFound):
		writeHTTPError(c, http.StatusNotFound, "not_found", "Match or report not found")
	case errors.Is(err, ErrForbidden):
		writeHTTPError(c, http.StatusForbidden, "forbidden", "You are not allowed to access this matching result")
	case errors.Is(err, ErrInvalidState):
		writeHTTPError(c, http.StatusConflict, "invalid_state", "The current state does not allow this matching action")
	case errors.Is(err, ErrRunInProgress):
		writeHTTPError(c, http.StatusConflict, "matching_in_progress", "This matching request is already in progress")
	case errors.Is(err, ErrAIUnavailable):
		writeHTTPError(c, http.StatusServiceUnavailable, "matching_unavailable", "Matching is temporarily unavailable")
	case errors.Is(err, ErrRateLimited):
		writeHTTPError(c, http.StatusTooManyRequests, "rate_limited", "Too many matching requests; try again later")
	default:
		writeHTTPError(c, http.StatusInternalServerError, "internal_error", "The request could not be completed")
	}
	return true
}

func optionalInt(value string) (int, error) {
	if value == "" {
		return 0, nil
	}
	return strconv.Atoi(value)
}

func writeHTTPError(c *gin.Context, status int, code, message string) {
	c.JSON(status, gin.H{"error": gin.H{"code": code, "message": message}})
}
