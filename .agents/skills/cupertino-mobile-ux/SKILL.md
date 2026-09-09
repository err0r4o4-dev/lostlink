---
name: cupertino-mobile-ux
description: Design LostLink small-screen and touch-specific behavior such as bottom navigation, bottom sheets, safe areas, sticky actions, and mobile form ergonomics. Use only when a mobile interaction needs more than responsive layout recomposition.
---

# Cupertino Mobile UX

## Purpose

Adapt the shared LostLink web design into familiar, efficient Cupertino-style touch behavior without creating a separate mobile brand.

## Workflow

1. Confirm the behavior is for a small touch viewport and cannot be solved by layout recomposition alone.
2. Read `apple-responsive-web-ui`, `design-system-tokens`, and `responsive-layout-engineering`.
3. Preserve task priority while selecting mobile navigation, a bottom sheet, a full-screen detail, or a sticky action.
4. Account for `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)` where surfaces meet viewport edges.
5. Use token-defined touch targets, spacing, radii, layering, and motion.
6. Validate keyboard appearance, focus movement, scrolling, virtual-keyboard overlap, and reachability through the review skills.

## Rules

- Do not control desktop composition or turn desktop into a phone interface.
- Do not redefine tokens or imitate iOS literally.
- Do not use a bottom sheet when a normal page or inline disclosure is clearer.
- Keep primary actions reachable without covering content or system safe areas.
- Keep forms single-purpose, label controls clearly, and preserve entered data across sheet states.

## Outputs

Produce the mobile interaction pattern, safe-area behavior, navigation or sheet states, touch ergonomics, and desktop-equivalence notes.
