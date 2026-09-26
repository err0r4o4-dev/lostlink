import logging

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.dependencies import require_service_token
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.llm import ChatGenerationError, generate_chat_response

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chat", tags=["chat"])


@router.post(
    "/generate",
    response_model=ChatResponse,
    dependencies=[Depends(require_service_token)],
)
def generate_chat(request: ChatRequest) -> ChatResponse:
    """Generate a bounded response for an authenticated Go API request."""
    try:
        return generate_chat_response(request)
    except ChatGenerationError as exc:
        logger.warning("Chat generation unavailable: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service temporarily unavailable",
        ) from exc
    except Exception as exc:
        logger.exception("Unexpected chat generation error")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal AI error during chat generation",
        ) from exc
