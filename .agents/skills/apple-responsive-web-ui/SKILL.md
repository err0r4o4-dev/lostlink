---
name: apple-responsive-web-ui
description: Define the LostLink Apple-inspired, web-first visual language and consistent desktop, tablet, and mobile composition. Use for UI direction, page hierarchy, page composition, or cross-viewport visual consistency before implementation details are chosen.
---

# Apple Responsive Web UI

## Purpose

Keep LostLink recognizable as one calm, premium, friendly university product across desktop, tablet, and mobile.

## Design Direction

- Treat LostLink as a web application first, not a large phone interface or a macOS clone.
- Use spacious application shells, clear navigation, broad content areas, and efficient grids on desktop.
- Adapt the same identity into touch-oriented Cupertino patterns on mobile.
- Draw on Apple principles such as clarity, restraint, hierarchy, and responsive feedback without copying Apple products.
- Prefer solid, readable content surfaces. Use glass and decorative effects only where they improve hierarchy.

## Workflow

1. Confirm the task's UI ownership, user priority, content states, and affected viewports.
2. Read `design-system-tokens` for every visual constant.
3. Choose a web composition appropriate to the page and its information density.
4. Add `responsive-layout-engineering` when structure changes across viewports.
5. Add only the specialist skills required by the interaction: mobile, glass, motion, accessibility, or final visual QA.
6. Hand implementation mechanics to `react-typescript-frontend` without duplicating token values.

## Rules

- Do not define exact colors, fonts, spacing, radii, shadows, breakpoints, blur, or layering values here.
- Do not create separate desktop and mobile brands or component vocabularies.
- Do not make every surface glass, every control pill-shaped, or every section oversized.
- Keep desktop pointer- and keyboard-efficient; do not constrain it to a phone-width column.
- Keep mobile task-focused and touch-efficient; do not merely shrink the desktop layout.
- Use one icon family and shared components before creating page-specific variants.
- Keep AI similarity visibly framed as discovery assistance, never ownership proof.

## Outputs

Produce the page hierarchy, composition intent, applicable specialists, component reuse plan, and cross-viewport consistency requirements.
