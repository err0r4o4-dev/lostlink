# Team Workflow

```text
Task Assigned -> Scope Validation -> Read applicable AGENTS.md
-> Select minimum required skills -> Read only those skills -> Plan
-> Implement -> Tests -> QA -> Security Review (when applicable)
-> Reviewer -> Human Review -> PR -> CI -> Merge to develop
```

Complex changes may use: orchestrator -> architect -> necessary implementation agents -> QA -> security reviewer if needed -> reviewer -> human review. Do not invoke every role for every task.

- Simple frontend visual work: frontend engineer, QA if tests are affected, reviewer.
- Authentication: orchestrator, architect, backend/frontend owners as scoped, security reviewer, QA, reviewer.
- AI matching: orchestrator, architect, backend engineer, AI engineer, QA, reviewer.

Each handoff states task ID, owner, sub-scope, files changed, contracts affected, checks run, failures, and remaining risks. Humans approve merges.

## Bug flow

```text
QA finds bug -> create BUG-* task -> assign original feature owner
-> fix -> QA retest -> reviewer -> close
```

Examples: `BUG-FE-04-01`, `BUG-AI-01-01`, `BUG-QA-04-01`, `BUG-matching-01`. QA does not silently patch unrelated production code.

