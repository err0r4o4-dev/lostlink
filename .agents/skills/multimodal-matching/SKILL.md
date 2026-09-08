---
name: multimodal-matching
description: Design, implement, and evaluate LostLink image/text embedding, candidate retrieval, signal fusion, ranking, explainability, and thresholds. Use for AI matching behavior or model changes.
---

# Multimodal Matching

## Purpose

Improve item discovery with measurable similarity while preserving uncertainty and privacy.

## Trigger

Use for `AI-01` through `AI-03`, matching algorithms, thresholds, retrieval, or evaluation.

## When Not To Use

Skip for ownership verification policy or ordinary report CRUD.

## Inputs

Read matching design, approved dataset provenance, baseline metrics, public-safe fields, model versions, and resource budget.

## Workflow

1. Define candidate eligibility and the metric/acceptance threshold before training or tuning.
2. Version preprocessing, embeddings, retrieval distance, fusion, and configuration.
3. Prevent item/near-duplicate leakage across evaluation splits.
4. Measure retrieval/ranking, slices, false positives, latency, and degraded behavior.
5. Provide safe explanations and document limitations.

## Rules

- A score is never ownership proof or automatic claim approval.
- Exclude private verification answers, receipts, secrets, and staff notes.
- Require evaluation evidence for every matching change.
- Keep deterministic eligibility filters and human review.

## Verification

Compare baseline and candidate on a versioned holdout with Recall@K, Precision@K, MRR/nDCG, slices, and latency.

## Outputs

Produce versioned model/config changes, evaluation evidence, risk notes, and safe integration contract.
