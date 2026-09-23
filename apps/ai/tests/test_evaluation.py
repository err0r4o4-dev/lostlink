from app.schemas.embeddings import EmbeddingItem
from app.services.embeddings import CONFIG_VERSION, MODEL_VERSION, embed_items


def cosine(left: list[float], right: list[float]) -> float:
    return sum(
        left_value * right_value
        for left_value, right_value in zip(left, right, strict=True)
    )


def test_synthetic_public_safe_retrieval_baseline() -> None:
    fixtures = [
        (
            "Black metal water bottle with silver lid lost at campus library",
            "Found black water bottle with silver cap near the library",
            ["Blue canvas backpack near sports field", "Silver keys outside dormitory"],
        ),
        (
            "Red folding umbrella lost in cafeteria",
            "Found red compact umbrella by the campus cafeteria",
            ["Black phone case in lecture hall", "White charging cable at library"],
        ),
        (
            "Student ID card lost near engineering building",
            "Found university student card outside engineering faculty",
            ["Green notebook in cafeteria", "Water bottle at gym"],
        ),
    ]

    hits = 0
    for index, (query, positive, negatives) in enumerate(fixtures):
        texts = [query, positive, *negatives]
        response = embed_items(
            [
                EmbeddingItem(id=f"{index}-{item_index}", text=text)
                for item_index, text in enumerate(texts)
            ]
        )
        query_vector = response.items[0].vector
        scores = [cosine(query_vector, item.vector) for item in response.items[1:]]
        if scores.index(max(scores)) == 0:
            hits += 1

    assert MODEL_VERSION == "bootstrap-hash-embedding-v1"
    assert CONFIG_VERSION == "public-safe-32d-v1"
    assert hits / len(fixtures) == 1.0
