---
name: postgresql-pgvector
description: Design and review LostLink PostgreSQL persistence and pgvector retrieval. Use for schemas, repositories, vector columns/indexes, similarity queries, embedding metadata, constraints, query plans, or database architecture.
---

# Postgresql Pgvector

## Purpose

Keep relational state correct and vector retrieval reproducible and privacy-safe.

## Trigger

Use for database design or queries involving PostgreSQL or pgvector.

## When Not To Use

For a mechanical approved migration, use `sql-migrations` as primary.

## Inputs

Read data classification, query needs, model/version/dimension, distance semantics, migrations, and repository contract.

## Workflow

1. Classify each field by purpose, sensitivity, owner, retention, and access.
2. Define constraints and relational ownership before indexes.
3. Fix vector dimension, normalization, distance operator, model/preprocess version, and refresh strategy.
4. Design parameterized sqlc-compatible queries and justified indexes.
5. Plan backfill, re-embedding, rollback, and evaluation.

## Rules

- Store images in object storage, not Base64 in PostgreSQL.
- Keep verification data outside public matching queries and embeddings.
- Do not treat nearest-neighbor distance as ownership evidence.
- Avoid product tables before requirements stabilize.

## Verification

Exercise constraints/queries on disposable Postgres and inspect plans and retrieval/evaluation behavior.

## Outputs

Produce schema/query design, migration needs, vector metadata, risks, and tests.
