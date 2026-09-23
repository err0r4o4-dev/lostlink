package tracking

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
	v1.GET("/tracking/:reference", authenticated, handler.timeline)
	v1.GET("/return-arrangements/:returnID", authenticated, handler.byID)
}

func RegisterStaffRoutes(router *gin.RouterGroup, service *Service, authService *auth.Service) {
	handler := &HTTPHandler{service: service}
	staff := auth.RequireRoles(authService, auth.RoleStaff, auth.RoleAdmin)
	router.GET("/returns", staff, handler.staffList)
	router.POST("/claims/:claimID/return-arrangements", staff, handler.create)
	router.POST("/return-arrangements/:returnID/schedule", staff, handler.schedule)
	router.POST("/return-arrangements/:returnID/confirm-pickup", staff, handler.transition(TransitionPickup))
	router.POST("/return-arrangements/:returnID/complete", staff, handler.transition(TransitionComplete))
	router.POST("/return-arrangements/:returnID/close", staff, handler.transition(TransitionClose))
	router.POST("/return-arrangements/:returnID/cancel", staff, handler.transition(TransitionCancel))
}

func (handler *HTTPHandler) timeline(c *gin.Context) {
	value, err := handler.service.Timeline(c.Request.Context(), auth.PrincipalFrom(c), c.Param("reference"))
	if handler.writeError(c, err) {
		return
	}
	c.JSON(http.StatusOK, gin.H{"timeline": value})
}

func (handler *HTTPHandler) byID(c *gin.Context) {
	value, err := handler.service.ByID(c.Request.Context(), auth.PrincipalFrom(c), c.Param("returnID"))
	if handler.writeError(c, err) {
		return
	}
	c.JSON(http.StatusOK, gin.H{"return_arrangement": value})
}

func (handler *HTTPHandler) create(c *gin.Context) {
	value, err := handler.service.Create(c.Request.Context(), auth.PrincipalFrom(c).ID, c.Param("claimID"))
	if handler.writeError(c, err) {
		return
	}
	c.JSON(http.StatusCreated, gin.H{"return_arrangement": value})
}

func (handler *HTTPHandler) staffList(c *gin.Context) {
	limit, limitErr := optionalInt(c.Query("limit"))
	offset, offsetErr := optionalInt(c.Query("offset"))
	if limitErr != nil || offsetErr != nil {
		writeHTTPError(c, http.StatusBadRequest, "validation_failed", "Pagination parameters are invalid")
		return
	}
	values, err := handler.service.StaffList(c.Request.Context(), ReturnStatus(c.Query("status")), limit, offset)
	if handler.writeError(c, err) {
		return
	}
	boundedLimit, boundedOffset := pageBounds(limit, offset)
	c.JSON(http.StatusOK, gin.H{"return_arrangements": values, "pagination": gin.H{"limit": boundedLimit, "offset": boundedOffset}})
}

func (handler *HTTPHandler) schedule(c *gin.Context) {
	var input ScheduleInput
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, 8<<10)
	if err := c.ShouldBindJSON(&input); err != nil {
		writeHTTPError(c, http.StatusBadRequest, "validation_failed", "Request validation failed")
		return
	}
	value, err := handler.service.Schedule(c.Request.Context(), auth.PrincipalFrom(c).ID, c.Param("returnID"), input)
	if handler.writeError(c, err) {
		return
	}
	c.JSON(http.StatusOK, gin.H{"return_arrangement": value})
}

func (handler *HTTPHandler) transition(action Transition) gin.HandlerFunc {
	return func(c *gin.Context) {
		value, err := handler.service.Transition(c.Request.Context(), auth.PrincipalFrom(c).ID, c.Param("returnID"), action)
		if handler.writeError(c, err) {
			return
		}
		c.JSON(http.StatusOK, gin.H{"return_arrangement": value})
	}
}

func (handler *HTTPHandler) writeError(c *gin.Context, err error) bool {
	if err == nil {
		return false
	}
	switch {
	case errors.Is(err, ErrInvalid):
		writeHTTPError(c, http.StatusUnprocessableEntity, "validation_failed", "Request fields are invalid")
	case errors.Is(err, ErrNotFound):
		writeHTTPError(c, http.StatusNotFound, "not_found", "Tracking resource not found")
	case errors.Is(err, ErrConflict):
		writeHTTPError(c, http.StatusConflict, "return_exists", "A return arrangement already exists for this claim")
	case errors.Is(err, ErrInvalidState):
		writeHTTPError(c, http.StatusConflict, "invalid_state", "The return state does not allow this action")
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
