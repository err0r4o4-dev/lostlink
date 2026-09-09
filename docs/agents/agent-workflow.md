# Agent Workflow

Agents are optional specialists, not a mandatory committee. The orchestrator validates the task scope and chooses the smallest useful set.

## Routing

- Use `architect` for cross-service boundaries, security architecture, persistent model design, or major contracts.
- Use `frontend-engineer`, `backend-engineer`, or `ai-engineer` only for their assigned writable scope.
- Use `qa-engineer` when behavior or tests change; use `devops-engineer` for CI/deployment configuration.
- Use `security-reviewer` for auth, RBAC, uploads, sensitive data, claim/verification evidence, public exposure, or secrets.
- Use `reviewer` after implementation. It reports findings and does not silently fix them.

## Handoff envelope

Every handoff includes:

```text
TASK / OWNER / FEATURE / SUB-SCOPE
Goal and acceptance criteria
Allowed write / read only / forbidden
Files and contracts changed
Tests required and actually run
Security/AI/data concerns
Known failures, assumptions, and remaining work
```

Human review follows agent review. Agents may prepare work and evidence but may not merge a PR or approve on a human's behalf.

## UI skill architecture

LostLink uses one visual language: **Apple Responsive Web / Adaptive Cupertino**. Desktop remains a spacious, pointer- and keyboard-efficient web application; mobile adapts the same tokens and components to touch-oriented patterns.

| Skill | Exclusive responsibility |
| --- | --- |
| `apple-responsive-web-ui` | Primary visual intent, hierarchy, and cross-device composition philosophy |
| `design-system-tokens` | All exact global colors, typography, font stack, spacing, radii, shadows, borders, glass, motion, layering, touch, container, and breakpoint values |
| `responsive-layout-engineering` | Grid, Flexbox, containers, overflow, responsive cards/tables, and viewport structure transformations |
| `cupertino-mobile-ux` | Small-touch-device navigation, sheets, safe areas, sticky actions, and form ergonomics |
| `liquid-glass-web` | Selective glass surface hierarchy and readable fallbacks |
| `micro-interaction-motion` | Hover, press, transition, navigation, dialog/sheet, and reduced-motion behavior |
| `accessibility-ui-review` | Review-only keyboard, focus, contrast, semantics, screen-reader, touch, zoom, and reduced-motion validation |
| `pixel-perfect-ui-review` | Review-only visual fidelity, token, screenshot, responsive, and duplicate-style validation |

`responsive-web-ui` was renamed and narrowed to `responsive-layout-engineering`; the old name is inactive. Its former accessibility responsibilities belong to `accessibility-ui-review`.

Apply UI guidance in this order:

1. `AGENTS.md` and the explicit task scope
2. `task-scope-guard`
3. `apple-responsive-web-ui`
4. `design-system-tokens` for exact values
5. The minimum domain specialist
6. `react-typescript-frontend` for implementation mechanics
7. Review skills after implementation

Do not load every UI skill by default. A desktop layout normally needs the primary, token, and responsive skills; a mobile sheet additionally needs the mobile specialist; a glass surface needs the glass specialist; accessibility and pixel-perfect skills remain review-only.
