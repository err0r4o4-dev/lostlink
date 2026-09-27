---
description: Deliver a scoped LostLink feature from discovery through verification and review
argument-hint: <task, owner, sub-scope, and acceptance criteria>
---

Execute this feature request: `$ARGUMENTS`

Follow `AGENTS.md` and `CLAUDE.md`. Before editing, inspect Git status and establish
the complete task scope guard from `docs/workflow/TASK_TEMPLATE.md`. Read only the
minimum applicable skills from `.claude/skills/`, inspect affected code and tests,
and search for existing equivalents.

Classify the task size, plan proportionately, implement the smallest complete
change, run affected checks, review the final diff, fix introduced findings, and
re-run verification. Stop rather than inventing ownership, contracts, security
policy, or destructive authority.

Finish with changed files, decisions, exact checks and results, blockers or risks,
and Git status. Do not stage, commit, push, open a pull request, or merge unless the
human explicitly requests it.
