# LostLink Skill Sources

Source tracking for the bootstrap completed 2026-09-09. `ADAPT` means concepts were rewritten for LostLink; no source file was copied verbatim. `NEW` means the project need had no suitable source equivalent.

## Repository guide provenance

`D:\!Project\Apartment-Billing(Web_Application)\AGENTS.md` was inspected read-only. LostLink reused generic scope guards, test/migration discipline, repository safety, contract synchronization, review workflow, and documentation accuracy. It rejected apartment, tenancy, room, billing, payment, invoice, tax/PDF, Thai-first, and organization-role policies because those are not LostLink requirements.

| LostLink skill | Original source | Mode | Major changes / removed assumptions |
| --- | --- | --- | --- |
| `lostlink-project-context` | Apartment `develop-apartment-billing-feature`; Pinto `karpathy-guidelines` | ADAPT | Replaced billing/tenancy with LostLink stages, task ownership, AI/verification boundary |
| `architecture-design` | Apartment architecture rule; Pinto `improve-codebase-architecture` | ADAPT | Added Go-to-AI seam, object storage, pgvector; removed PDF and CodeGraph requirements |
| `react-typescript-frontend` | Apartment `build-apartment-billing-web` | ADAPT | Retained React/Query/RHF/Zod layering; removed Thai and organization assumptions |
| `responsive-web-ui` | Apartment `responsive-web-saas`, `accessible-web-ui` | ADAPT | Retained responsive/accessibility checks; removed billing table priorities |
| `frontend-api-integration` | Apartment web architecture and contract skill | ADAPT | Added explicit FE integration ownership and LostLink public/private DTO boundary |
| `go-gin-backend` | Apartment `build-apartment-billing-go-api` | ADAPT | Added Swagger and internal AI/storage orchestration; removed organization tenancy |
| `jwt-rbac-security` | Apartment auth/security rules and skills | ADAPT | Replaced bcrypt opaque-session design with Argon2id, JWT access, rotating refresh sessions |
| `swagger-openapi` | Apartment `evolve-apartment-billing-contracts` | ADAPT | Made Swagger mandatory and excluded internal AI routes |
| `postgresql-pgvector` | Apartment database skill | ADAPT | Added vector metadata/dimension/version rules; removed finance/tenancy constraints |
| `sql-migrations` | Apartment `migrate-apartment-billing-database` | ADAPT | Retained paired migration/sqlc safety; removed billing precision rules |
| `python-fastapi-ai` | none | NEW | Internal FastAPI service ownership and resource-bounded ML dependency policy |
| `multimodal-matching` | none | NEW | LostLink-specific embedding/ranking/evaluation and ownership-proof separation |
| `image-upload-storage` | Apartment data protection/infrastructure concepts | ADAPT | Added MinIO/S3 abstraction, content validation, object keys, signed access |
| `testing-strategy` | Apartment testing rules; Pinto `tdd` and quality gate | ADAPT | Cross-stack risk matrix; removed Nuxt/Storybook/SSR gates |
| `playwright-e2e` | Apartment web-test skill | ADAPT | Replaced billing journeys with LostLink lifecycle and privacy-safe fixtures |
| `code-review` | Apartment review skill; Pinto `scrutinize` | ADAPT | Added task scope, AI evidence, ownership privacy; removed billing invariants |
| `security-review` | Apartment `protect-apartment-billing-data` | ADAPT | Added upload, AI prompt/input, verification evidence, JWT threats |
| `docker-compose` | Apartment infrastructure skill | ADAPT | Topology changed to web/api/ai/postgres/minio/caddy; Redis explicitly excluded |
| `github-actions-ci` | Apartment infrastructure/release; Pinto quality gate | ADAPT | Separate web/Go/AI jobs, no bypass, no Pinto SSR/style gates |
| `documentation` | Apartment documentation skill | ADAPT | Replaced billing terminology and documented planned-versus-implemented LostLink behavior |
| `task-scope-guard` | Apartment working method; Pinto `karpathy-guidelines` | ADAPT | Encoded five-person IDs, allowed-write/read-only/forbidden contract |
| `git-branch-pr-workflow` | Apartment git rule | ADAPT | Replaced `task/*` with Human-specific `feature/*` names and release-only main flow |

No source-project secrets, environment files, paths, customer data, product rules, or credentials were imported.
