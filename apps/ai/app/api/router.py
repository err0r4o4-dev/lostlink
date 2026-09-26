from fastapi import APIRouter

from app.api.routes.embeddings import router as embeddings_router
from app.api.routes.health import router as health_router
from app.api.routes.chat import router as chat_router

router = APIRouter()
router.include_router(health_router)
router.include_router(embeddings_router)
router.include_router(chat_router)
