---
name: react-typescript-frontend
description: Implement and review LostLink React 19 and TypeScript behavior with Vite, Tailwind CSS 4, shadcn/ui, React Router, TanStack Query, React Hook Form, and Zod. Use for files under apps/web.
---

# React Typescript Frontend

## Purpose

Build typed, accessible frontend behavior without treating the browser as a security boundary.

## Trigger

Use for scoped pages, components, routes, hooks, forms, or frontend infrastructure.

## When Not To Use

Skip for backend, AI, database, or infrastructure-only work.

## Inputs

Read the FE task/sub-scope, API contract, nearby components/tests, and `AGENTS.md`.

## Workflow

1. Confirm UI presentation versus frontend integration ownership.
2. Define relevant loading, empty, success, validation, unauthorized, forbidden, error, and retry states.
3. Reuse the router, Query client, API client, RHF/Zod, primitives, tokens, and Lucide.
4. Keep feature, shared UI, HTTP, and route concerns in their established directories.
5. Add behavior-focused tests and run frontend gates.

## Rules

- Use strict TypeScript; avoid `any`, duplicate API models, and unjustified casts.
- Keep server state in TanStack Query; frontend permissions are UX only.
- Coordinate before editing the other frontend owner sub-scope.

## Verification

Run lint, typecheck, Vitest, build, and relevant Playwright; inspect accessibility and responsive states.

## Outputs

Produce scoped web changes, tests, contract dependencies, and validation results.
