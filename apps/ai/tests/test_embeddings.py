import math

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)
headers = {"X-LostLink-Service-Token": "replace-me-internal-service-token"}


def test_embeddings_require_internal_service_token() -> None:
    response = client.post(
        "/internal/v1/embeddings",
        json={"items": [{"id": "report-1", "text": "Black bottle near library"}]},
    )

    assert response.status_code == 401


def test_embeddings_are_deterministic_and_versioned() -> None:
    payload = {
        "items": [
            {"id": "report-1", "text": "Black bottle near library"},
            {"id": "report-2", "text": "Black bottle found at library"},
        ]
    }

    first = client.post("/internal/v1/embeddings", headers=headers, json=payload)
    second = client.post("/internal/v1/embeddings", headers=headers, json=payload)

    assert first.status_code == 200
    assert first.json() == second.json()
    body = first.json()
    assert body["model_version"] == "bootstrap-hash-embedding-v1"
    assert body["config_version"] == "public-safe-32d-v1"
    assert len(body["items"][0]["vector"]) == 32
    assert math.isclose(
        sum(value * value for value in body["items"][0]["vector"]),
        1.0,
        rel_tol=1e-6,
    )


def test_embeddings_reject_oversized_text() -> None:
    response = client.post(
        "/internal/v1/embeddings",
        headers=headers,
        json={"items": [{"id": "report-1", "text": "x" * 4001}]},
    )

    assert response.status_code == 422
