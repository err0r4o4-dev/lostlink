---
name: security-review
description: Review LostLink authentication, authorization, privacy, uploads, storage, claim evidence, AI data flow, secrets, logging, and deployment exposure. Use for security-sensitive changes or explicit threat review.
---

# Security Review

## Purpose

Identify exploitable trust-boundary failures and privacy leaks before human approval.

## Trigger

Use for auth/RBAC, protected endpoints, claims, verification, uploads, sensitive data, secrets, or public exposure.

## When Not To Use

Skip for clearly non-sensitive isolated documentation or visual changes.

## Inputs

Read the task/diff, security boundaries, data classifications, endpoints, schemas, logs, storage/AI flows, and tests.

## Workflow

1. Map attacker-controlled input, identities, assets, trust transitions, and failure paths.
2. Trace authentication plus action/resource authorization.
3. Check validation, injection, upload/storage access, token/session handling, secrets, logs, retention, and abuse limits.
4. Verify public DTOs and AI inputs exclude restricted ownership evidence.
5. Report severity, scenario, evidence, mitigation, and residual risk.

## Rules

- Review only unless a separate implementation task exists.
- Do not use real credentials or attack external systems.
- Deny by default and minimize data.
- Do not claim compliance or accept similarity as ownership proof.

## Verification

Use safe local tests/static inspection and confirm mitigations have negative-path coverage.

## Outputs

Produce actionable findings, required tests, blockers, and residual risks.
