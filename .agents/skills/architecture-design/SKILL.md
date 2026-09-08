---
name: architecture-design
description: Design or review LostLink service boundaries, modules, data flow, trust seams, and architectural decisions. Use for cross-service changes, new persistent modules, major contracts, or architecture documentation.
---

# Architecture Design

## Purpose

Create the smallest testable design that preserves clear ownership and security boundaries.

## Trigger

Use for changes spanning services, persistence, storage, authentication, or public/internal contracts.

## When Not To Use

Skip for localized work following an established pattern.

## Inputs

Read `AGENTS.md`, task constraints, system overview, affected contracts, and existing code/decisions.

## Workflow

1. State the outcome, constraints, and current flow.
2. Assign responsibility to React, Go, PostgreSQL/storage, or AI.
3. Define interfaces, data classification, failure/retry behavior, compatibility, and observability.
4. Test against simpler alternatives and rollback needs; update authoritative docs.

## Rules

- Keep Go a modular monolith and the only public backend.
- Add a seam only when it isolates real policy or multiple implementations.
- Do not add speculative infrastructure.
- Keep matching and verification separate.

## Verification

Trace happy, denial, invalid, timeout, retry, and partial-failure paths end to end.

## Outputs

Produce decisions, interfaces, affected surfaces, risks, tests, and open human choices.
