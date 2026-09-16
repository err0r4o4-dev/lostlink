# Claude Execution Guide

This concise file tells Claude how to execute work in LostLink. It is not a
second project policy document.

Project rules, ownership, architecture, security boundaries, and business behavior
remain governed by `AGENTS.md` and authoritative repository documentation.
Detailed specialist guidance remains in `.agents/skills/**`.

## Authority and Sources

Use this execution precedence:

1. Explicit user or task instruction
2. `AGENTS.md`, including any stricter nested `AGENTS.md`
3. This `CLAUDE.md`
4. `.agents/skills/task-scope-guard/SKILL.md`
5. `.agents/skills/lostlink-project-context/SKILL.md`
6. The minimum task-specific specialist skills
7. Generic engineering conventions

`CLAUDE.md` is subordinate to `AGENTS.md`. If the two conflict, follow
`AGENTS.md` and report the conflict. The source-of-truth order, approved docs,
contracts, migrations, code, and tests defined by `AGENTS.md` still apply.

Do not use this file to redefine human ownership, frontend sub-scopes, product
or business rules, service architecture, trust boundaries, security/privacy
contracts, API/database/AI contracts, or Git and approval policy.

Repository guidance has distinct roles:

| Source | Responsibility |
| --- | --- |
| `AGENTS.md` | Repository authority, ownership, scope, and non-negotiable rules |
| `CLAUDE.md` | Claude-specific execution and orchestration |
| `.agents/skills/**` | Shared specialist workflows and domain knowledge |
| `docs/**` | Detailed product, architecture, API, data, AI, and workflow documentation |
| `.codex/agents/**` | Codex role definitions; do not copy them into a Claude agent tree |

## Start Every Task

Follow this sequence before and during work:

1. Read the explicit task and identify the requested outcome.
2. Read the applicable `AGENTS.md` files.
3. Inspect `git status` and preserve unrelated working-tree changes.
4. Read `lostlink-project-context` and `task-scope-guard` completely.
5. Establish the task scope contract before editing.
6. Classify the work by domain and risk.
7. Select only the specialist skills whose triggers materially apply.
8. Read each selected `SKILL.md` completely and report its exact path.
9. Inspect the affected implementation, tests, contracts, configuration, and docs.
10. Search for an existing equivalent before creating anything.
11. Define observable pass/fail signals and the actual repository checks.
12. Implement the smallest complete change in dependency order.
13. Fix regressions introduced by one stage before moving to the next.
14. Run affected validation, self-review the diff, and confirm scope compliance.
15. Report the result, then wait for explicit authorization before Git delivery actions.

Do not require human confirmation after every normal successful internal step;
pause only when a stop condition in this guide or repository policy applies.

## Task Scope Contract

Reason according to this envelope, even when a tiny task does not need it
printed in full:

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

Treat read-only access as context, not write permission. Do not silently expand
the assigned owner, feature, sub-scope, or allowed paths. Do not combine
unrelated cleanup, speculative refactors, or the next roadmap task with the
current change.

If required work falls outside the envelope, stop and report the exact missing
authority, contract, dependency, or handoff.

## Minimum-Skill Principle

Do not load every available skill. For each task, read the two core
project/scope skills, classify the domain, add
only relevant implementation or design skills, and add testing, accessibility,
security, or review skills only when their triggers apply. Avoid unrelated
domains.

A button styling task does not require backend, database, storage, or AI skills.
A public API change usually requires backend, Swagger, testing, and possibly
security guidance, but not the full UI skill set.

## Skill Routing

All names below are installed under `.agents/skills/<name>/SKILL.md`.

| Work | Skill routing |
| --- | --- |
| Cross-service boundaries or major contracts | `architecture-design` |
| React components, routes, forms, or frontend mechanics | `react-typescript-frontend` |
| Typed web clients, Query state, guards, or API mapping | `frontend-api-integration` |
| UI intent and page composition | `apple-responsive-web-ui` |
| Global visual values or Tailwind token mapping | `design-system-tokens` |
| Responsive layout transformations | `responsive-layout-engineering` |
| Small-screen touch interactions | `cupertino-mobile-ux` |
| Selective glass surfaces | `liquid-glass-web` |
| Interaction motion | `micro-interaction-motion` |
| Accessibility audit or final accessibility validation | `accessibility-ui-review` |
| Final visual fidelity review | `pixel-perfect-ui-review` |
| Go/Gin API behavior | `go-gin-backend` |
| Internal FastAPI AI service | `python-fastapi-ai` |
| Embeddings, retrieval, ranking, or matching evaluation | `multimodal-matching` |
| PostgreSQL or pgvector design | `postgresql-pgvector` |
| Schema evolution and migrations | `sql-migrations` |
| JWT sessions, authentication, or RBAC | `jwt-rbac-security` |
| Security-sensitive review | `security-review` |
| Image upload or S3-compatible storage | `image-upload-storage` |
| Public Go REST contract changes | `swagger-openapi` |
| Docker, Compose, Caddy, health, or environment wiring | `docker-compose` |
| GitHub Actions or CI policy | `github-actions-ci` |
| Documentation-only or synchronization work | `documentation` |
| Risk-based test planning or behavior-change tests | `testing-strategy` |
| Critical browser journeys | `playwright-e2e` |
| Review-only requests | `code-review` |
| Branch, commit, PR, or release workflow requests | `git-branch-pr-workflow` |

Review skills review and report. They do not silently take over implementation.

## UI Execution Model

For UI work, use responsibilities in this order when they apply:

1. `apple-responsive-web-ui` - visual intent and composition
2. `design-system-tokens` - exact approved visual values
3. `responsive-layout-engineering` - viewport structure
4. `cupertino-mobile-ux` - mobile-specific interaction only
5. `liquid-glass-web` - glass surfaces only
6. `micro-interaction-motion` - motion only after static behavior is sound
7. `react-typescript-frontend` - implementation mechanics
8. `accessibility-ui-review` - accessibility QA
9. `pixel-perfect-ui-review` - final visual QA

Use only the applicable subset. Accessibility and pixel-perfect skills are review-only.
Do not let a specialist redefine tokens or responsibilities owned by another skill.

Keep the product direction brief and consistent:

- Desktop is an Apple-inspired modern web application.
- Tablet is adaptive responsive web.
- Mobile is a Cupertino/iPhone-inspired adaptation of the same design system.
- LostLink remains web-first; mobile does not become a separate product language.

Exact visual values and breakpoints belong to `design-system-tokens`, not this file.

## Search Before Creating

Before creating a component, hook, service, API client, utility, type, schema,
test helper, skill, or abstraction, search the repository for an equivalent.

Use this preference order:

```text
REUSE -> EXTEND -> REFACTOR -> CREATE
```

Create only when existing code cannot safely serve the assigned scope. Avoid
parallel abstractions, duplicate contracts, and a second skill or agent tree.

## Implementation Discipline

- Inspect before editing and follow nearby repository conventions.
- Preserve existing architecture and public contracts unless change is assigned.
- Keep changes focused; avoid broad rewrites and speculative abstractions.
- Do not invent business logic, permissions, workflow states, or API behavior.
- Do not create fake integrations or claim unavailable behavior works.
- Update tests when behavior changes.
- Update docs only when behavior, contracts, configuration, or operator guidance changes.
- Preserve unrelated worktree changes and stop if an unexpected overlapping edit appears.

For large tasks, work sequentially:

```text
foundation -> implementation -> integration -> tests
-> accessibility/security review when applicable -> cleanup -> final validation
```

Do not accumulate known failures. Repair a regression before building on it.

## Missing Backend or Integration

Frontend presentation may precede its backend capability, but it must remain truthful.

When a required backend or contract is absent:

- build safe loading, empty, error, unavailable, or integration-pending states;
- define the expected integration boundary without inventing its contract;
- do not fabricate persistence, success responses, authorization, or server state;
- report the missing backend capability as a dependency or blocker.

## Validation

Validation follows the changed scope. Inspect manifests, scripts, Make targets,
CI workflows, and nearby documentation before choosing commands. Run commands
that actually exist in this repository; do not hardcode or invent tooling.

| Changed scope | Expected validation categories |
| --- | --- |
| Frontend | lint, strict typecheck, unit/component tests, build, and relevant Playwright |
| Go API | formatting, vet/lint, tests, build, HTTP/contract checks as affected |
| Python AI | lint, tests, type/import/startup checks, evaluation for matching changes |
| Database | migration up/down, constraints, queries, and affected repository tests |
| Infrastructure | rendered configuration, builds, health, routing, persistence, and shutdown |
| Documentation | paths, links, headings, claims, names, and synchronization with sources |

After files change:

1. Re-read the changed files.
2. Compare the diff with the task envelope and `AGENTS.md`.
3. Confirm referenced skills and paths exist.
4. Check for duplicated or reassigned specialist guidance.
5. Run `git diff --check` when Git is available.
6. Review `git diff` and `git status`.

Report only checks that ran. Separate repository failures from host/tool limitations.

## Git Safety

Claude may inspect `git status`, `git diff`, and `git branch` when useful.

Do not automatically:

- create, switch, rename, or delete branches;
- stage or commit files;
- push or force-push;
- merge or rebase;
- open, approve, or merge a pull request;
- modify branch protection or bypass required checks.

Perform those actions only when explicitly requested, permitted by `AGENTS.md`,
and consistent with `git-branch-pr-workflow`. Human approval remains required.

## Stop Conditions

Stop and ask or report instead of guessing when:

- a business requirement is materially ambiguous;
- a required API or data contract does not exist;
- the implementation would cross ownership or allowed-write boundaries;
- `AGENTS.md` blocks the requested modification;
- a security-sensitive behavior requires a product or policy decision;
- a destructive Git or data action was not explicitly authorized;
- required credentials, secrets, or external access are unavailable;
- completion would require inventing domain behavior or falsely claiming integration.

Do not stop for ordinary implementation choices that existing code, tests,
documentation, or selected skills answer safely.

## Final Report

For substantial work, provide a concise evidence-based report containing:

- scope completed and behavior implemented;
- files created or modified;
- selected skills and their exact paths;
- checks run with PASS/FAIL results;
- integration-pending items, blockers, or residual risks;
- current Git status and intentionally untouched areas.

Do not provide a giant chronological log. Do not claim success for checks that
did not run.

## Claude and Codex Compatibility

Keep one shared project authority and one shared specialist knowledge base:

```text
AGENTS.md -> project authority
CLAUDE.md -> Claude execution
.codex/agents/** -> Codex roles
.agents/skills/** -> shared specialist knowledge
docs/** -> detailed authoritative documentation
```

Do not create `.claude/skills`, `.claude/agents`, or `.claude/commands` merely
to mirror existing repository content. Add Claude-specific structure only when
a future explicit task and established repository convention require it.
