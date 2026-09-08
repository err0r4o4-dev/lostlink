FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app
COPY apps/ai/pyproject.toml apps/ai/README.md ./
COPY apps/ai/app ./app
RUN python -m pip install .
RUN useradd --create-home --uid 10001 lostlink && chown -R lostlink:lostlink /app
USER lostlink
EXPOSE 8000
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
