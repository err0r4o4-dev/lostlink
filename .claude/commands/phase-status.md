---
description: Report LostLink task progress, changed files, verification state, blockers, and next authorized step
argument-hint: [task or scope]
---

Report the current status for `$ARGUMENTS` without modifying files.

Read `AGENTS.md`, `CLAUDE.md`, the task scope, `git status`, relevant diffs, and any
active tracker entry. Distinguish completed, in-progress, pending, blocked, and
unverified work. State which checks actually ran and whether each passed or failed.

Do not infer completion from plans or file presence. End with the smallest next
authorized action and identify any decision that requires the human.
