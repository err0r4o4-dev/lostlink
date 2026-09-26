import json

from fastapi.testclient import TestClient

from app.main import app
from app.services import llm

client = TestClient(app)
service_headers = {"X-LostLink-Service-Token": "replace-me-internal-service-token"}
request_payload = {
    "messages": [{"role": "user", "content": "I lost a black wallet"}],
    "session_id": "11111111-1111-4111-8111-111111111111",
}


class FakeProviderResponse:
    def __init__(self, payload: dict[str, object]) -> None:
        self.body = json.dumps(payload).encode()

    def __enter__(self) -> "FakeProviderResponse":
        return self

    def __exit__(self, *_: object) -> None:
        return None

    def read(self, _: int) -> bytes:
        return self.body


def test_chat_requires_internal_service_token() -> None:
    response = client.post("/chat/generate", json=request_payload)

    assert response.status_code == 401


def test_chat_rejects_invalid_service_token() -> None:
    response = client.post(
        "/chat/generate",
        headers={"X-LostLink-Service-Token": "invalid-token"},
        json=request_payload,
    )

    assert response.status_code == 401


def test_chat_returns_service_unavailable_when_provider_is_not_configured(
    monkeypatch,
) -> None:
    monkeypatch.setattr(llm, "LLM_API_KEY", "")

    response = client.post(
        "/chat/generate",
        headers=service_headers,
        json=request_payload,
    )

    assert response.status_code == 503
    assert response.json() == {"detail": "AI service temporarily unavailable"}


def test_chat_returns_valid_provider_response(monkeypatch) -> None:
    provider_payload = {
        "choices": [
            {
                "message": {
                    "content": json.dumps(
                        {
                            "reply": "Please add the location where it was lost.",
                            "generated_title": "Black wallet",
                            "analysis": {
                                "extracted_keywords": ["black", "wallet"],
                                "reasoning": "The user is reporting a lost wallet.",
                                "matched_item_ids": [],
                                "confidence_score": 0.8,
                            },
                        }
                    )
                }
            }
        ]
    }
    monkeypatch.setattr(llm, "LLM_API_KEY", "test-provider-key")
    monkeypatch.setattr(llm, "LLM_PROVIDER", "openrouter")
    monkeypatch.setattr(
        llm.urllib.request,
        "urlopen",
        lambda *_args, **_kwargs: FakeProviderResponse(provider_payload),
    )

    response = client.post(
        "/chat/generate",
        headers=service_headers,
        json=request_payload,
    )

    assert response.status_code == 200
    assert response.json()["reply"] == "Please add the location where it was lost."
    assert response.json()["generated_title"] == "Black wallet"
