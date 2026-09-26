from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: str = Field(..., description="The role of the message sender, e.g., 'user', 'ai', 'system'")
    content: str = Field(..., description="The content of the message")


class ChatRequest(BaseModel):
    messages: List[ChatMessage] = Field(..., description="History of chat messages, with the latest user message at the end")
    session_id: Optional[str] = Field(None, description="The session ID of the chat if available")


class ChatAnalysis(BaseModel):
    extracted_keywords: List[str] = Field(default_factory=list, description="Keywords extracted from the user's latest query")
    reasoning: Optional[str] = Field(None, description="The AI's reasoning for the provided response")
    matched_item_ids: List[str] = Field(default_factory=list, description="Any potential matches found in the context")
    confidence_score: Optional[float] = Field(None, description="Confidence score of the response or match (0.0 to 1.0)")


class ChatResponse(BaseModel):
    reply: str = Field(..., description="The AI's reply to the user")
    generated_title: Optional[str] = Field(None, description="A generated title for the chat session. Expected on the first message.")
    analysis: Optional[ChatAnalysis] = Field(None, description="Analytical metadata for staff review and audit")
