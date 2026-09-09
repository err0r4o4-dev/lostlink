---
name: design-system-tokens
description: Govern the single source of truth for LostLink colors, typography, spacing, radii, shadows, borders, glass, motion, layering, touch targets, containers, and breakpoints. Use whenever a global visual value is selected, changed, mapped to Tailwind, or audited.
---

# Design System Tokens

## Purpose

Own every global visual constant for the "LostLink — Apple Responsive Web / Adaptive Cupertino" theme. Other UI skills and application code consume these values and must not redefine them.

## Canonical Implementation

When the runtime token foundation is implemented, keep the executable values in one CSS token file under `apps/web`. Map Tailwind utilities to that file instead of copying values into components or documentation. Until that file exists, the values below are authoritative.

## Color Tokens

```css
--brand-primary: #8B183F;
--brand-primary-hover: #761334;
--brand-primary-active: #64102C;
--brand-soft: #FCE7EA;

--background: #F5F5F7;
--surface: #FFFFFF;
--surface-secondary: #F3F6FB;

--text-primary: #0F172A;
--text-secondary: #64748B;
--text-tertiary: #94A3B8;

--border: rgba(15, 23, 42, 0.08);

--success: #22C55E;
--warning: #F59E0B;
--error: #EF4444;
--info: #3B82F6;

--glass-bg: rgba(255, 255, 255, 0.70);
--glass-bg-strong: rgba(255, 255, 255, 0.82);
--glass-border: rgba(255, 255, 255, 0.55);
```

Do not infer accessible foreground/background pairings from a state hue alone. Validate each actual pairing through `accessibility-ui-review`.

## Typography Tokens

```css
--font-sans: Inter, "Noto Sans Thai", ui-sans-serif, -apple-system,
  BlinkMacSystemFont, "Segoe UI", sans-serif;

--font-regular: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;

--text-display: 3rem;
--text-page: 2.25rem;
--text-page-mobile: 1.75rem;
--text-section: 1.5rem;
--text-card: 1.125rem;
--text-body: 1rem;
--text-caption: 0.875rem;

--leading-display: 1.1;
--leading-page: 1.2;
--leading-section: 1.3;
--leading-card: 1.4;
--leading-body: 1.65;
--leading-caption: 1.5;
```

Use Inter for Latin text and Noto Sans Thai for Thai coverage. Do not require or bundle SF Pro. Avoid weights above the defined scale.

## Spacing, Radius, and Depth Tokens

```css
--space-1: 0.25rem;
--space-2: 0.5rem;
--space-3: 0.75rem;
--space-4: 1rem;
--space-5: 1.25rem;
--space-6: 1.5rem;
--space-8: 2rem;
--space-10: 2.5rem;
--space-12: 3rem;
--space-16: 4rem;

--radius-small: 0.75rem;
--radius-control: 0.875rem;
--radius-card: 1.25rem;
--radius-feature: 1.5rem;
--radius-overlay: 1.75rem;
--radius-pill: 9999px;

--border-width: 1px;
--shadow-card: 0 4px 18px rgba(15, 23, 42, 0.05);
--shadow-floating: 0 10px 35px rgba(15, 23, 42, 0.08);
```

Reserve the pill radius for chips, statuses, filters, and compact segmented controls.

## Glass, Motion, Layout, and Layer Tokens

```css
--glass-blur: 16px;
--glass-saturation: 140%;

--motion-fast: 120ms;
--motion-standard: 200ms;
--motion-deliberate: 320ms;
--ease-standard: cubic-bezier(0.2, 0, 0, 1);
--ease-emphasized: cubic-bezier(0.2, 0.8, 0.2, 1);

--touch-target-min: 2.75rem;
--content-max: 100rem;

--z-base: 0;
--z-sticky: 20;
--z-navigation: 30;
--z-overlay: 40;
--z-dialog: 50;
--z-toast: 60;

--breakpoint-mobile: 40rem;
--breakpoint-tablet: 48rem;
--breakpoint-desktop: 64rem;
--breakpoint-large-desktop: 90rem;
```

Interpret breakpoint ranges as: mobile below `--breakpoint-mobile`, large mobile until `--breakpoint-tablet`, tablet until `--breakpoint-desktop`, desktop until `--breakpoint-large-desktop`, and large desktop above it.

## Workflow

1. Search the canonical runtime token file and existing semantic utility before adding a value.
2. Change or add a semantic token here first while the runtime file does not yet exist; after it exists, change the runtime file and keep this skill descriptive rather than duplicating values.
3. Map tokens through Tailwind theme configuration or CSS theme declarations.
4. Replace repeated arbitrary values with semantic utilities incrementally within the assigned UI scope.
5. Validate contrast, typography, responsive use, and visual regressions with the relevant review skills.

## Rules

- Do not scatter raw global values through components.
- Do not let another skill or page redefine this system.
- Do not add dark-mode values until a task explicitly requires dark mode.
- Do not add one-off tokens without a reusable semantic purpose.
- Treat breakpoint values as tokens; let `responsive-layout-engineering` own their structural use.

## Outputs

Produce canonical token changes, framework mappings, affected consumers, compatibility notes, and visual/accessibility validation needs.
