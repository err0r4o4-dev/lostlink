from pydantic import BaseModel, ConfigDict, Field


class EmbeddingItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str = Field(min_length=1, max_length=100)
    text: str = Field(min_length=1, max_length=4000)


class EmbeddingRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[EmbeddingItem] = Field(min_length=1, max_length=101)


class EmbeddedItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    vector: list[float] = Field(min_length=32, max_length=32)


class EmbeddingResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    model_version: str
    config_version: str
    items: list[EmbeddedItem]
