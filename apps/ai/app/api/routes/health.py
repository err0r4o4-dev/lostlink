from fastapi import APIRouter

from app.schemas.health import HealthResponse

router = APIRouter(tags=["operations"])


@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    """Return process liveness without loading model weights."""
    return HealthResponse(status="ok", service="ai")
