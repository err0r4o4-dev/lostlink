# LostLink

LostLink is a university Lost & Found platform with AI-assisted item similarity. It is a five-person engineering project organized as a monorepo: React web client, modular Go API, internal Python AI service, PostgreSQL with pgvector, and S3-compatible object storage.

> Bootstrap status: only service skeletons, health endpoints, contracts, tests, and delivery infrastructure exist. Authentication and product workflows are planned, not implemented.

## Safety boundary

AI ranking helps staff and users discover potentially related lost and found reports. A similarity score is never evidence of ownership. Ownership verification is a separate, access-controlled workflow, and private verification attributes must not appear in public item responses or AI explanations.

## Repository map

- `apps/web`: React 19, TypeScript, Vite, Tailwind CSS 4, React Router, TanStack Query.
- `apps/api`: Go/Gin REST API, Swagger bootstrap, pgx connection package.
- `apps/ai`: internal FastAPI service; heavyweight ML dependencies are optional.
- `database`: golang-migrate SQL, sqlc-compatible queries, seeds, and schema notes.
- `deployments`: Dockerfiles and Caddy configuration.
- `docs`: architecture, API, AI, database, workflow, and agent guidance.
- `.codex/agents`: project agent role definitions.
- `.agents/skills`: LostLink-native skills.

## Prerequisites

- Node.js 22 and npm 10+
- Go 1.25+
- Python 3.12+
- Docker with Compose v2 (recommended for the full stack)

## Quick start

Copy `.env.example` to `.env`, replace development placeholders, then run:

```bash
docker compose up --build
```

Open `http://localhost:8088`. Through Caddy, API health is at `http://localhost:8088/api/health` and Swagger UI is at `http://localhost:8088/api/swagger/index.html`. The AI service is internal to the Compose network by design.

Service-level development:

```bash
make web-check
make api-check
make ai-check
```

On Windows without `make`, run the commands documented in each service manifest and in [CONTRIBUTING.md](CONTRIBUTING.md).

The default Compose network publishes only Caddy on loopback. PostgreSQL, MinIO, migrations, and the AI service remain private to the local Docker networks.

## Branch model

```text
feature/* -> pull request -> develop -> release pull request -> main
```

Feature branches follow owner conventions documented in `docs/workflow/git-workflow.md`. Agents never merge a pull request or push directly to `main`; humans retain final approval.

## Next planned task

`authentication` is next, with FE-01 UI/integration and QA-01 assigned separately. Bootstrap does not start that feature.
