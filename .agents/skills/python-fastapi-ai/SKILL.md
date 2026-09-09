---
name: python-fastapi-ai
description: Build and review LostLink internal Python FastAPI AI service, including schemas, preprocessing, model adapters, health, bounded inference, logging, and pytest coverage. Use for files under apps/ai.
---

# Python Fastapi Ai

## Purpose

Provide a typed, internal, observable AI computation service without owning application policy.

## Trigger

Use for FastAPI endpoints, schemas, services, model adapters, configuration, or AI tests.

## When Not To Use

Skip for Go/public API, frontend, or non-AI persistence work.

## Inputs

Read the `AI-xx` scope, internal contract, approved inputs, resource limits, and evaluation requirements.

## Workflow

1. Define strict Pydantic schemas and safe errors.
2. Isolate preprocessing, model loading, inference, and ranking.
3. Bound input size, concurrency, time/memory, and model/cache paths.
4. Use structured redacted logs and version outputs/configuration.
5. Add pytest coverage and evaluation evidence for matching changes.

## Rules

- Do not authorize users, transition claims, or expose a public route.
- Do not use restricted verification inputs.
- Do not download or commit model weights during bootstrap.
- Treat model output as uncertain and validate it.

## Verification

Run Ruff, pytest, import/startup sanity, health, and targeted evaluation/performance checks.

## Outputs

Produce scoped AI changes, tests, version/evaluation notes, and backend contract handoff.
