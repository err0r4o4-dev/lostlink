# Git Workflow

```text
main <- release PR <- develop <- feature PR <- feature branch
```

- `main` receives release PRs from `develop` only.
- Feature branches merge into `develop` after CI and human review.
- Technical Lead: `feature/authentication`, `feature/lost-report`, `feature/found-report`, `feature/matching`, `feature/claim`, `feature/tracking`, `feature/admin`.
- Person 2: `feature/FE-04-ui`; Person 3: `feature/FE-04-integration`.
- Person 4: `feature/AI-01-image-embedding`; Person 5: `feature/QA-04-matching` or `feature/OPS-01-docker`.
- One active task per human by default. One sub-scope, branch, and PR.
- Agents do not merge, push directly to protected branches, force-push shared work, or bypass checks. Humans retain final approval.

PR titles use Conventional Commit form. The PR template records scope, contracts, migrations, AI changes, tests, agents, skills, and out-of-scope changes.

