import json
import logging
import os
import urllib.request
import urllib.error

from app.schemas.chat import ChatRequest, ChatResponse, ChatAnalysis

logger = logging.getLogger(__name__)

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "openrouter")
LLM_API_KEY = os.getenv("LLM_API_KEY", "")
LLM_MODEL = os.getenv("LLM_MODEL", "anthropic/claude-3.5-haiku")
LLM_BASE_URL = os.getenv("LLM_BASE_URL", "https://openrouter.ai/api/v1")

def generate_chat_response(request: ChatRequest) -> ChatResponse:
    if not request.messages:
        return ChatResponse(reply="I'm not sure what you're asking. How can I help?", generated_title=None, analysis=None)

    user_messages = [msg for msg in request.messages if msg.role == "user"]
    latest_query = user_messages[-1].content if user_messages else ""
    is_first_message = len(user_messages) == 1

    if not LLM_API_KEY:
        # Fallback Mock if no API key is provided
        logger.info("No LLM_API_KEY found, using intelligent mock.")
        title = f"ค้นหา: {latest_query[:20]}..." if is_first_message else None

        reply = f"ระบบได้รับแจ้งข้อมูล: '{latest_query}' แล้วครับ หากมีผู้พบของที่ลักษณะใกล้เคียง ระบบจะแสดงในการจัดอันดับ (AI ทำหน้าที่วิเคราะห์และค้นหาเบื้องต้นให้เท่านั้น การตัดสินใจความเป็นเจ้าของจะเป็นของทางเจ้าหน้าที่ครับ)\n\n*(หมายเหตุ: ต้องตั้งค่า LLM_API_KEY ในไฟล์ .env ของ AI Service เพื่อเปิดใช้งาน LLM จริง)*"

        return ChatResponse(
            reply=reply,
            generated_title=title,
            analysis=ChatAnalysis(
                extracted_keywords=[w for w in latest_query.split() if len(w) > 3][:3],
                reasoning="Fallback mock reasoning due to missing API key.",
                matched_item_ids=[],
                confidence_score=0.8
            )
        )

    # Prepare messages
    messages = []
    for msg in request.messages:
        role = "assistant" if msg.role == "ai" else "user"
        if msg.role == "system":
            continue
        messages.append({"role": role, "content": msg.content})

    system_prompt = """
    คุณคือผู้ช่วย AI ประจำระบบ LostLink (แพลตฟอร์มแจ้งของหายและตามหาของ)
    หน้าที่ของคุณ:
    1. ช่วยคัดกรองข้อมูลจากผู้ใช้ เช่น สี รุ่น วันที่หาย สถานที่
    2. ให้คำแนะนำผู้ใช้ในการให้ข้อมูลเพิ่มเติมที่เป็นประโยชน์
    3. สำคัญมาก: ห้ามยืนยันว่าของชิ้นนั้นเป็นของผู้ใช้แน่ๆ (ให้พูดว่า "มีโอกาสตรงกัน" หรือ "เดี๋ยวจะบันทึกข้อมูลไว้ให้เจ้าหน้าที่ตรวจสอบ")
    4. ตอบด้วยข้อความสั้นกระชับ สุภาพ เป็นภาษาไทย

    ให้คุณพิจารณาคำถามล่าสุด และคืนค่ากลับมาในรูปแบบ JSON ตาม Format ต่อไปนี้เท่านั้น ห้ามมี Markdown หรือ Text อื่นปน:
    {
      "reply": "ข้อความตอบกลับผู้ใช้",
      "generated_title": "หัวข้อแชทสั้นๆ ไม่เกิน 5 คำ (ใส่มาเฉพาะกรณีเป็นข้อความแรกเท่านั้น ถ้าไม่ใช่ให้ใส่ null)",
      "analysis": {
        "extracted_keywords": ["คีย์เวิร์ดที่สำคัญ", "เช่น สี", "ยี่ห้อ"],
        "reasoning": "เหตุผลสั้นๆ ที่ AI สรุปใจความ",
        "matched_item_ids": [],
        "confidence_score": 0.85
      }
    }
    """

    try:
        # Determine API logic based on provider
        if LLM_PROVIDER.lower() == "anthropic":
            url = f"{LLM_BASE_URL.rstrip('/')}/messages"
            headers = {
                "x-api-key": LLM_API_KEY,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json"
            }
            data = {
                "model": LLM_MODEL,
                "max_tokens": 1024,
                "system": system_prompt,
                "messages": messages,
                "temperature": 0.2
            }
        else:
            # Default to OpenAI-compatible API (e.g. OpenRouter, OpenAI, Ollama)
            url = f"{LLM_BASE_URL.rstrip('/')}/chat/completions"
            headers = {
                "Authorization": f"Bearer {LLM_API_KEY}",
                "Content-Type": "application/json",
            }

            # For OpenRouter specific routing/features, HTTP Referer is sometimes required
            if "openrouter" in LLM_BASE_URL:
                headers["HTTP-Referer"] = "http://localhost:8088"
                headers["X-Title"] = "LostLink"

            # Combine system prompt to messages
            openai_messages = [{"role": "system", "content": system_prompt}] + messages

            data = {
                "model": LLM_MODEL,
                "messages": openai_messages,
                "temperature": 0.2,
                "stream": False,
                "response_format": {"type": "json_object"} if "openrouter" not in LLM_BASE_URL else None
            }

        req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers=headers, method="POST")

        with urllib.request.urlopen(req, timeout=30.0) as resp:
            raw_body = resp.read().decode('utf-8')

            try:
                resp_data = json.loads(raw_body)
            except json.JSONDecodeError:
                # If it's a Server-Sent Events (SSE) stream, attempt to parse the chunks manually
                if raw_body.startswith("data:"):
                    chunks = [line for line in raw_body.split("\n") if line.startswith("data: ") and "[DONE]" not in line]
                    if chunks:
                        ai_text = ""
                        for chunk in chunks:
                            try:
                                chunk_data = json.loads(chunk[6:])
                                if LLM_PROVIDER.lower() == "anthropic":
                                    ai_text += chunk_data.get("delta", {}).get("text", "")
                                else:
                                    choices = chunk_data.get("choices", [])
                                    if choices and "delta" in choices[0]:
                                        ai_text += choices[0]["delta"].get("content", "")
                            except:
                                pass

                        if not ai_text:
                            raise Exception("Failed to extract content from stream")
                    else:
                        raise Exception("Empty stream response")
                else:
                    logger.error(f"Response is not JSON: {raw_body[:100]}")
                    raise Exception("Response is not JSON")
            else:
                if LLM_PROVIDER.lower() == "anthropic":
                    ai_text = resp_data["content"][0]["text"]
                else:
                    ai_text = resp_data["choices"][0]["message"]["content"]

            # Clean potential markdown JSON wrapping
            if ai_text.startswith("```json"):
                ai_text = ai_text.replace("```json", "", 1)
                ai_text = ai_text.rstrip("`\n ")
            elif ai_text.startswith("```"):
                ai_text = ai_text.replace("```", "", 1)
                ai_text = ai_text.rstrip("`\n ")

            try:
                parsed = json.loads(ai_text.strip())
            except json.JSONDecodeError:
                logger.error(f"Failed to parse AI output as JSON: {ai_text}")
                raise Exception("AI output is not valid JSON")

            return ChatResponse(
                reply=parsed.get("reply", "ขออภัยครับ เกิดข้อผิดพลาดในการประมวลผลข้อความ"),
                generated_title=parsed.get("generated_title") if is_first_message else None,
                analysis=ChatAnalysis(**parsed.get("analysis", {})) if "analysis" in parsed else None
            )

    except urllib.error.HTTPError as e:
        logger.error(f"HTTPError calling {LLM_PROVIDER} API: {e.code} {e.read().decode('utf-8')}")
        return ChatResponse(
            reply="ขออภัยครับ ระบบ AI เกิดขัดข้องชั่วคราว ไม่สามารถตอบกลับได้ในขณะนี้",
            generated_title=None,
            analysis=None
        )
    except Exception as e:
        logger.error(f"Error calling {LLM_PROVIDER} API: {e}")
        return ChatResponse(
            reply="ขออภัยครับ เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI Service",
            generated_title=None,
            analysis=None
        )
