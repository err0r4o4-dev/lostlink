from fastapi import APIRouter, Depends

from app.api.dependencies import require_service_token
from app.schemas.embeddings import EmbeddingRequest, EmbeddingResponse
from app.services.embeddings import embed_items

router = APIRouter(prefix="/internal/v1", tags=["internal-matching"])

@router.post("/embeddings", response_model=EmbeddingResponse)
async def embeddings(
    request: EmbeddingRequest,
    _: None = Depends(require_service_token),
) -> EmbeddingResponse:
    """Return a bounded deterministic baseline vector for approved public-safe text."""
    return embed_items(request.items)
