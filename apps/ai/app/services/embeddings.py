import hashlib
import math
import re
import unicodedata

from app.schemas.embeddings import EmbeddedItem, EmbeddingItem, EmbeddingResponse

DIMENSIONS = 32
MODEL_VERSION = "bootstrap-hash-embedding-v1"
CONFIG_VERSION = "public-safe-32d-v1"
TOKEN_PATTERN = re.compile(r"\w+", re.UNICODE)


def embed_items(items: list[EmbeddingItem]) -> EmbeddingResponse:
    return EmbeddingResponse(
        model_version=MODEL_VERSION,
        config_version=CONFIG_VERSION,
        items=[EmbeddedItem(id=item.id, vector=_embed_text(item.text)) for item in items],
    )


def _embed_text(text: str) -> list[float]:
    normalized = unicodedata.normalize("NFKC", text).casefold().strip()
    tokens = TOKEN_PATTERN.findall(normalized)[:256]
    compact = "".join(normalized.split())
    trigrams = [compact[index : index + 3] for index in range(max(0, len(compact) - 2))][:256]

    vector = [0.0] * DIMENSIONS
    features = [(token, 1.0) for token in tokens]
    features.extend((gram, 0.25) for gram in trigrams)
    for feature, weight in features:
        digest = hashlib.sha256(feature.encode("utf-8")).digest()
        index = int.from_bytes(digest[:2], "big") % DIMENSIONS
        sign = -1.0 if digest[2] & 1 else 1.0
        vector[index] += sign * weight

    norm = math.sqrt(sum(value * value for value in vector))
    if norm == 0:
        return vector
    return [round(value / norm, 8) for value in vector]
