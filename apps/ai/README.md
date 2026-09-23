# LostLink AI service

This internal FastAPI service exposes `GET /health` and authenticated
`POST /internal/v1/embeddings`. The embedding endpoint accepts bounded
public-safe text selected by Go and returns versioned deterministic baseline
vectors. Set the same `AI_SERVICE_TOKEN` in Go and this service; callers send it
as `X-LostLink-Service-Token`.

The optional `ml` dependency group remains excluded from the default install,
so model weights and heavyweight runtimes are not downloaded. The current
baseline exercises the integration and pgvector retrieval boundary but is not a
production semantic or multimodal model.

```bash
python -m pip install -e ".[dev]"
python -m ruff check .
python -m pytest
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

The Go API is the only application-facing backend; do not publish this service directly.
