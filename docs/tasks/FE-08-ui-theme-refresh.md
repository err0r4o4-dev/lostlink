# FE-08 UI Theme Refresh

## Task Scope Contract

- **TASK**: FE-08
- **OWNER**: Human 2 - Frontend UI/presentation
- **FEATURE**: LostLink visual theme refresh
- **SUB-SCOPE**: Shared visual foundation and presentation for the guest home, authentication, discovery, search, AI chat, reporting, matching, claims, tracking, notifications, help, and locations routes.
- **GOAL**: Apply the approved calm burgundy/blue visual direction while preserving existing routes, API contracts, privacy boundaries, and workflow behavior.
- **ALLOWED WRITE**: `apps/web/src/styles`, `apps/web/src/layouts`, `apps/web/src/components`, presentation code in `apps/web/src/pages` and `apps/web/src/features`, the UI translation dictionary in `apps/web/src/i18n/language.tsx`, UI-focused frontend tests, and this tracker.
- **READ ONLY**: `apps/web/src/api`, `apps/web/src/features/*/*-api.ts`, `apps/api`, `apps/ai`, `database`, and deployment configuration.
- **FORBIDDEN**: New backend behavior, authentication/RBAC changes, schema changes, unsupported notification preferences, live support channels, precise map data, or ownership decisions inferred from similarity.
- **DEPENDENCIES**: Existing frontend API contracts and synthetic/code-native artwork until approved raster assets are available.
- **REQUIRED CHECKS**: Frontend lint, strict typecheck, Vitest, build, relevant Playwright routes, responsive overflow checks, accessibility review, and final visual review.
- **DO NOT**: Add production mock data, expose private evidence, weaken tests, or redesign staff/admin behavior outside inherited shared-shell styling.

## Implementation Progress

- [x] Inspect the repository, routes, contracts, tests, and design instructions.
- [x] Refresh canonical tokens and shared application shells.
- [x] Refresh shared page headers, cards, controls, item visuals, and status surfaces.
- [x] Apply the theme to public and authentication routes.
- [x] Apply the theme to discovery, report, matching, and claim routes.
- [x] Apply the theme to tracking, notifications, AI chat, help, and locations.
- [x] Verify English and Thai content at desktop, tablet, and mobile viewports.
- [x] Run final checks and review the changed-file list against this scope.

## Contract Boundaries

- Search keeps the existing query, category, and report-type contract.
- Claims continue to start from an authorized potential match.
- Tracking remains reference-based because there is no user return-list endpoint.
- Notification preferences remain explanatory and non-interactive.
- Help does not invent live chat, telephone, or emergency workflows.
- Locations use an abstract approximate-area preview without provider branding or real coordinates.
