from fastapi import FastAPI

from app.api.router import router


def create_app() -> FastAPI:
    application = FastAPI(
        title="LostLink Internal AI",
        version="0.1.0",
        description=(
            "Internal computation service. Similarity outputs assist discovery "
            "and never prove ownership."
        ),
        docs_url=None,
        redoc_url=None,
        openapi_url=None,
    )
    application.include_router(router)
    return application


app = create_app()
