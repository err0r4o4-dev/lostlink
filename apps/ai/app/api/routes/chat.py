from fastapi import APIRouter, HTTPException
from pydantic import ValidationError
import logging

from app.schemas.chat import ChatRequest, ChatResponse
from app.services.llm import generate_chat_response

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/generate", response_model=ChatResponse)
def generate_chat(request: ChatRequest) -> ChatResponse:
    """
    Generate a response from the LLM based on the conversation history.
    Also returns a generated title (if applicable) and analysis metadata.
    """
    try:
        response = generate_chat_response(request)
        return response
    except ValidationError as e:
        logger.error(f"Validation error in chat generation: {e}")
        raise HTTPException(status_code=422, detail="Invalid request format")
    except Exception as e:
        logger.error(f"Error in chat generation: {e}")
        raise HTTPException(status_code=500, detail="Internal AI error during chat generation")
