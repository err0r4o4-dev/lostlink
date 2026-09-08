---
name: code-review
description: Review LostLink diffs, pull requests, plans, and completed changes for correctness, scope, contracts, security, privacy, migrations, AI boundaries, tests, and operability. Use for review-only requests.
---

# Code Review

## Purpose

Find actionable defects through an independent end-to-end trace without modifying code.

## Trigger

Use when asked to review, audit, sanity-check, or provide a second opinion.

## When Not To Use

Skip when the user asks to implement; use after implementation only as a separate review stage.

## Inputs

Read task scope, diff/status, affected code/tests/contracts/migrations/docs, and QA evidence.

## Workflow

1. Restate the intended outcome and consider a simpler solution.
2. Trace each changed behavior through callers, boundaries, state, failures, and consumers.
3. Verify scope, claims, tests, compatibility, privacy, and deployment effects.
4. Report blocker/high/medium/low findings with file/line, impact, evidence, and minimal direction.
5. State traces and residual gaps when no findings remain.

## Rules

- Do not modify code or approve/merge.
- Separate verified defects, risks, and questions.
- Prioritize correctness/data/security over style.
- Do not rubber-stamp or demand speculative abstraction.

## Verification

Run only read-only checks that confirm or reject a suspected issue and report them exactly.

## Outputs

Produce severity-ranked findings and a clear ship, fix-then-ship, rework, or reject verdict.
