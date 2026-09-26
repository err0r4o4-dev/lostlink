import json
import logging
import os
import urllib.error
import urllib.request
from typing import Any

from pydantic import ValidationError

from app.schemas.chat import ChatRequest, ChatResponse

logger = logging.getLogger(__name__)

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "openrouter")
LLM_API_KEY = os.getenv("LLM_API_KEY", "")
LLM_MODEL = os.getenv("LLM_MODEL", "anthropic/claude-3.5-haiku")
LLM_BASE_URL = os.getenv("LLM_BASE_URL", "https://openrouter.ai/api/v1")
MAX_PROVIDER_RESPONSE_BYTES = 1 << 20

SYSTEM_PROMPT = """
คุณคือผู้ช่วย AI ประจำระบบ LostLink (แพลตฟอร์มแจ้งของหายและตามหาของ)
หน้าที่ของคุณ:
1. ช่วยคัดกรองข้อมูลจากผู้ใช้ เช่น สี รุ่น วันที่หาย สถานที่
2. ให้คำแนะนำผู้ใช้ในการให้ข้อมูลเพิ่มเติมที่เป็นประโยชน์
3. ห้ามยืนยันความเป็นเจ้าของ ให้ระบุเพียงว่ารายการมีโอกาสตรงกันและต้องให้เจ้าหน้าที่ตรวจสอบ
4. ตอบด้วยข้อความสั้นกระชับ สุภาพ เป็นภาษาไทย

คืนค่า JSON เท่านั้น ห้ามมี Markdown หรือข้อความอื่นปน โดยใช้รูปแบบนี้:
{
  "reply": "ข้อความตอบกลับผู้ใช้",
  "generated_title": "หัวข้อสั้นไม่เกิน 5 คำ หรือ null",
  "analysis": {
    "extracted_keywords": ["คีย์เวิร์ดสำคัญ"],
    "reasoning": "เหตุผลสั้นๆ ที่สรุปใจความ",
    "matched_item_ids": [],
    "confidence_score": 0.85
  }
}
""".strip()


class ChatGenerationError(RuntimeError):
    """Raised when the configured provider cannot return a valid chat response."""


def _provider_request(messages: list[dict[str, str]]) -> urllib.request.Request:
    provider = LLM_PROVIDER.lower()
    if provider == "anthropic":
        url = f"{LLM_BASE_URL.rstrip('/')}/messages"
        headers = {
            "x-api-key": LLM_API_KEY,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        }
        data: dict[str, Any] = {
            "model": LLM_MODEL,
            "max_tokens": 1024,
            "system": SYSTEM_PROMPT,
            "messages": messages,
            "temperature": 0.2,
        }
    else:
        url = f"{LLM_BASE_URL.rstrip('/')}/chat/completions"
        headers = {
            "Authorization": f"Bearer {LLM_API_KEY}",
            "Content-Type": "application/json",
        }
        if "openrouter" in LLM_BASE_URL.lower():
            headers["HTTP-Referer"] = "http://localhost:8088"
            headers["X-Title"] = "LostLink"

        data = {
            "model": LLM_MODEL,
            "messages": [{"role": "system", "content": SYSTEM_PROMPT}, *messages],
            "temperature": 0.2,
            "stream": False,
        }
        if "openrouter" not in LLM_BASE_URL.lower():
            data["response_format"] = {"type": "json_object"}

    return urllib.request.Request(
        url,
        data=json.dumps(data, ensure_ascii=False).encode(),
        headers=headers,
        method="POST",
    )


def _extract_stream_text(raw_body: str) -> str:
    parts: list[str] = []
    for line in raw_body.splitlines():
        if not line.startswith("data: ") or line == "data: [DONE]":
            continue
        try:
            chunk = json.loads(line[6:])
            if LLM_PROVIDER.lower() == "anthropic":
                text = chunk.get("delta", {}).get("text", "")
            else:
                choices = chunk.get("choices", [])
                text = choices[0].get("delta", {}).get("content", "") if choices else ""
        except (AttributeError, IndexError, TypeError, json.JSONDecodeError):
            continue
        if isinstance(text, str):
            parts.append(text)

    result = "".join(parts)
    if not result:
        raise ChatGenerationError("provider stream did not contain a response")
    return result


def _extract_provider_text(raw_body: str) -> str:
    try:
        payload = json.loads(raw_body)
    except json.JSONDecodeError as exc:
        if raw_body.startswith("data:"):
            return _extract_stream_text(raw_body)
        raise ChatGenerationError("provider returned invalid JSON") from exc

    try:
        if LLM_PROVIDER.lower() == "anthropic":
            text = payload["content"][0]["text"]
        else:
            text = payload["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError) as exc:
        raise ChatGenerationError("provider response was missing content") from exc
    if not isinstance(text, str) or not text.strip():
        raise ChatGenerationError("provider returned empty content")
    return text


def _parse_chat_response(ai_text: str, is_first_message: bool) -> ChatResponse:
    cleaned = ai_text.strip()
    if cleaned.startswith("```json"):
        cleaned = cleaned.removeprefix("```json").rstrip("`\n ")
    elif cleaned.startswith("```"):
        cleaned = cleaned.removeprefix("```").rstrip("`\n ")

    try:
        payload = json.loads(cleaned)
        response = ChatResponse.model_validate(payload)
    except (json.JSONDecodeError, ValidationError) as exc:
        raise ChatGenerationError("provider returned an invalid chat response") from exc

    response.reply = response.reply.strip()
    if not response.reply:
        raise ChatGenerationError("provider returned an empty reply")
    if not is_first_message:
        response.generated_title = None
    return response


def generate_chat_response(request: ChatRequest) -> ChatResponse:
    if not LLM_API_KEY:
        raise ChatGenerationError("LLM provider is not configured")

    user_message_count = sum(message.role == "user" for message in request.messages)
    messages = [
        {
            "role": "assistant" if message.role == "ai" else "user",
            "content": message.content,
        }
        for message in request.messages
    ]
    provider_request = _provider_request(messages)

    try:
        with urllib.request.urlopen(provider_request, timeout=30.0) as response:
            raw_bytes = response.read(MAX_PROVIDER_RESPONSE_BYTES + 1)
    except urllib.error.HTTPError as exc:
        logger.warning("LLM provider returned HTTP status %s", exc.code)
        raise ChatGenerationError("LLM provider rejected the request") from exc
    except (TimeoutError, urllib.error.URLError, OSError) as exc:
        logger.warning("LLM provider request failed: %s", type(exc).__name__)
        raise ChatGenerationError("LLM provider could not be reached") from exc

    if len(raw_bytes) > MAX_PROVIDER_RESPONSE_BYTES:
        raise ChatGenerationError("LLM provider response exceeded the size limit")
    try:
        raw_body = raw_bytes.decode("utf-8")
    except UnicodeDecodeError as exc:
        raise ChatGenerationError("LLM provider returned invalid text") from exc

    ai_text = _extract_provider_text(raw_body)
    return _parse_chat_response(ai_text, is_first_message=user_message_count == 1)
