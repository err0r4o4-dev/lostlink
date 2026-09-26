package aichat

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestHTTPHandlerWritesRetryableAIErrorWithoutInternalDetails(t *testing.T) {
	gin.SetMode(gin.TestMode)
	recorder := httptest.NewRecorder()
	context, _ := gin.CreateTestContext(recorder)
	context.Request = httptest.NewRequest(http.MethodPost, "/v1/chats/session/messages", nil)

	handler := &HTTPHandler{}
	if !handler.writeError(context, ErrAIUnavailable) {
		t.Fatal("expected error response")
	}
	if recorder.Code != http.StatusServiceUnavailable {
		t.Fatalf("status = %d; want %d", recorder.Code, http.StatusServiceUnavailable)
	}
	body := recorder.Body.String()
	for _, expected := range []string{"ai_temporarily_unavailable", "not sent or saved"} {
		if !strings.Contains(body, expected) {
			t.Fatalf("response %q does not contain %q", body, expected)
		}
	}
}

func TestBindTurnRejectsInvalidClientTurnID(t *testing.T) {
	gin.SetMode(gin.TestMode)
	recorder := httptest.NewRecorder()
	context, _ := gin.CreateTestContext(recorder)
	context.Request = httptest.NewRequest(
		http.MethodPost,
		"/v1/chats",
		strings.NewReader(`{"message":"Find my keys","client_turn_id":"not-a-uuid"}`),
	)
	context.Request.Header.Set("Content-Type", "application/json")

	_, _, ok := bindTurn(context)
	if ok || recorder.Code != http.StatusBadRequest || !strings.Contains(recorder.Body.String(), "validation_failed") {
		t.Fatalf("ok=%v status=%d body=%s", ok, recorder.Code, recorder.Body.String())
	}
}

func TestHTTPHandlerWritesRetryableHistoryChangedConflict(t *testing.T) {
	gin.SetMode(gin.TestMode)
	recorder := httptest.NewRecorder()
	context, _ := gin.CreateTestContext(recorder)
	context.Request = httptest.NewRequest(http.MethodPost, "/v1/chats/session/messages", nil)

	handler := &HTTPHandler{}
	if !handler.writeError(context, ErrHistoryChanged) {
		t.Fatal("expected error response")
	}
	if recorder.Code != http.StatusConflict || !strings.Contains(recorder.Body.String(), "chat_history_changed") {
		t.Fatalf("status=%d body=%s", recorder.Code, recorder.Body.String())
	}
}
