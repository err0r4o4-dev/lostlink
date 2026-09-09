# LostLink AI service

This internal FastAPI service currently exposes only `GET /health`. Embedding, ranking, explainability, and evaluation modules are reserved for later `AI-xx` tasks. The optional `ml` dependency group is deliberately excluded from bootstrap installs so model weights and heavyweight runtimes are not downloaded.

```bash
python -m pip install -e ".[dev]"
python -m ruff check .
python -m pytest
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

The Go API is the only application-facing backend; do not publish this service directly.
