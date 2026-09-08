# Matching Design

## Purpose

Matching ranks potentially related lost and found reports using image and text signals. It is a recall-oriented discovery aid. It must not approve a claim or assert ownership.

## Planned pipeline

1. Validate and preprocess approved public-safe image/text fields.
2. Produce versioned image embeddings (CLIP or SigLIP candidate) and text embeddings (Sentence Transformers candidate).
3. Retrieve candidates with pgvector using declared distance/normalization semantics.
4. Apply deterministic eligibility filters such as report type, lifecycle state, bounded time, and campus/location policy.
5. Fuse calibrated signals, rank candidates, and expose only safe explanations (for example category/color/time proximity).
6. Record model/config version and evaluation metadata for reproducibility.

Private ownership answers, serial secrets withheld for verification, receipts, claimant contact data, and staff-only notes must not be embedded or returned as explanations.

## Separation from verification

Similarity asks “could these reports describe the same item?” Ownership verification asks “has this claimant supplied sufficient authorized evidence?” They use different inputs, access rules, outputs, and audit records. A high match score cannot transition a claim to approved.

## Operational constraints

Go controls authorization, timeouts, retries, and workflow state. AI responses are validated and treated as fallible. Model weights are not downloaded at bootstrap or committed. Degraded matching should be observable without damaging report data.

