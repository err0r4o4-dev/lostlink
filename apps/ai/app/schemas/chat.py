from typing import Annotated, Literal
from uuid import UUID

from pydantic import BaseModel, Field

MessageContent = Annotated[str, Field(min_length=1, max_length=4000)]
Keyword = Annotated[str, Field(min_length=1, max_length=100)]
MatchedItemID = Annotated[str, Field(min_length=1, max_length=100)]


class ChatMessage(BaseModel):
    role: Literal["user", "ai"]
    content: MessageContent


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(min_length=1, max_length=100)
    session_id: UUID | None = None


class ChatAnalysis(BaseModel):
    extracted_keywords: list[Keyword] = Field(default_factory=list, max_length=20)
    reasoning: str | None = Field(default=None, max_length=2000)
    matched_item_ids: list[MatchedItemID] = Field(default_factory=list, max_length=100)
    confidence_score: float | None = Field(default=None, ge=0, le=1)


class ChatResponse(BaseModel):
    reply: str = Field(min_length=1, max_length=4000)
    generated_title: str | None = Field(default=None, max_length=200)
    analysis: ChatAnalysis | None = None
