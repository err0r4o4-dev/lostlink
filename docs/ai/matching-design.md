# Matching Design

## Purpose

Matching ranks potentially related lost and found reports using image and text signals. It is a recall-oriented discovery aid. It must not approve a claim or assert ownership.

## Implemented bootstrap pipeline

1. Go selects active opposite-type candidates using category and a bounded 180-day window.
2. Go sends only public-safe report text to the authenticated internal AI endpoint.
3. The AI service produces normalized 32-dimensional deterministic hashing vectors (`bootstrap-hash-embedding-v1`, config `public-safe-32d-v1`).
4. Go stores versioned vectors and retrieves candidates with pgvector cosine distance.
5. Go stores scores plus safe category/location/date signals and returns only public-safe candidate fields.
6. Every run records model/config versions and fails safely when AI output is unavailable or invalid.

This baseline intentionally avoids model downloads and is not equivalent to a
trained semantic or multimodal model. Image embeddings, calibrated fusion, and
production thresholds remain future model work requiring approved datasets and
evaluation evidence.

Private ownership answers, serial secrets withheld for verification, receipts, claimant contact data, and staff-only notes must not be embedded or returned as explanations.

## Separation from verification

Similarity asks “could these reports describe the same item?” Ownership verification asks “has this claimant supplied sufficient authorized evidence?” They use different inputs, access rules, outputs, and audit records. A high match score cannot transition a claim to approved.

## Operational constraints

Go controls authorization, timeouts, retries, and workflow state. AI responses are validated and treated as fallible. Model weights are not downloaded at bootstrap or committed. Degraded matching should be observable without damaging report data.

