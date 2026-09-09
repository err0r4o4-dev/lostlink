---
name: swagger-openapi
description: Create and synchronize LostLink Swagger/OpenAPI definitions for public Go REST endpoints. Use when adding or changing routes, methods, DTOs, errors, status codes, auth requirements, pagination, or API versions.
---

# Swagger Openapi

## Purpose

Keep public contracts explicit, reviewable, and synchronized across producers and consumers.

## Trigger

Use for every public backend API change.

## When Not To Use

Skip for internal AI-only endpoints intentionally absent from public Swagger.

## Inputs

Read handler annotations, explicit DTOs, API conventions, consumers, and generated docs.

## Workflow

1. Define path, method, operation ID, auth/RBAC, request, response, status/errors, and examples.
2. Declare `BearerAuth` for protected endpoints.
3. Document nullability, formats, pagination, conflicts, and safe errors.
4. Regenerate Swagger artifacts with the repository command.
5. Compare documentation with handlers and frontend clients.

## Rules

- Never expose persistence rows, verification evidence, internal AI routes, or internal errors.
- Update docs, Go, client types, examples, and tests together.
- Prefer compatible additions and plan versions for breaking changes.

## Verification

Generate/validate the spec, open the Swagger route, and test documented response/status behavior.

## Outputs

Produce updated annotations/artifacts, consumer-impact notes, and contract verification.
