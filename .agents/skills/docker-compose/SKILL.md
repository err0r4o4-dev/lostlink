---
name: docker-compose
description: Build, change, and verify LostLink Dockerfiles, Docker Compose, Caddy, health checks, local networks, volumes, and environment wiring. Use for docker-compose.yml or deployments/docker work.
---

# Docker Compose

## Purpose

Keep the local multi-service stack reproducible, private by default, and secret-free.

## Trigger

Use for containers, service wiring, ports, health checks, storage, or Caddy routing.

## When Not To Use

Skip for application-only changes with no container effect.

## Inputs

Read topology docs, Dockerfiles, Compose, Caddyfile, `.env.example`, service health routes, and host constraints.

## Workflow

1. Render config and inspect services, ports, networks, volumes, variables, and dependencies.
2. Use minimal multi-stage/non-root images where practical and explicit image tags.
3. Expose only Caddy publicly; keep Postgres, MinIO, and AI internal except intentional local admin ports.
4. Verify builds, startup, health, routing, persistence, logs, and shutdown when Docker is available.
5. Document host limitations separately.

## Rules

- Never embed secrets or expose production data services.
- Do not deploy, publish, prune shared state, or delete volumes without approval.
- Do not add unrequested infrastructure such as Redis.
- Keep development and production configuration distinct.

## Verification

Run `docker compose config`, then targeted builds/health checks when the host supports Docker.

## Outputs

Produce scoped config changes, rendered/build evidence, exposure review, and operational notes.
