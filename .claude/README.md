# LostLink Claude Code Configuration

This directory exposes LostLink's existing agent roles and specialist skills to
Claude Code without creating a second source of truth.

## Structure

- `agents/` contains Claude Code subagent adapters. Each adapter loads its
  canonical role contract from `.codex/agents/`.
- `commands/` contains project workflows that can be invoked as slash commands.
- `skills/` contains Claude Code discovery adapters. Each adapter loads its
  canonical instructions from `.agents/skills/`.

Keep adapters thin. Update the canonical role or skill first, then update its
adapter only when discovery metadata or routing must change.

## Commands

- `/feature <task>` - deliver a scoped feature from discovery through review.
- `/phase-status [scope]` - report current progress, checks, and blockers.
- `/review [scope]` - perform a read-only engineering review.
- `/ui-review [page or component]` - review rendered UI and accessibility.
- `/verify [scope]` - run risk-proportionate repository checks.

All commands remain subordinate to `AGENTS.md` and `CLAUDE.md`. They do not
authorize Git delivery actions, destructive operations, or work outside the
current task scope.
