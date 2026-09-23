import hmac
import os

from fastapi import APIRouter, Depends, Header, HTTPException, status

from app.schemas.embeddings import EmbeddingRequest, EmbeddingResponse
from app.services.embeddings import embed_items

router = APIRouter(prefix="/internal/v1", tags=["internal-matching"])


def require_service_token(
    x_lostlink_service_token: str | None = Header(default=None),
) -> None:
    expected = os.getenv("AI_SERVICE_TOKEN", "replace-me-internal-service-token")
    if x_lostlink_service_token is None or not hmac.compare_digest(
        x_lostlink_service_token.encode(), expected.encode()
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Service authentication required",
        )


@router.post("/embeddings", response_model=EmbeddingResponse)
async def embeddings(
    request: EmbeddingRequest,
    _: None = Depends(require_service_token),
) -> EmbeddingResponse:
    """Return a bounded deterministic baseline vector for approved public-safe text."""
    return embed_items(request.items)
