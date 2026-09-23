package report

import (
	"errors"
	"fmt"
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
	router.PATCH("/:reportID", authenticated, handler.update)
	router.POST("/:reportID/withdraw", authenticated, handler.withdraw)
	router.GET("/:reportID/images", handler.images)
	router.POST("/:reportID/images", authenticated, handler.addImage)
	router.GET("/:reportID/images/:imageID", handler.imageContent)
	router.DELETE("/:reportID/images/:imageID", authenticated, handler.deleteImage)
	router.GET("/:reportID", handler.byID)
}

func RegisterStaffRoutes(router *gin.RouterGroup, service *Service, authService *auth.Service) {
	handler := &HTTPHandler{service: service}
	staff := auth.RequireRoles(authService, auth.RoleStaff, auth.RoleAdmin)
	router.GET("/reports", staff, handler.staffList)
	router.POST("/reports/:reportID/moderation-actions", staff, handler.moderate)
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

func (handler *HTTPHandler) update(c *gin.Context) {
	var input UpdateInput
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, 16<<10)
	if err := c.ShouldBindJSON(&input); err != nil {
		writeError(c, http.StatusBadRequest, "validation_failed", "Request validation failed")
		return
	}
	value, err := handler.service.Update(c.Request.Context(), auth.PrincipalFrom(c).ID, c.Param("reportID"), input)
	if handler.writeServiceError(c, err) {
		return
	}
	c.JSON(http.StatusOK, gin.H{"report": value})
}

func (handler *HTTPHandler) withdraw(c *gin.Context) {
	value, err := handler.service.Withdraw(c.Request.Context(), auth.PrincipalFrom(c).ID, c.Param("reportID"))
	if handler.writeServiceError(c, err) {
		return
	}
	c.JSON(http.StatusOK, gin.H{"report": value})
}

func (handler *HTTPHandler) images(c *gin.Context) {
	values, err := handler.service.Images(c.Request.Context(), c.Param("reportID"))
	if handler.writeServiceError(c, err) {
		return
	}
	images := make([]gin.H, 0, len(values))
	for _, value := range values {
		images = append(images, imageResponse(c.Param("reportID"), value))
	}
	c.JSON(http.StatusOK, gin.H{"images": images})
}

func (handler *HTTPHandler) addImage(c *gin.Context) {
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, 9<<20)
	fileHeader, err := c.FormFile("image")
	if err != nil {
		writeError(c, http.StatusBadRequest, "validation_failed", "A JPEG or PNG image is required")
		return
	}
	file, err := fileHeader.Open()
	if err != nil {
		writeError(c, http.StatusBadRequest, "validation_failed", "The image could not be read")
		return
	}
	defer file.Close()
	value, err := handler.service.AddImage(c.Request.Context(), auth.PrincipalFrom(c).ID, c.Param("reportID"), file)
	if handler.writeServiceError(c, err) {
		return
	}
	c.JSON(http.StatusCreated, gin.H{"image": imageResponse(c.Param("reportID"), value)})
}

func (handler *HTTPHandler) deleteImage(c *gin.Context) {
	err := handler.service.DeleteImage(c.Request.Context(), auth.PrincipalFrom(c).ID, c.Param("reportID"), c.Param("imageID"))
	if handler.writeServiceError(c, err) {
		return
	}
	c.Status(http.StatusNoContent)
}

func (handler *HTTPHandler) imageContent(c *gin.Context) {
	object, metadata, err := handler.service.ImageContent(c.Request.Context(), c.Param("reportID"), c.Param("imageID"))
	if handler.writeServiceError(c, err) {
		return
	}
	defer object.Body.Close()
	c.Header("Cache-Control", "public, max-age=300")
	c.Header("X-Content-Type-Options", "nosniff")
	c.DataFromReader(http.StatusOK, metadata.SizeBytes, metadata.ContentType, object.Body, nil)
}

func (handler *HTTPHandler) staffList(c *gin.Context) {
	limit, limitErr := optionalInt(c.Query("limit"))
	offset, offsetErr := optionalInt(c.Query("offset"))
	if limitErr != nil || offsetErr != nil {
		writeError(c, http.StatusBadRequest, "validation_failed", "Pagination parameters are invalid")
		return
	}
	values, err := handler.service.StaffList(c.Request.Context(), Status(c.Query("status")), limit, offset)
	if handler.writeServiceError(c, err) {
		return
	}
	c.JSON(http.StatusOK, gin.H{"reports": values, "pagination": gin.H{"limit": pageLimit(limit), "offset": pageOffset(offset)}})
}

func (handler *HTTPHandler) moderate(c *gin.Context) {
	var request struct {
		Action ModerationAction `json:"action" binding:"required"`
	}
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, 4<<10)
	if err := c.ShouldBindJSON(&request); err != nil {
		writeError(c, http.StatusBadRequest, "validation_failed", "Request validation failed")
		return
	}
	value, err := handler.service.Moderate(c.Request.Context(), auth.PrincipalFrom(c).ID, c.Param("reportID"), request.Action)
	if handler.writeServiceError(c, err) {
		return
	}
	c.JSON(http.StatusOK, gin.H{"report": value})
}

func (handler *HTTPHandler) writeServiceError(c *gin.Context, err error) bool {
	if err == nil {
		return false
	}
	switch {
	case errors.Is(err, ErrInvalid):
		writeError(c, http.StatusUnprocessableEntity, "validation_failed", "Request fields are invalid")
	case errors.Is(err, ErrNotFound):
		writeError(c, http.StatusNotFound, "not_found", "Report or image not found")
	case errors.Is(err, ErrInvalidState):
		writeError(c, http.StatusConflict, "invalid_state", "The report state does not allow this action")
	case errors.Is(err, ErrTooManyImages):
		writeError(c, http.StatusConflict, "image_limit_reached", "A report may contain at most five images")
	case errors.Is(err, ErrStorageUnavailable):
		writeError(c, http.StatusServiceUnavailable, "storage_unavailable", "Image storage is temporarily unavailable")
	default:
		writeError(c, http.StatusInternalServerError, "internal_error", "The request could not be completed")
	}
	return true
}

func imageResponse(reportID string, value Image) gin.H {
	return gin.H{
		"id": value.ID, "content_type": value.ContentType, "size_bytes": value.SizeBytes,
		"width": value.Width, "height": value.Height, "is_primary": value.IsPrimary,
		"created_at": value.CreatedAt, "content_url": fmt.Sprintf("/v1/reports/%s/images/%s", reportID, value.ID),
	}
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
