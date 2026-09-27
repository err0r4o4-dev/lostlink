---
description: Perform a read-only LostLink engineering review with severity-ranked findings
argument-hint: [diff, files, feature, or pull request scope]
---

Review `$ARGUMENTS` without editing production files.

Read `.claude/skills/code-review/SKILL.md` and the canonical role contract at
`.codex/agents/reviewer.md`. Inspect the task scope, Git status and diff, affected
contracts, tests, migrations, and configuration. Trace behavior instead of reviewing
names or comments alone.

Present blocker, high, medium, then low findings with file and line evidence,
impact, failure scenario, and minimal correction direction. If there are no
findings, state that explicitly and list residual verification gaps.
