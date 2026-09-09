---
name: accessibility-ui-review
description: Review LostLink interfaces for keyboard operation, focus, contrast, semantics, screen readers, touch targets, reduced motion, readable text, zoom, and responsive accessibility. Use for accessibility audits and final validation, not visual redesign.
---

# Accessibility UI Review

## Purpose

Find actionable accessibility barriers without taking ownership of visual design or implementation.

## Workflow

1. Read the task, relevant user states, implementation, token definitions, and available browser tests.
2. Inspect semantic structure, names, labels, instructions, errors, status announcements, and reading order.
3. Exercise keyboard navigation, focus visibility, focus restoration, dialogs, sheets, menus, and route changes.
4. Validate actual foreground/background contrast, readable text, zoom/reflow, touch targets, reduced motion, and viewport changes.
5. Test content extremes and both English and Thai text where supported by the feature.
6. Report findings by severity with evidence, user impact, and the smallest safe direction; do not silently fix them.

## Rules

- Do not redefine design tokens, responsive structure, or product styling.
- Do not use ARIA where native semantic HTML provides the behavior.
- Do not treat color, icon, position, or motion as the sole state indicator.
- Do not claim conformance from automated checks alone.
- Use token-defined touch and focus values, then verify their rendered result against the applicable accessibility target.

## Outputs

Produce a review-only report covering affected states and viewports, verified findings, test evidence, limitations, and a pass or fix-before-ship recommendation.
