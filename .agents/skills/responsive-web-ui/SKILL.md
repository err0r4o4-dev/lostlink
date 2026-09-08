---
name: responsive-web-ui
description: Implement or audit accessible responsive LostLink web layouts. Use for viewport, overflow, navigation, grid, form, dialog, table, keyboard, focus, contrast, zoom, touch, or reduced-motion concerns.
---

# Responsive Web Ui

## Purpose

Recompose interfaces across viewports while preserving task priority and accessibility.

## Trigger

Use when responsive behavior or accessibility is explicitly affected.

## When Not To Use

Skip for data/API logic without user-facing layout or interaction changes.

## Inputs

Read the UI task, current layout, tokens, content extremes, and browser-test coverage.

## Workflow

1. Identify information priority, fixed-width assumptions, and overflow roots.
2. Design deliberate compositions at 320, 768, 1024, and 1440 pixels.
3. Use semantic HTML first and ARIA only for genuine gaps.
4. Preserve keyboard order, visible focus, labels/errors, async announcements, and touch targets.
5. Test long content, 200% zoom, reduced motion, and relevant states.

## Rules

- Recompose instead of shrinking desktop.
- Never hide unresolved page overflow globally.
- Do not convey status by color or icon alone.
- Keep security decisions on the API.

## Verification

Use semantic tests and available browser/manual checks; report only measured results.

## Outputs

Produce responsive UI changes, viewport/state evidence, and residual accessibility gaps.
