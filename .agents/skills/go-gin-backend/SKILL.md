---
name: go-gin-backend
description: Build and review LostLink Go and Gin API behavior, including configuration, middleware, handlers, services, pgx repositories, storage/AI orchestration, health checks, graceful shutdown, and Go tests. Use for apps/api work.
---

# Go Gin Backend

## Purpose

Keep Go as the secure public application boundary and workflow authority.

## Trigger

Use for scoped Go handlers, services, repositories, middleware, configuration, or integrations.

## When Not To Use

Skip for frontend-only or model-only changes.

## Inputs

Read `AGENTS.md`, task scope, route docs, DTOs, migrations/queries, integrations, and tests.

## Workflow

1. Trace request through authentication, authorization, handler, service, repository/integration, and response.
2. Validate edge input and use trusted principal context.
3. Keep HTTP in handlers, rules/transactions in services, and SQL in repositories.
4. Propagate contexts, use bounded timeouts, wrap internal errors, and return safe errors.
5. Update Swagger, consumers, and tests for public behavior.

## Rules

- Never expose SQL, stack traces, tokens, restricted evidence, or AI-internal models.
- Schema changes require migrations.
- AI scores cannot approve claims.
- Keep `main` limited to config, wiring, and lifecycle.

## Verification

Run gofmt, vet, tests, build, route tests, and relevant integration/migration checks.

## Outputs

Produce layered Go changes, explicit contracts, tests, and consumer/security handoffs.
