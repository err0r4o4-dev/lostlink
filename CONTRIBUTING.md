# Contributing to LostLink

## Workflow

1. Branch from the latest `develop` using the owner-specific `feature/*` convention in `docs/workflow/git-workflow.md`.
2. Keep each branch focused on one task.
3. Use descriptive conventional commits, such as `feat: add item search`.
4. Open a pull request into `develop` and complete the pull request checklist.
5. Resolve review feedback and all required quality checks before merging.
6. Promote tested work from `develop` to `main` through a release pull request.

Direct pushes to `main` and `develop` are discouraged. Do not force-push either
shared branch.

## Review policy

- At least one human approval is expected for changes to `develop` or `main`.
- CODEOWNERS review is expected for owned files.
- Authors must not approve their own pull requests.
- Stale approvals should be dismissed after material changes.
- All review conversations should be resolved before merge.

GitHub plan capabilities may determine whether these policies can be enforced
server-side. They remain project policy even when enforcement is unavailable.

## Quality commands

Run the service-specific checks before opening a pull request:

```bash
cd apps/web && npm run lint && npm run typecheck && npm test -- --run && npm run build
cd apps/api && gofmt -w cmd internal docs && go vet ./... && go test ./... && go build -o .cache/lostlink-api ./cmd/api
cd apps/ai && python -m pip install -e ".[dev]" && python -m ruff check . && python -m pytest
docker compose --env-file .env.example config
```

Add Playwright, migration up/down, integration, security, or AI evaluation checks when the affected scope requires them. Never weaken a gate to obtain a pass.

## Security

Never commit environment files, private keys, credentials, or production data.
Use `.env.example` for variable names and safe placeholders only.
