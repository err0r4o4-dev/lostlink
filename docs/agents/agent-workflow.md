# Agent Workflow

Agents are optional specialists, not a mandatory committee. The orchestrator validates the task scope and chooses the smallest useful set.

## Routing

- Use `architect` for cross-service boundaries, security architecture, persistent model design, or major contracts.
- Use `frontend-engineer`, `backend-engineer`, or `ai-engineer` only for their assigned writable scope.
- Use `qa-engineer` when behavior or tests change; use `devops-engineer` for CI/deployment configuration.
- Use `security-reviewer` for auth, RBAC, uploads, sensitive data, claim/verification evidence, public exposure, or secrets.
- Use `reviewer` after implementation. It reports findings and does not silently fix them.

## Handoff envelope

Every handoff includes:

```text
TASK / OWNER / FEATURE / SUB-SCOPE
Goal and acceptance criteria
Allowed write / read only / forbidden
Files and contracts changed
Tests required and actually run
Security/AI/data concerns
Known failures, assumptions, and remaining work
```

Human review follows agent review. Agents may prepare work and evidence but may not merge a PR or approve on a human's behalf.

