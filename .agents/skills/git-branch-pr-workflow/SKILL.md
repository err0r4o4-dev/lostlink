---
name: git-branch-pr-workflow
description: Apply LostLink branch naming, pull request, protected branch, review, and human approval rules. Use for branch creation, PR preparation, release flow, or Git workflow questions.
---

# Git Branch Pr Workflow

## Purpose

Keep each owner sub-scope isolated and human-reviewed from feature branch to release.

## Trigger

Use for Git branches, commits, pull requests, merge targets, release promotion, or branch-policy changes.

## When Not To Use

Skip for coding tasks that do not perform or plan Git operations.

## Inputs

Read task owner/ID/sub-scope, Git status, `docs/workflow/git-workflow.md`, PR template, and branch protections.

## Workflow

1. Confirm a clean understanding of existing unrelated changes.
2. Choose the owner-specific `feature/*` branch from `develop`.
3. Keep one sub-scope per branch/PR and use a Conventional Commit-style title.
4. Complete contract/migration/AI/security/test/agent/skill fields in the PR template.
5. Require CI and human review; promote `develop` to `main` only by release PR.

## Rules

- Do not initialize, branch, stage, commit, push, or open a PR without human authorization.
- Never push directly to main or auto-merge.
- Never force-push shared branches or use destructive Git commands.
- Scan for secrets, artifacts, and out-of-scope files.

## Verification

Check base/head branch policy, status/diff scope, PR checklist, required checks, and approvals.

## Outputs

Produce the requested Git/PR artifact or precise workflow guidance without merging.
