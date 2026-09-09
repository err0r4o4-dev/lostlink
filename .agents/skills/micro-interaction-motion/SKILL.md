---
name: micro-interaction-motion
description: Define LostLink hover, press, transition, dialog, sheet, navigation, easing, and reduced-motion behavior. Use after static UI and layout are correct when motion materially improves feedback, continuity, or orientation.
---

# Micro Interaction Motion

## Purpose

Add restrained feedback and spatial continuity without distracting from LostLink tasks or hiding state changes.

## Workflow

1. Confirm the static component, hierarchy, and responsive behavior are already correct.
2. Read `design-system-tokens` for motion durations and easing values.
3. Map each motion to a purpose: acknowledge input, show state, preserve orientation, or explain entry and exit.
4. Keep hover and press feedback subtle; use larger transitions only for dialogs, sheets, and navigation changes.
5. Define a reduced-motion alternative that removes nonessential movement while preserving state feedback.
6. Verify interruption, repeated activation, focus timing, and entry/exit symmetry.

## Rules

- Do not redesign static appearance or layout.
- Do not define global colors, typography, spacing, or motion token values.
- Do not delay essential actions for decorative animation.
- Do not rely on motion alone to communicate state.
- Avoid broad `transition: all` behavior and uncontrolled spring effects.

## Outputs

Produce the motion purpose, affected states, semantic token selection, reduced-motion behavior, and verification notes.
