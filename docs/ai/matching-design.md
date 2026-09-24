# Matching Design

## Purpose

Matching ranks potentially related lost and found reports using public-safe
signals. It is a recall-oriented discovery aid. It must not approve a claim or
assert ownership.

## Internal embedding contract

Go calls authenticated `POST /internal/v1/embeddings` on the private AI
service. The URL and request body remain unchanged:

```json
{
  "items": [
    { "id": "report-id", "text": "public-safe report text" }
  ]
}
```

The response remains versioned, but every `items[].vector` must contain exactly
384 finite numbers:

```json
{
  "model_version": "paraphrase-multilingual-MiniLM-L12-v2",
  "config_version": "<deployed-config-version>",
  "items": [
    { "id": "report-id", "vector": [0.0123, -0.0456] }
  ]
}
```

The vector is abbreviated in the example; the actual array contains 384
numeric values.

The target model is `paraphrase-multilingual-MiniLM-L12-v2` so Thai, English,
and cross-language descriptions share one semantic vector space. The Go
consumer validates the item count, IDs, model/config versions, finite values,
and exact dimension before persistence. A legacy 32-dimensional response is
rejected as an unavailable/invalid AI response.

The request contains only the public-safe text produced by
`ReportInput.EmbeddingText()`. Private ownership answers, serial secrets held
back for verification, receipts, claimant contact data, and staff-only notes
must never enter embeddings.

## Runtime flow

```text
Authenticated client
  -> POST /v1/reports/{reportId}/matching-runs (public Go API)
  -> Go authorizes the report and selects bounded eligible candidates
  -> Go builds public-safe text for the source and candidates
  -> POST /internal/v1/embeddings (private Go-to-AI request)
  -> AI returns versioned 384-dimensional vectors
  -> Go validates IDs, counts, dimensions, and finite values
  -> Go upserts report_embeddings_384
  -> PostgreSQL ranks same-version candidates with cosine distance
  -> Go stores matches and returns public-safe candidate fields
```

`POST /internal/v1/embeddings` is intentionally absent from the public Go
Swagger document. The Python service also disables its OpenAPI JSON, Swagger
UI, and ReDoc routes. Internal contract details live in this design document
and service tests rather than the application-facing API reference.

## Storage transition

Migration `000009_report_embeddings_384` adds a parallel
`report_embeddings_384` table and HNSW cosine index. The applied
`000006_matching` migration and its 32-dimensional table remain unchanged.
This expand-first layout preserves legacy vectors for rollback while new Go
code reads and writes only the 384-dimensional table.

Existing embeddings are derived data and must be regenerated from the same
public-safe report fields with the deployed model/config version. Follow
[`embedding-384-reembed.md`](embedding-384-reembed.md) for rollout, progress,
rollback, and the later contract-cleanup gate.

## Version and ranking rules

- Store the AI-provided model and config versions with every vector and match.
- Compare candidates only when model and config versions match the source run.
- Use cosine distance for sentence-transformer embeddings with documented,
  versioned preprocessing.
- Keep deterministic category/date eligibility filters around vector ranking.
- Treat thresholds as evaluation-backed retrieval policy, never ownership proof.

## Deployment dependency

The repository's legacy Python bootstrap provider still emits deterministic
32-dimensional hashing vectors until the AI-owned model rollout is completed.
Do not deploy the Go consumer cutover before an AI service version that returns
the coordinated 384-dimensional contract is ready. Matching fails closed when
the producer and consumer dimensions differ.

## Separation from verification

Similarity asks "could these reports describe the same item?" Ownership
verification asks "has this claimant supplied sufficient authorized evidence?"
They use different inputs, access rules, outputs, and audit records. A high
match score cannot transition a claim to approved.
