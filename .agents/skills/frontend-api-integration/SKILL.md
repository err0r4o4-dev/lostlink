---
name: frontend-api-integration
description: Connect LostLink React features to the Go REST API using typed clients, TanStack Query, React Hook Form, and Zod. Use for FE integration, API state, data mapping, route guards, loading/error handling, or contract changes.
---

# Frontend API Integration

## Purpose

Keep frontend consumers typed and synchronized with public API contracts.

## Trigger

Use for Person 3 FE integration scope or any web/API contract seam.

## When Not To Use

Skip for presentation-only UI or server implementation without a web consumer.

## Inputs

Read Swagger/API docs, frontend types/client, endpoint behavior, and assigned FE scope.

## Workflow

1. Define request, response, error, auth, nullability, and cache behavior.
2. Compare producer fields with consumer types and mappings field by field.
3. Put raw HTTP in `src/api` and expose feature hooks around TanStack Query.
4. Integrate RHF/Zod without duplicating server authority.
5. Test relevant loading, success, invalid, denial, failure, retry, and cancellation states.

## Rules

- Do not redesign Person 2 components without coordination.
- Never use client IDs or hidden controls as authorization.
- Do not silently change the API contract.
- Never expose private verification data in general item models.

## Verification

Run web gates and compare documented Go DTOs to TypeScript consumers.

## Outputs

Produce typed integration changes, cache/form decisions, contract notes, and tests.
