---
name: github-actions-ci
description: Create and maintain LostLink GitHub Actions quality gates for React, Go, Python, Docker configuration, security scanning, and branch policy. Use for .github workflows or CI behavior.
---

# Github Actions CI

## Purpose

Make repository checks reproducible, least-privileged, and aligned with local commands.

## Trigger

Use for workflow, action, cache, matrix, permissions, branch, or automated quality changes.

## When Not To Use

Skip for ordinary application code when existing CI already runs the required commands.

## Inputs

Read service manifests/locks, local check commands, branch policy, required secrets, and current workflows.

## Workflow

1. Map each local gate to an explicit CI job and working directory.
2. Pin maintained actions by approved version and set minimal permissions/timeouts/concurrency.
3. Use dependency caches keyed by lockfiles without caching secrets or build products incorrectly.
4. Fail visibly on lint/type/test/build/contract errors; keep optional unavailable integration checks explicit.
5. Validate YAML and compare commands with documentation.

## Rules

- Never bypass tests or use blanket ignores to pass.
- Never print or hardcode secrets.
- Do not auto-merge or deploy without explicit scope and environments.
- Keep main release and develop feature policy intact.

## Verification

Validate workflow syntax and run equivalent local commands; inspect paths, versions, permissions, and artifacts.

## Outputs

Produce workflow changes, gate mapping, validation evidence, and required repository settings.
