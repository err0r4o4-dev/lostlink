---
name: pixel-perfect-ui-review
description: Perform final LostLink visual QA for spacing, alignment, typography, token usage, screenshot fidelity, responsive consistency, one-off styles, and duplicate components. Use after implementation is complete; never use it to independently redesign a page.
---

# Pixel Perfect UI Review

## Purpose

Detect visual drift between an approved design direction, the canonical tokens, shared components, and the rendered interface.

## Workflow

1. Read the task, approved reference, applicable visual skills, canonical tokens, and changed components.
2. Capture or inspect consistent viewport and state evidence without sensitive user data.
3. Compare hierarchy, alignment, spacing rhythm, typography, icons, borders, radii, shadows, and glass usage.
4. Search changed UI for raw values, arbitrary utilities, copied component structures, and inconsistent variants.
5. Inspect desktop, tablet, and mobile compositions plus loading, empty, error, disabled, focus, hover, and pressed states as applicable.
6. Report findings by severity with evidence and the governing token or component; do not modify code.

## Rules

- Do not invent a new design direction or redefine token values.
- Do not demand literal Apple imitation or image-level sameness that harms responsive behavior or accessibility.
- Do not approve from source inspection alone when rendered evidence is available.
- Distinguish confirmed visual defects from browser-rendering variation and missing reference detail.

## Outputs

Produce a review-only visual QA report, screenshot/viewport evidence, token violations, duplicate-style findings, and a pass or fix-before-ship recommendation.
