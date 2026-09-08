# LostLink Agent Guide

This file is the repository-wide authority for human and AI contributors. It governs every file unless a nearer `AGENTS.md` adds stricter rules without weakening this one.

## Mission

Build a privacy-conscious university Lost & Found platform in which discovery, reporting, matching, claiming, ownership verification, staff review, tracking, pickup, return, and closure remain explicit stages. AI similarity assists discovery; it never proves ownership.

Bootstrap work may create runnable skeletons, health routes, interfaces, tests, configuration, and documentation. Do not implement authentication or production report, match, claim, verification, tracking, notification, or admin behavior until assigned.

## Source-of-truth order

1. Current human task and its explicit scope guard.
2. This `AGENTS.md` and any stricter nested `AGENTS.md`.
3. Approved architecture, API, database, security, and AI documentation.
4. The minimum applicable `.agents/skills/*/SKILL.md` files.
5. Existing migrations, contracts, code, and tests.

Human task scope overrides agent convenience. Resolve ambiguity toward least privilege, privacy, recoverability, and the smaller change; raise conflicts instead of inventing policy.

## Architecture and ownership

```text
Browser / React -> versioned REST / Go API -> PostgreSQL + object storage
                                      |
                                      +-> internal FastAPI AI service
```

- Keep the Go API a modular monolith and the only public application backend.
- The browser never calls PostgreSQL, object storage credentials, or the AI service directly.
- Go owns authentication, authorization, workflow state, transactions, public DTOs, storage orchestration, and AI-service orchestration.
- Python owns embedding/ranking computation and evaluation, not user authorization or claim decisions.
- PostgreSQL stores metadata and vector references. Store image objects in MinIO/S3, never Base64 blobs in PostgreSQL.
- Caddy is the public entry point. Do not add Redis, queues, search clusters, Kubernetes, or further services without an approved concrete need.

Primary paths: `apps/web`, `apps/api`, `apps/ai`, `database`, `tests`, `deployments`, `docs`, `.codex/agents`, `.agents/skills`, `.github`.

## Human roles and task IDs

- Human 1 — Technical Lead: architecture, Go/API, auth, RBAC, Swagger, database, integrations, and final review. Uses natural feature names such as `authentication`, `matching`, or `release-integration`.
- Human 2 — Frontend UI/presentation. Uses `FE-xx [UI scope]`.
- Human 3 — Frontend logic/integration. Uses the same `FE-xx` with a distinct integration scope.
- Human 4 — AI/ML. Uses `AI-xx`.
- Human 5 — QA/DevOps. Uses `QA-xx` or `OPS-xx`.

One active implementation task per human is the default. One task/sub-scope maps to one branch and one pull request.

## Frontend two-person rule

Humans 2 and 3 may share an FE ID but never the same sub-scope. Human 2 owns pages, visual components, layouts, responsive behavior, accessible presentation, and form presentation. Human 3 owns API clients, TanStack Query, state, types, React Hook Form/Zod integration, route protection, loading/error handling, and data mapping. Coordinate before modifying the other person's work.

## Mandatory task scope guard

Every task must declare:

```text
TASK:
OWNER:
FEATURE:
SUB-SCOPE:
GOAL:
ALLOWED WRITE:
READ ONLY:
FORBIDDEN:
DEPENDENCIES:
REQUIRED CHECKS:
DO NOT:
```

No agent may work outside the assigned task or sub-scope. No unrelated cleanup, opportunistic refactor, next-task work, or silent API redesign is allowed. Preserve unrelated working-tree changes.

## Agent roles

Repository roles live in `.codex/agents`: orchestrator, architect, frontend-engineer, backend-engineer, ai-engineer, qa-engineer, security-reviewer, reviewer, and devops-engineer. Invoke only the minimum set needed. Reviewer agents review and report; they do not silently become implementers.

Typical complex flow: orchestrator -> architect -> required implementation agents -> QA -> security reviewer when needed -> reviewer -> human review. A simple visual task normally needs only frontend ownership, affected QA, and review.

## Working method

Before editing, inspect Git status, the task scope, affected code/tests/contracts, this file, and the selected skill files. Define observable pass/fail signals. Implement the smallest complete change, run narrow checks while iterating, then all affected checks. Report only commands that actually ran and distinguish repository defects from host/tool limitations.

For bugs use `BUG-FE-04-01`, `BUG-AI-01-01`, `BUG-QA-04-01`, or natural Technical Lead linkage such as `BUG-matching-01`. QA creates the bug and assigns the original feature owner; QA must not silently modify unrelated production code to make tests pass.

## Skill selection

- Select the minimum skill set required by the task.
- Read one primary skill by default; add another only when its documented trigger clearly applies.
- Never load unrelated skills for awareness or load every project skill by default.
- Read selected `SKILL.md` files completely and report their exact paths.
- Project skills take precedence over generic reusable skills when they conflict.
- This file takes precedence over skills; human task scope takes precedence over agent convenience.

## Git and review workflow

- Flow: `feature/*` -> pull request -> `develop` -> release pull request -> `main`.
- Human 1 branches: `feature/<natural-feature>`.
- Human 2: `feature/FE-xx-ui`; Human 3: `feature/FE-xx-integration`.
- Human 4: `feature/AI-xx-description`; Human 5: `feature/QA-xx-description` or `feature/OPS-xx-description`.
- Never push directly to `main`, merge a PR automatically, force-push shared branches, or bypass human approval.
- Do not stage, commit, push, create branches, or open PRs unless the human asks.
- Reviews prioritize correctness, authorization, data leakage, destructive behavior, contract drift, migrations, AI evaluation, and missing tests over style.

## API and Swagger rules

- Public APIs are REST/JSON under `/v1` unless an approved versioning decision says otherwise.
- Use explicit request/response DTOs and a consistent error envelope; never serialize database or AI-internal models directly.
- No API contract change without updating documentation, Swagger, producers, consumers, and tests in the same coordinated work.
- Every public Go endpoint change requires Swagger/OpenAPI updates. Protected endpoints declare `BearerAuth`.
- Do not publish internal AI endpoints in public Swagger unless explicitly approved.
- Never return SQL errors, stack traces, credentials, private verification attributes, or another user's private report data.

## Authentication and authorization

- Protected endpoints require both authentication and authorization review.
- Use short-lived JWT access tokens and rotating, revocable refresh sessions as defined in `docs/api/auth-design.md`.
- Keep claims minimal: `sub`, `role`, `iss`, `aud`, `iat`, `exp`, `jti`.
- Never place passwords, phone numbers, ownership answers, item secrets, or unnecessary PII in tokens.
- Hash passwords with Argon2id or a documented appropriate secure implementation. Centralize RBAC policy in Go; frontend guards are UX only.
- Never log passwords, hashes, tokens, authorization headers, ownership answers, or sensitive claim evidence.

## Database and storage

- Every schema change uses a new sequential paired golang-migrate up/down migration; never edit an applied migration.
- Keep SQL sqlc-compatible, parameterized, and outside HTTP handlers. Use constraints and query-justified indexes.
- Test migrations up and down on a disposable database when practical; destructive changes require explicit approval, target verification, backup, and rollback planning.
- Seeds and fixtures must be synthetic. Never copy production, university, or personally identifying data.
- Validate upload type by content, bound size/count, generate object keys server-side, and expose private objects only through authorized short-lived access.

## AI and ownership boundaries

- Item similarity and ownership verification are separate modules, policies, DTOs, and audit trails.
- A match score is a discovery/ranking signal, not proof, approval, or a claim decision.
- AI matching changes require versioned evaluation evidence, dataset notes, metrics, thresholds, and regression comparison.
- Prevent private verification answers and non-public claim evidence from entering embeddings, candidate explanations, logs, or public results.
- Keep deterministic filters and staff/human review around probabilistic ranking. Document uncertainty and failure modes.
- Do not download model weights during bootstrap or commit generated weights/caches.

## Privacy and security

- Minimize collection and exposure. Classify public item details, account data, precise locations, images, claim evidence, and verification secrets separately.
- Deny by default and apply least privilege. Use safe generic errors where resource existence is sensitive.
- Define purpose, access, retention, deletion, and audit behavior before adding sensitive fields.
- Keep secrets out of Git, images, build arguments, logs, examples, and client bundles. `.env.example` contains names and placeholders only.
- Do not claim legal, privacy, security, or AI fairness compliance without formal evidence.

## Testing gates

Every production change requires proportionate tests. Do not delete, skip, weaken, or over-mock tests to make CI pass.

- Web: lint, strict typecheck, Vitest/Testing Library, build; Playwright for critical journeys.
- Go: gofmt, `go vet ./...`, `go test ./...`, and build; use `httptest` at HTTP seams.
- AI: Ruff, pytest, import/startup sanity, and evaluation for matching changes.
- Database: migration up/down and constraint/query checks on disposable PostgreSQL.
- Infrastructure: `docker compose config`, builds, health, routing, persistence, and shutdown as affected.
- Contracts: compare documented DTOs against both provider and consumer behavior.

## Definition of Done

A task is done only when scope and acceptance criteria are met; failure paths are handled; relevant tests pass; API/Swagger/migrations/docs agree; security, privacy, accessibility, and AI boundaries were reviewed as applicable; no unrelated edits or secrets are present; exact checks and residual risks are reported; reviewer and accountable human approval requirements are satisfied. Agents never merge `develop` or `main`.
