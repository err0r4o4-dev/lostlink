package claim

import (
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/err0r4o4-dev/lostlink/apps/api/internal/auth"
	"github.com/gin-gonic/gin"
)

type HTTPHandler struct{ service *Service }

func RegisterRoutes(v1 *gin.RouterGroup, service *Service, authService *auth.Service) {
	handler := &HTTPHandler{service: service}
	authenticated := auth.RequireRoles(authService, auth.RoleUser, auth.RoleStaff, auth.RoleAdmin)
	v1.POST("/claims", authenticated, handler.create)
	v1.GET("/claims/mine", authenticated, handler.mine)
	v1.GET("/claims/:claimID", authenticated, handler.byID)
	v1.POST("/claims/:claimID/evidence", authenticated, handler.addEvidence)
	v1.DELETE("/claims/:claimID/evidence/:evidenceID", authenticated, handler.deleteEvidence)
	v1.GET("/claims/:claimID/evidence/:evidenceID/content", authenticated, handler.evidenceContent)
	v1.POST("/claims/:claimID/responses", authenticated, handler.respond)
	v1.POST("/claims/:claimID/submit", authenticated, handler.submit)
	v1.POST("/claims/:claimID/cancel", authenticated, handler.cancel)
}

func RegisterStaffRoutes(router *gin.RouterGroup, service *Service, authService *auth.Service) {
	handler := &HTTPHandler{service: service}
	staff := auth.RequireRoles(authService, auth.RoleStaff, auth.RoleAdmin)
	router.GET("/claims", staff, handler.staffList)
	router.GET("/claims/:claimID", staff, handler.byID)
	router.POST("/claims/:claimID/decisions", staff, handler.decide)
}

func (handler *HTTPHandler) create(c *gin.Context) {
	var request struct {
		MatchID string `json:"match_id" binding:"required"`
	}
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, 8<<10)
	if err := c.ShouldBindJSON(&request); err != nil {
		writeHTTPError(c, http.StatusBadRequest, "validation_failed", "Request validation failed")
		return
	}
	value, err := handler.service.Create(c.Request.Context(), auth.PrincipalFrom(c).ID, request.MatchID, c.GetHeader("Idempotency-Key"))
	if handler.writeError(c, err) {
		return
	}
	c.JSON(http.StatusCreated, gin.H{"claim": decorateClaim(value)})
}

func (handler *HTTPHandler) mine(c *gin.Context) {
	limit, limitErr := optionalInt(c.Query("limit"))
	offset, offsetErr := optionalInt(c.Query("offset"))
	if limitErr != nil || offsetErr != nil {
		writeHTTPError(c, http.StatusBadRequest, "validation_failed", "Pagination parameters are invalid")
		return
	}
	values, err := handler.service.Mine(c.Request.Context(), auth.PrincipalFrom(c).ID, limit, offset)
	if handler.writeError(c, err) {
		return
	}
	claims := make([]Claim, len(values))
	for index, value := range values {
		claims[index] = decorateClaim(value)
	}
	boundedLimit, boundedOffset := pageBounds(limit, offset)
	c.JSON(http.StatusOK, gin.H{"claims": claims, "pagination": gin.H{"limit": boundedLimit, "offset": boundedOffset}})
}

func (handler *HTTPHandler) byID(c *gin.Context) {
	value, err := handler.service.ByID(c.Request.Context(), auth.PrincipalFrom(c), c.Param("claimID"))
	if handler.writeError(c, err) {
		return
	}
	c.JSON(http.StatusOK, gin.H{"claim": decorateClaim(value)})
}

func (handler *HTTPHandler) addEvidence(c *gin.Context) {
	if strings.HasPrefix(c.GetHeader("Content-Type"), "multipart/form-data") {
		c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, 9<<20)
		description := c.PostForm("description")
		fileHeader, err := c.FormFile("image")
		if err != nil {
			writeHTTPError(c, http.StatusBadRequest, "validation_failed", "A JPEG or PNG evidence image is required")
			return
		}
		file, err := fileHeader.Open()
		if err != nil {
			writeHTTPError(c, http.StatusBadRequest, "validation_failed", "The evidence image could not be read")
			return
		}
		defer file.Close()
		value, err := handler.service.AddImage(c.Request.Context(), auth.PrincipalFrom(c).ID, c.Param("claimID"), description, file)
		if handler.writeError(c, err) {
			return
		}
		value.ContentURL = evidenceURL(c.Param("claimID"), value.ID)
		c.JSON(http.StatusCreated, gin.H{"evidence": value})
		return
	}
	var request struct {
		Description string `json:"description" binding:"required"`
	}
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, 8<<10)
	if err := c.ShouldBindJSON(&request); err != nil {
		writeHTTPError(c, http.StatusBadRequest, "validation_failed", "Request validation failed")
		return
	}
	value, err := handler.service.AddStatement(c.Request.Context(), auth.PrincipalFrom(c).ID, c.Param("claimID"), request.Description)
	if handler.writeError(c, err) {
		return
	}
	c.JSON(http.StatusCreated, gin.H{"evidence": value})
}

func (handler *HTTPHandler) respond(c *gin.Context) {
	var request struct {
		Description string `json:"description" binding:"required"`
	}
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, 8<<10)
	if err := c.ShouldBindJSON(&request); err != nil {
		writeHTTPError(c, http.StatusBadRequest, "validation_failed", "Request validation failed")
		return
	}
	value, err := handler.service.Respond(c.Request.Context(), auth.PrincipalFrom(c).ID, c.Param("claimID"), request.Description)
	if handler.writeError(c, err) {
		return
	}
	c.JSON(http.StatusCreated, gin.H{"evidence": value})
}

func (handler *HTTPHandler) deleteEvidence(c *gin.Context) {
	err := handler.service.DeleteEvidence(c.Request.Context(), auth.PrincipalFrom(c).ID, c.Param("claimID"), c.Param("evidenceID"))
	if handler.writeError(c, err) {
		return
	}
	c.Status(http.StatusNoContent)
}

func (handler *HTTPHandler) evidenceContent(c *gin.Context) {
	object, value, err := handler.service.EvidenceContent(c.Request.Context(), auth.PrincipalFrom(c), c.Param("claimID"), c.Param("evidenceID"))
	if handler.writeError(c, err) {
		return
	}
	defer object.Body.Close()
	c.Header("Cache-Control", "private, no-store")
	c.Header("X-Content-Type-Options", "nosniff")
	contentType := "application/octet-stream"
	size := object.Size
	if value.ContentType != nil {
		contentType = *value.ContentType
	}
	if value.SizeBytes != nil {
		size = *value.SizeBytes
	}
	c.DataFromReader(http.StatusOK, size, contentType, object.Body, nil)
}

func (handler *HTTPHandler) submit(c *gin.Context) {
	value, err := handler.service.Submit(c.Request.Context(), auth.PrincipalFrom(c).ID, c.Param("claimID"))
	if handler.writeError(c, err) {
		return
	}
	c.JSON(http.StatusOK, gin.H{"claim": decorateClaim(value)})
}

func (handler *HTTPHandler) cancel(c *gin.Context) {
	value, err := handler.service.Cancel(c.Request.Context(), auth.PrincipalFrom(c).ID, c.Param("claimID"))
	if handler.writeError(c, err) {
		return
	}
	c.JSON(http.StatusOK, gin.H{"claim": decorateClaim(value)})
}

func (handler *HTTPHandler) staffList(c *gin.Context) {
	limit, limitErr := optionalInt(c.Query("limit"))
	offset, offsetErr := optionalInt(c.Query("offset"))
	if limitErr != nil || offsetErr != nil {
		writeHTTPError(c, http.StatusBadRequest, "validation_failed", "Pagination parameters are invalid")
		return
	}
	values, err := handler.service.StaffList(c.Request.Context(), Status(c.Query("status")), limit, offset)
	if handler.writeError(c, err) {
		return
	}
	boundedLimit, boundedOffset := pageBounds(limit, offset)
	c.JSON(http.StatusOK, gin.H{"claims": values, "pagination": gin.H{"limit": boundedLimit, "offset": boundedOffset}})
}

func (handler *HTTPHandler) decide(c *gin.Context) {
	var request struct {
		Action Action `json:"action" binding:"required"`
		Reason string `json:"reason"`
	}
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, 8<<10)
	if err := c.ShouldBindJSON(&request); err != nil {
		writeHTTPError(c, http.StatusBadRequest, "validation_failed", "Request validation failed")
		return
	}
	value, err := handler.service.Decide(c.Request.Context(), auth.PrincipalFrom(c).ID, c.Param("claimID"), request.Action, request.Reason)
	if handler.writeError(c, err) {
		return
	}
	c.JSON(http.StatusOK, gin.H{"claim": decorateClaim(value)})
}

func (handler *HTTPHandler) writeError(c *gin.Context, err error) bool {
	if err == nil {
		return false
	}
	switch {
	case errors.Is(err, ErrInvalid):
		writeHTTPError(c, http.StatusUnprocessableEntity, "validation_failed", "Request fields are invalid")
	case errors.Is(err, ErrNotFound):
		writeHTTPError(c, http.StatusNotFound, "not_found", "Claim or evidence not found")
	case errors.Is(err, ErrConflict):
		writeHTTPError(c, http.StatusConflict, "claim_exists", "A claim already exists for this match")
	case errors.Is(err, ErrIdempotencyConflict):
		writeHTTPError(c, http.StatusConflict, "idempotency_conflict", "Idempotency-Key was reused for another claim")
	case errors.Is(err, ErrInvalidState):
		writeHTTPError(c, http.StatusConflict, "invalid_state", "The claim state does not allow this action")
	case errors.Is(err, ErrEvidenceRequired):
		writeHTTPError(c, http.StatusConflict, "evidence_required", "Add ownership evidence before submitting the claim")
	case errors.Is(err, ErrEvidenceLimit):
		writeHTTPError(c, http.StatusConflict, "evidence_limit_reached", "A claim may contain at most ten evidence records")
	case errors.Is(err, ErrStorageUnavailable):
		writeHTTPError(c, http.StatusServiceUnavailable, "storage_unavailable", "Evidence storage is temporarily unavailable")
	default:
		writeHTTPError(c, http.StatusInternalServerError, "internal_error", "The request could not be completed")
	}
	return true
}

func decorateClaim(value Claim) Claim {
	for index := range value.Evidence {
		if value.Evidence[index].ObjectKey != nil {
			value.Evidence[index].ContentURL = evidenceURL(value.ID, value.Evidence[index].ID)
		}
	}
	return value
}

func evidenceURL(claimID, evidenceID string) string {
	return fmt.Sprintf("/v1/claims/%s/evidence/%s/content", claimID, evidenceID)
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
