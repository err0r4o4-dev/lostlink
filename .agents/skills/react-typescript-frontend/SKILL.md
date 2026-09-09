---
name: react-typescript-frontend
description: Implement LostLink React 19 and TypeScript mechanics with Vite, Tailwind CSS 4, shadcn/ui, React Router, TanStack Query, React Hook Form, and Zod. Use for scoped apps/web components, hooks, routing, forms, state, tests, and frontend infrastructure while consuming visual direction and tokens from the UI design skills.
---

# React Typescript Frontend

## Purpose

Build typed frontend behavior and component composition without treating the browser as a security boundary or defining the product's visual system.

## Trigger

Use for scoped pages, components, routes, hooks, forms, or frontend infrastructure.

## When Not To Use

Skip for backend, AI, database, or infrastructure-only work.

## Inputs

Read the FE task/sub-scope, API contract, nearby components/tests, `AGENTS.md`, and only the visual skills triggered by the task.

## Workflow

1. Confirm UI presentation versus frontend integration ownership.
2. Define relevant loading, empty, success, validation, unauthorized, forbidden, error, and retry states.
3. Reuse the router, Query client, API client, RHF/Zod, primitives, canonical tokens, and Lucide.
4. Keep feature, shared UI, HTTP, and route concerns in their established directories.
5. Add behavior-focused tests and run frontend gates.

## Rules

- Use strict TypeScript; avoid `any`, duplicate API models, and unjustified casts.
- Keep server state in TanStack Query; frontend permissions are UX only.
- Coordinate before editing the other frontend owner sub-scope.
- Own React implementation, TypeScript, component composition, hooks, routing, forms, state, and frontend engineering mechanics.
- Do not define global colors, fonts, spacing, radii, shadows, breakpoints, Apple theme direction, glass rules, or motion language.
- Consume visual intent from `apple-responsive-web-ui`, exact values from `design-system-tokens`, and behavior from the minimum applicable specialist skills.

## Verification

Run lint, typecheck, Vitest, build, and relevant Playwright; inspect accessibility and responsive states.

## Outputs

Produce scoped web changes, tests, contract dependencies, and validation results.
