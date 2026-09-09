package report

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/err0r4o4-dev/lostlink/apps/api/internal/auth"
	"github.com/gin-gonic/gin"
)

type HTTPHandler struct{ service *Service }

func RegisterRoutes(router *gin.RouterGroup, service *Service, authService *auth.Service) {
	handler := &HTTPHandler{service: service}
	authenticated := auth.RequireRoles(authService, auth.RoleUser, auth.RoleStaff, auth.RoleAdmin)
	router.GET("", handler.search)
	router.POST("", authenticated, handler.create)
	router.GET("/mine", authenticated, handler.mine)
	router.GET("/:reportID", handler.byID)
}

func (handler *HTTPHandler) create(c *gin.Context) {
	var input CreateInput
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, 16<<10)
	if err := c.ShouldBindJSON(&input); err != nil {
		writeError(c, http.StatusBadRequest, "validation_failed", "Request validation failed")
		return
	}
	value, err := handler.service.Create(c.Request.Context(), auth.PrincipalFrom(c).ID, c.GetHeader("Idempotency-Key"), input)
	if errors.Is(err, ErrInvalid) {
		writeError(c, http.StatusUnprocessableEntity, "validation_failed", "Report fields or Idempotency-Key are invalid")
		return
	}
	if errors.Is(err, ErrIdempotencyConflict) {
		writeError(c, http.StatusConflict, "idempotency_conflict", "Idempotency-Key was already used for different content")
		return
	}
	if err != nil {
		writeError(c, http.StatusInternalServerError, "internal_error", "The request could not be completed")
		return
	}
	c.JSON(http.StatusCreated, gin.H{"report": value})
}

func (handler *HTTPHandler) search(c *gin.Context) {
	limit, limitErr := optionalInt(c.Query("limit"))
	offset, offsetErr := optionalInt(c.Query("offset"))
	values, err := handler.service.Search(c.Request.Context(), SearchFilter{
		Query: c.Query("q"), Category: c.Query("category"), Type: Type(c.Query("type")), Limit: limit, Offset: offset,
	})
	if limitErr != nil || offsetErr != nil || errors.Is(err, ErrInvalid) {
		writeError(c, http.StatusBadRequest, "validation_failed", "Search parameters are invalid")
		return
	}
	if err != nil {
		writeError(c, http.StatusInternalServerError, "internal_error", "The request could not be completed")
		return
	}
	c.JSON(http.StatusOK, gin.H{"reports": values, "pagination": gin.H{"limit": pageLimit(limit), "offset": pageOffset(offset)}})
}

func (handler *HTTPHandler) mine(c *gin.Context) {
	limit, limitErr := optionalInt(c.Query("limit"))
	offset, offsetErr := optionalInt(c.Query("offset"))
	if limitErr != nil || offsetErr != nil {
		writeError(c, http.StatusBadRequest, "validation_failed", "Pagination parameters are invalid")
		return
	}
	values, err := handler.service.Mine(c.Request.Context(), auth.PrincipalFrom(c).ID, limit, offset)
	if err != nil {
		writeError(c, http.StatusInternalServerError, "internal_error", "The request could not be completed")
		return
	}
	c.JSON(http.StatusOK, gin.H{"reports": values, "pagination": gin.H{"limit": pageLimit(limit), "offset": pageOffset(offset)}})
}

func (handler *HTTPHandler) byID(c *gin.Context) {
	value, err := handler.service.ByID(c.Request.Context(), c.Param("reportID"))
	if errors.Is(err, ErrNotFound) {
		writeError(c, http.StatusNotFound, "not_found", "Report not found")
		return
	}
	if err != nil {
		writeError(c, http.StatusInternalServerError, "internal_error", "The request could not be completed")
		return
	}
	c.JSON(http.StatusOK, gin.H{"report": value})
}

func optionalInt(value string) (int, error) {
	if value == "" {
		return 0, nil
	}
	return strconv.Atoi(value)
}

func pageLimit(value int) int  { limit, _ := pageBounds(value, 0); return limit }
func pageOffset(value int) int { _, offset := pageBounds(1, value); return offset }

func writeError(c *gin.Context, status int, code, message string) {
	c.JSON(status, gin.H{"error": gin.H{"code": code, "message": message}})
}
