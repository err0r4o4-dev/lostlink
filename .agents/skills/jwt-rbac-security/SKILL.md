---
name: jwt-rbac-security
description: Design, implement, or review LostLink JWT access tokens, rotating refresh sessions, password hashing, authentication middleware, and centralized RBAC. Use for login, refresh, logout, protected endpoints, roles, or token/session schema.
---

# JWT RBAC Security

## Purpose

Provide least-privilege authentication and authorization with revocable sessions.

## Trigger

Use for auth/RBAC code, protected APIs, token transport, session persistence, or role-policy changes.

## When Not To Use

Skip for public health endpoints and unrelated non-sensitive work.

## Inputs

Read `docs/api/auth-design.md`, security boundaries, endpoints, roles, transport/CORS policy, and threats.

## Workflow

1. Model login, expiry, refresh rotation/reuse, revocation, logout, denial, and account changes.
2. Pin signing algorithms and validate issuer, audience, times, subject, role, and token ID.
3. Store refresh digests/session families; rotate atomically and revoke on reuse.
4. Centralize RBAC and apply object-level authorization.
5. Test invalid, expired, forged, replayed, revoked, wrong-role, and cross-resource paths.

## Rules

- Keep claims minimal; never include PII or verification secrets.
- Use Argon2id or an approved secure password hash.
- Never log passwords, hashes, tokens, cookies, or authorization headers.
- Frontend guards never replace Go authorization.

## Verification

Run security tests and review transport, CORS/CSRF, key rotation, generic errors, and log redaction.

## Outputs

Produce secure auth/RBAC changes, threat/test evidence, and residual risks.
