---
name: responsive-layout-engineering
description: Engineer LostLink responsive structure using containers, Grid, Flexbox, overflow control, adaptive navigation, cards, tables, and desktop-to-mobile transformations. Use when page composition or component structure changes across viewports.
---

# Responsive Layout Engineering

## Purpose

Recompose LostLink layouts across desktop, tablet, and mobile while preserving information priority and the shared design system.

## Scope

Own only:

- page and application-shell structure
- CSS Grid and Flexbox behavior
- container widths and content flow
- overflow diagnosis and containment
- responsive cards and tables
- sidebar collapse and navigation transformation
- desktop, tablet, and mobile structural transformations
- breakpoint application

## Workflow

1. Read `apple-responsive-web-ui` for composition intent and `design-system-tokens` for breakpoint and spacing values.
2. Identify information priority, fixed-width assumptions, overflow roots, and content extremes.
3. Design deliberate desktop, tablet, large-mobile, and mobile compositions.
4. Prefer intrinsic sizing, wrapping, grid minmax patterns, and content-driven layout before adding exceptions.
5. Transform structures where needed: sidebar to mobile navigation, columns to stacks, tables to cards or bounded scrolling, and side panels to full-screen details or sheets.
6. Verify representative token-defined viewports and hand accessibility checks to `accessibility-ui-review`.

## Rules

- Do not define colors, typography, spacing values, shadows, radii, glass, or breakpoint numbers.
- Do not control mobile interaction conventions owned by `cupertino-mobile-ux`.
- Do not redesign static visual styling.
- Do not constrain desktop interfaces to phone-like columns.
- Do not merely scale down desktop UI for mobile.
- Do not hide unresolved page overflow globally.

## Outputs

Produce structural layout changes, transformation rules, viewport evidence, overflow findings, and any mobile-specialist handoff.
