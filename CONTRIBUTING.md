# Contributing to LostLink

## Workflow

1. Branch from the latest `develop` using `task/<topic>`.
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

The CI workflow automatically runs recognized `package.json` scripts when they
exist. Supported script names are:

```text
lint
typecheck
test
coverage
db:validate
migration:test
api:contract
test:integration
test:e2e
architecture:check
performance:test
ai:evaluate
build
```

Python projects receive syntax compilation and standard-library unit test
discovery automatically. Add stack-specific commands to CI once the project
chooses its framework and dependency manager.

## Security

Never commit environment files, private keys, credentials, or production data.
Use `.env.example` for variable names and safe placeholders only.
