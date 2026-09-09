---
name: sql-migrations
description: Create and validate LostLink golang-migrate SQL and sqlc-compatible query changes. Use for schema evolution, constraints, indexes, extension setup, data backfills, seeds, or migration review.
---

# SQL Migrations

## Purpose

Make database changes explicit, ordered, and reversible where practical.

## Trigger

Use whenever database schema or persisted data shape changes.

## When Not To Use

Skip for read-only architecture discussion with no schema artifact.

## Inputs

Read database conventions, current sequence, affected queries/repositories, data risk, and deployment constraints.

## Workflow

1. Create the next paired up/down migration; never edit applied history.
2. Add constraints before relying on application validation and indexes for demonstrated queries.
3. Keep SQL parameterized/sqlc-compatible and regenerate code when configured.
4. Make backfills bounded, observable, and deployment-safe.
5. Test up, behavior/constraints, and down on disposable PostgreSQL.

## Rules

- Destructive work needs approval, exact targets, backup, rollback, and retention review.
- Use synthetic seeds only and exclude them from production startup.
- Do not hand-edit generated sqlc output.

## Verification

Run migration up/down, query/constraint tests, sqlc generation, and affected Go tests.

## Outputs

Produce paired migrations, query/generated updates when scoped, evidence, and rollback notes.
