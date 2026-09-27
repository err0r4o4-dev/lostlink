---
description: Review LostLink UI rendering, responsiveness, interaction states, and accessibility without redesigning it
argument-hint: [page, route, component, or changed files]
---

Review `$ARGUMENTS` as a final UI quality gate.

Read the applicable UI direction and token skills, then read
`.claude/skills/accessibility-ui-review/SKILL.md` and
`.claude/skills/pixel-perfect-ui-review/SKILL.md`. Inspect the implementation and,
when browser tooling is available, verify relevant desktop, tablet, and mobile
viewports plus loading, empty, error, disabled, success, keyboard, focus, zoom, and
reduced-motion behavior.

Do not redesign the page or edit implementation. Report severity-ranked findings
with evidence and call out any state or viewport that could not be verified.
