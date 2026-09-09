---
name: playwright-e2e
description: Build and maintain LostLink Playwright end-to-end tests for critical browser journeys. Use for cross-page flows, routing, form submission, auth boundaries, upload behavior, responsive browser checks, or release smoke tests.
---

# Playwright E2e

## Purpose

Verify high-value user journeys through the deployed web/API seam.

## Trigger

Use when a behavior crosses pages/services or explicitly requires browser/E2E coverage.

## When Not To Use

Skip when a unit/component/API test proves the behavior more directly and no browser risk exists.

## Inputs

Read journey acceptance criteria, stable routes/selectors, test environment, seed strategy, and privacy constraints.

## Workflow

1. Define the smallest critical journey and deterministic setup.
2. Prefer accessible role/label/text locators and user-observable assertions.
3. Use API/fixture setup only through approved test seams.
4. Capture traces/screenshots on failure without sensitive data.
5. Run required projects/viewports and clean up owned data.

## Rules

- Do not rely on arbitrary sleeps, test ordering, or production data.
- Do not expose credentials or verification evidence in artifacts.
- Keep selectors tied to accessibility or stable explicit test IDs.
- Do not duplicate lower-level cases without browser value.

## Verification

Run the targeted spec, then the relevant E2E suite; inspect retries/flakiness and failure artifacts.

## Outputs

Produce focused specs, deterministic setup, run evidence, and known environment limitations.
