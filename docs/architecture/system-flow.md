# System Flow

## Product lifecycle

```text
Login -> Home -> Report Lost / Report Found -> AI Matching -> Matching Results
      -> Claim -> Ownership Verification -> Staff Review -> Tracking
      -> Pickup -> Returned -> Closed
```

State transitions will be enforced in Go and persisted transactionally. Public item discovery and private claim evidence use different DTOs and authorization paths.

## Matching flow

1. The browser submits an authorized report and image upload request to Go.
2. Go validates metadata, stores images through the storage abstraction, and persists safe references.
3. Go asks the internal AI service for embeddings/scores using bounded calls and non-public identifiers.
4. PostgreSQL/pgvector supports candidate retrieval; deterministic eligibility filters apply before/after ranking as designed.
5. Go returns a public-safe match result with uncertainty, never private ownership answers.
6. A user may start a separate claim. Verification evidence is evaluated by authorized application/staff workflow, not inferred from similarity.

Retries must be idempotent at mutation boundaries. Failure of AI ranking must not corrupt report or claim state.

