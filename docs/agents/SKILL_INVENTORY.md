# Source Skill Inventory

Bootstrap inventory created 2026-09-09. All source paths were inspected read-only. “Dependencies” describes expected frameworks/tools or companion guidance, not packages copied into LostLink.

Read-only source roots:

- `D:\!Project\Apartment-Billing(Web_Application)\.agent`
- `D:\!Project\Apartment-Billing(Web_Application)\.agents`
- `D:\!Project\Intern(FDLP)\pinto.pinto-app.com\.agent`
- `D:\!Project\Intern(FDLP)\pinto.pinto-app.com\.agents\skills`
- `D:\!Project\Intern(FDLP)\pinto.pinto-app.com\.claude`

Paths in the tables below are relative to their named source root.

## Apartment Billing `.agent`

| Source item | Purpose / trigger | Dependencies | Reusable | Project assumptions | Decision |
| --- | --- | --- | --- | --- | --- |
| `.agent/rules/api-contracts.md` | REST contract changes | Go/web/docs | High | organization routes | ADAPT |
| `.agent/rules/architecture.md` | boundaries and modules | React/Go/Postgres | High | PDF adapter, billing topology | ADAPT |
| `.agent/rules/authentication.md` | login/session work | bcrypt, opaque sessions | Medium | cookie sessions | ADAPT to JWT rotation |
| `.agent/rules/authorization.md` | role policy | OWNER/STAFF membership | Medium | apartment roles | ADAPT |
| `.agent/rules/code-review.md` | review-only work | diff and code paths | High | billing priorities | ADAPT |
| `.agent/rules/database.md` | migrations/sqlc | Postgres, golang-migrate | High | organization composite keys | ADAPT |
| `.agent/rules/dependencies.md` | dependency changes | npm/Go/Docker/Actions | High | source manifests | ADAPT into CI/DoD |
| `.agent/rules/diagnostics.md` | failures/regressions | service stack | High | PDF/billing failure classes | ADAPT into testing/review |
| `.agent/rules/documentation.md` | behavior/doc sync | authoritative docs | High | billing scope doc | ADAPT |
| `.agent/rules/git-workflow.md` | repository operations | Git | High | generic | ADAPT |
| `.agent/rules/go-api.md` | Go/Gin changes | pgx/sqlc | High | organization context | ADAPT |
| `.agent/rules/infrastructure.md` | Docker/Caddy/CI | Compose | High | old ports/services | ADAPT |
| `.agent/rules/privacy-security.md` | sensitive data | auth/data-flow docs | High | resident/bank fields | ADAPT |
| `.agent/rules/release.md` | release readiness | deployment/backups | High | billing/PDF gates | ADAPT into workflow |
| `.agent/rules/testing-quality.md` | behavior changes | project test suites | High | billing boundary examples | ADAPT |
| `.agent/rules/web-accessibility.md` | user-facing UI | semantic web checks | High | Thai/billing examples | ADAPT |
| `.agent/rules/web-architecture.md` | React structure | Query/RHF/Zod | High | old folder names/context | ADAPT |
| `.agent/rules/web-design.md` | visual changes | design system | Medium | Apartment visual identity | SKIP |
| `.agent/rules/web-testing.md` | frontend tests | Vitest/RTL/Playwright | High | billing journeys | ADAPT |
| `.agent/rules/web.md` | general React work | frontend stack | High | Thai-first billing UI | ADAPT |
| `.agent/rules/billing-domain.md` | billing entities/invariants | billing model | No | entirely billing-specific | SKIP |
| `.agent/rules/manual-payments.md` | payments/tax documents | billing model | No | entirely billing-specific | SKIP |
| `.agent/rules/money-dates.md` | money/meter/date precision | billing model | Low | finance and meters | SKIP |
| `.agent/rules/multi-tenancy.md` | organization isolation | apartment tenancy model | Low | SaaS organizations | SKIP; retain generic least privilege elsewhere |
| `.agent/rules/pdf.md` | invoice rendering | Chromium/PDF | No | billing documents | SKIP |
| `.agent/rules/localization.md` | Thai/billing locale | product locale | Low | Thai-first, Buddhist Era | SKIP until required |
| `.agent/workflows/feature.md` | scoped vertical slice | relevant rules/skills | High | billing checks | ADAPT |
| `.agent/workflows/review.md` | evidence-based review | relevant code paths | High | tenancy/money priorities | ADAPT |
| `.agent/workflows/monthly-billing.md` | monthly billing delivery | billing domain | No | entirely billing-specific | SKIP |

## Apartment Billing `.agents/skills`

| Skill | Purpose / trigger | Dependencies | Reusable | Project assumptions | Decision |
| --- | --- | --- | --- | --- | --- |
| `accessible-web-ui` | accessibility implementation/audit | semantic UI/browser tests | High | Thai/resident examples | ADAPT into responsive web UI |
| `build-apartment-billing-go-api` | Go/Gin implementation | pgx/sqlc/Go tests | High | org-scoped billing | ADAPT |
| `build-apartment-billing-web` | React implementation | Query/RHF/Zod/Tailwind | High | Thai/org context | ADAPT |
| `evolve-apartment-billing-contracts` | public REST evolution | Go/web/docs/tests | High | org routes | ADAPT |
| `implement-apartment-billing-auth` | authentication | bcrypt/opaque cookies | Medium | org sessions | ADAPT to JWT/RBAC design |
| `maintain-apartment-billing-documentation` | doc synchronization | repository sources | High | billing terminology | ADAPT |
| `migrate-apartment-billing-database` | migrations/sqlc | Postgres/golang-migrate | High | tenancy/money | ADAPT |
| `operate-apartment-billing-infrastructure` | Docker/Caddy/CI | Compose/Actions | High | prior topology | ADAPT into two focused skills |
| `protect-apartment-billing-data` | privacy/security | data flows/auth | High | resident/billing data | ADAPT |
| `responsive-web-saas` | responsive recomposition | Tailwind/browser | High | billing dashboards/Thai | ADAPT |
| `review-apartment-billing-change` | review-only findings | diff/code/tests | High | billing invariants | ADAPT |
| `test-apartment-billing-web` | frontend testing | Vitest/RTL/Playwright | High | billing journeys | ADAPT into testing/e2e |
| `develop-apartment-billing-feature` | cross-stack feature work | all app layers | Medium | billing/tenancy | ADAPT into project context/scope |
| `diagnose-apartment-billing-system` | diagnosis | all app layers | High | billing/PDF cases | ADAPT into testing/review, no duplicate skill |
| `design-system-governance` | token consistency | UI system | High | Apartment theme | SKIP until design-system work exists |
| `frontend-ui-verification` | final visual QA | browser screenshots | High | Apartment viewports | ADAPT into responsive/testing |
| `form-workflow-ux` | complex form UX | frontend stack | Medium | billing forms | SKIP until feature forms exist |
| `pixel-perfect-ui` | reference matching | image/Figma/browser | High | Apartment naming only | SKIP; generic installed tooling can serve later |
| `typography-system` | type-system work | fonts/tokens | High | mostly generic | SKIP; no current typography task |
| `dashboard-data-visualization` | charts | chart library/design | Medium | billing metrics | SKIP; no current dashboard task |
| `saas-data-table-ux` | data-table behavior | UI stack | Medium | billing entities | SKIP until table work exists |
| `apple-web-saas-ui` | visual language | UI stack | Low | prescribed aesthetic | SKIP |
| `audit-apartment-billing-web` | broad web audit | specialist UI skills | Medium | billing/privacy model | SKIP; review/testing cover bootstrap |
| `billing-document-layout` | fixed documents | PDF/print | No | invoices/tax docs | SKIP |
| `build-apartment-billing-domain` | billing rules | Go/Postgres | No | entirely billing-specific | SKIP |
| `design-apartment-billing-web` | billing information architecture | domain/UI | No | entirely billing-specific | SKIP |
| `enforce-apartment-billing-tenancy` | organization isolation | SaaS membership | Low | multi-tenant billing | SKIP |
| `localize-apartment-billing-experience` | Thai localization | product copy | Low | Thai billing vocabulary | SKIP until required |
| `manage-apartment-billing-dependencies` | dependency governance | package managers | High | naming only | ADAPT into CI/DoD, no duplicate skill |
| `prepare-apartment-billing-release` | release readiness | full stack | Medium | billing/PDF release | ADAPT into workflow/CI, no duplicate skill |
| `render-apartment-billing-pdf` | PDF pipeline | Chromium/templates | No | billing documents | SKIP |

## Pinto `.agents/skills`

| Skill | Purpose / trigger | Dependencies | Reusable | Project assumptions | Decision |
| --- | --- | --- | --- | --- | --- |
| `karpathy-guidelines` | small, assumption-aware changes | none | High | generic | ADAPT into scope/workflow rules |
| `scrutinize` | end-to-end review | code trace | High | generic | ADAPT into code review |
| `tdd` | red/green/refactor | test seam | High | generic, user approval-heavy | ADAPT into testing strategy |
| `improve-codebase-architecture` | deep module review | CONTEXT/ADR/agent tools | Medium | unavailable files/tools | ADAPT principles into architecture |
| `diagnose` | disciplined debugging | scripts/HITL | High | generic | ADAPT into testing/review, no duplicate skill |
| `debug-mantra` | fixed debugging ritual | none | Medium | verbatim ritual | SKIP; duplicates diagnosis workflow |
| `design-taste-frontend` | opinionated visual design | image/browser tools | Medium | landing/design bias | SKIP; no production design task |
| `design-taste-frontend-v1` | legacy visual design | same | Low | obsolete variant | SKIP |
| `full-output-enforcement` | force exhaustive output | model behavior | Low | non-project engineering policy | SKIP |
| `high-end-visual-design` | prescribed premium aesthetic | fonts/animation | Low | marketing style | SKIP |
| `image-to-code` | image-first UI recreation | image generation/browser | Medium | mandatory generated reference | SKIP |
| `minimalist-ui` | prescribed visual style | UI stack | Low | editorial aesthetic | SKIP |
| `redesign-existing-projects` | broad redesign | existing UI | Medium | redesign workflow | SKIP |
| `nuxt-ui` | Nuxt UI components | Vue/Nuxt | No | wrong framework | SKIP |
| `vue-best-practices` | Vue engineering | Vue | No | wrong framework | SKIP |
| `vue-debug-guides` | Vue diagnosis | Vue | No | wrong framework | SKIP |
| `vue-pinia-best-practices` | Pinia state | Vue/Pinia | No | wrong framework | SKIP |
| `vue-router-best-practices` | Vue Router | Vue | No | wrong framework | SKIP |
| `vuetify0` | Vuetify headless/UI patterns | Vue/Vuetify | No | wrong framework | SKIP |

## Pinto `.claude`

| Item | Purpose / trigger | Dependencies | Reusable | Project assumptions | Decision |
| --- | --- | --- | --- | --- | --- |
| agents `planner`, `implementer`, `test-author`, `qa-gatekeeper` | staged specialist handoffs | Claude teams, CodeGraph, Nuxt | Medium | unavailable tools/framework | ADAPT roles and handoff contract |
| other `.claude/agents/*` | SEO/content/schema/story roles | Nuxt/SEO/Storybook | Low | Pinto product | SKIP |
| `pinto-feature-orchestrator` | fixed five-agent pipeline | Claude agent-team APIs | Medium | invokes all roles, Pinto | ADAPT minimum-agent concept only |
| `pinto-quality-gate` | ordered gates and boundary QA | npm/Nuxt | High | SSR-specific checks | ADAPT into CI/testing |
| `pinto-spec-planner` | scope/reuse/test spec | CodeGraph/DESIGN.md | Medium | Nuxt/SEO conventions | ADAPT into architect/orchestrator |
| `pinto-test-first` | test-first feature work | Vitest/Nuxt | Medium | Pinto paths | ADAPT into testing strategy |
| `post-mortem` | fixed-bug record | bug already fixed | High | generic | SKIP for bootstrap; invoke later if needed |
| `pinto-feature-build`, `pinto-storybook`, `pinto-ssr-audit`, `pinto-seo-orchestrator`, `ui-ux-pro-max` | Pinto UI/SEO delivery | Vue/Nuxt/Storybook/data scripts | No/Low | Pinto-specific | SKIP |
| `.agent/workflows/design-ux-researcher.md`, `ui-ux-pro-max.md` | visual research workflows | Pinto/UI tools | Low | design-specific | SKIP |
| `.claude/CLAUDE.md`, settings and skill links | Claude/CodeGraph configuration | Claude + CodeGraph | No | unavailable integration | SKIP |
