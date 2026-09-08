---
name: documentation
description: Create and synchronize LostLink README, architecture, API, database, AI, workflow, agent, environment, deployment, and runbook documentation. Use for documentation-only work or behavior/configuration changes requiring docs.
---

# Documentation

## Purpose

Keep documentation executable, authoritative, linked, and honest about implementation status.

## Trigger

Use when commands, paths, architecture, contracts, schema, security, AI behavior, environments, or workflow change.

## When Not To Use

Skip for internal refactors with no documented behavior or operator/developer impact.

## Inputs

Read `AGENTS.md`, affected code/tests/config, and the nearest authoritative document.

## Workflow

1. Derive runtime claims from code/routes, schema from migrations, and topology from deployment files.
2. Update the smallest authoritative document and link instead of duplicating.
3. Distinguish implemented, planned, disabled, degraded, development, and production behavior.
4. Keep commands exact for their working directory and platform.
5. Check paths, links, headings, code fences, versions, ports, names, and whitespace.

## Rules

- Do not claim tests, deployment, security, fairness, or production readiness without evidence.
- Keep similarity and verification language separate.
- Never place secrets or real personal data in examples.
- Remove source-project assumptions.

## Verification

Validate referenced paths and links, compare claims to implementation/configuration, and scan for stale terminology.

## Outputs

Produce synchronized documentation, implementation-status notes, and verified links/commands.
