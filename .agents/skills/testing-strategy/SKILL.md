---
name: testing-strategy
description: Plan, implement, and review risk-based LostLink tests across React, Go, Python, database, contracts, and integrations. Use for behavior changes, regressions, test infrastructure, quality gates, or QA planning.
---

# Testing Strategy

## Purpose

Verify observable behavior through stable public seams with proportionate coverage.

## Trigger

Use for production behavior, bugs, integration risks, or cross-stack test planning.

## When Not To Use

Skip for documentation-only changes with no executable claim; validate docs directly.

## Inputs

Read acceptance criteria, changed paths, contracts, risks, existing tests, and available environments.

## Workflow

1. Define one observable pass/fail signal and choose the lowest useful test level.
2. For bugs/behavior, prove one relevant test fails first when a reliable seam exists.
3. Implement vertical red-green slices and refactor only while green.
4. Cover high-risk denial, invalid, timeout, retry, transaction, privacy, and degraded paths.
5. Run narrow checks then every affected gate.

## Rules

- Test behavior, not private implementation.
- Mock real boundaries rather than arbitrary internals.
- Use synthetic non-sensitive fixtures.
- Never delete, skip, weaken, or over-mock tests to pass CI.

## Verification

Record exact commands, outcomes, environment limitations, and remaining untested risks.

## Outputs

Produce tests or a test plan, traceable results, regression evidence, and coverage gaps.
