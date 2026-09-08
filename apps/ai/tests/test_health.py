from fastapi.testclient import TestClient

from app.main import app


def test_health() -> None:
    response = TestClient(app).get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "ai"}


def test_public_schema_is_disabled() -> None:
    response = TestClient(app).get("/openapi.json")

    assert response.status_code == 404
