---
name: task-scope-guard
description: Validate and enforce LostLink task ownership, FE sub-scope separation, allowed writes, read-only areas, forbidden paths, dependencies, and required checks. Use before implementation or when scope is unclear or drifting.
---

# Task Scope Guard

## Purpose

Prevent cross-owner collisions, unauthorized work, and unrelated changes.

## Trigger

Use when creating/validating a task envelope, coordinating agents, or detecting scope drift.

## When Not To Use

Skip only when the task already has a complete unambiguous guard and no overlap risk.

## Inputs

Read the human request, `AGENTS.md`, roadmap, task template, status, and affected ownership.

## Workflow

1. Require TASK, OWNER, FEATURE, SUB-SCOPE, GOAL, ALLOWED WRITE, READ ONLY, FORBIDDEN, DEPENDENCIES, REQUIRED CHECKS, and DO NOT.
2. Verify owner naming and branch form.
3. For FE work, separate Person 2 presentation from Person 3 integration.
4. Compare planned and actual paths against writes/forbidden scope.
5. Stop and request human direction for material expansion.

## Rules

- One active task per human by default.
- One task/sub-scope equals one branch and PR.
- No unrelated cleanup or next-task work.
- Read-only permission never implies write authority.

## Verification

Inspect the final changed-file list and handoff against the task envelope.

## Outputs

Produce a validated scope guard, collision warnings, required handoffs, and final scope audit.
