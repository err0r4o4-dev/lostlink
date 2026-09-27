---
description: Run risk-proportionate LostLink checks for the requested scope and report exact evidence
argument-hint: [changed scope or acceptance criteria]
---

Verify `$ARGUMENTS` without changing product behavior.

Read `AGENTS.md`, `CLAUDE.md`, the task scope, manifests, Make targets, CI workflows,
and affected tests. Select checks that actually exist for the changed frontend, Go,
Python, database, contract, infrastructure, or documentation scope. Run focused
checks first and broader gates only when justified by risk or repository policy.

Report every command that ran with PASS or FAIL, separate repository defects from
host limitations, and identify unverified acceptance criteria. Do not weaken tests,
silently fix production code, or claim success for checks that did not run.
