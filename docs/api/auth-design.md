# Authentication and Authorization Design

> Implemented baseline. Password recovery, audit events, key rotation tooling,
> and production identity-provider integration remain planned.

## Tokens

- Access token: JWT, short-lived (target 10–15 minutes), validated for signature, algorithm, issuer, audience, expiry, and not-before where used.
- Refresh token: longer-lived session credential (target 30 days), rotated on every use, revocable, and tracked server-side by a hashed identifier/session record.
- Minimal JWT claims: `sub`, `role`, `iss`, `aud`, `iat`, `exp`, `jti`. Do not include password data, phone numbers, private ownership answers, sensitive item secrets, or mutable profile data.

The current API pins HS256 and requires a signing key of at least 32 bytes. The
key stays server-side and must be replaced outside local development. A future
production hardening decision should migrate to Ed25519/EdDSA (or another
approved asymmetric scheme) with an explicit overlap and rotation plan.

## Rotation and revocation

Store only a cryptographic digest of each refresh credential. Bind it to a session/family with user, creation, expiry, last-use, revocation, and replacement metadata. On refresh, atomically revoke/replace the presented token. Reuse of an already rotated token revokes the affected family and generates a security event without logging the credential.

Access tokens are not individually stored by default; short expiry limits exposure. High-risk account events should revoke refresh sessions and may use a user/session epoch for urgent access invalidation.

## Transport

The React client keeps access tokens in memory and sends refresh credentials in
an `HttpOnly`, `SameSite=Strict` cookie. Authentication mutations reject requests
whose `Origin` does not exactly equal `WEB_ORIGIN`; production cookies also set
`Secure`. Production still requires HTTPS at the public entry point.

## RBAC

Go owns centralized role policy. Initial roles should be deliberately minimal (for example user and staff/admin roles only after product approval). Each protected handler authenticates first, authorizes the action/resource second, and repositories still scope queries to the trusted principal. Frontend checks only improve UX.

## Passwords and abuse controls

Use Argon2id with parameters recorded and upgradeable in the hash encoding. Apply generic login errors, rate limits/backoff, safe recovery flows, constant-time comparisons where relevant, audit events, key rotation, and redacted structured logs. Security review is mandatory for implementation.

The implemented password hash uses Argon2id with a PHC-encoded per-password
salt (`m=65536`, `t=3`, `p=2`). Login is limited per normalized identifier and
uses a dummy hash path for unknown accounts. JSON request bodies are bounded at
16 KiB. Password recovery is intentionally unavailable until delivery,
single-use token storage, expiry, rate limiting, and session revocation are
implemented together.

## Public endpoints

- `POST /v1/auth/register`
- `POST /v1/auth/login`
- `POST /v1/auth/refresh`
- `POST /v1/auth/logout`
- `GET /v1/auth/me` (`BearerAuth`)
- `GET /v1/auth/google/start`
- `GET /v1/auth/google/callback`

The canonical request, response, error, header, and cookie contract is
[`apps/api/docs/swagger.yaml`](../../apps/api/docs/swagger.yaml).

## Google OpenID Connect

Google sign-in uses the server-side authorization-code flow with a fresh PKCE
verifier, S256 challenge, state value, and nonce for each attempt. The
callback validates the state cookie, exchanges the single-use code, verifies
the ID-token signature/audience/issuer/expiry, requires a verified email, and
checks the nonce before resolving a local account by Google's stable `sub`
claim. Email is retained only as the local account identifier; it is not used
as the provider identity key.

Google sign-in does not automatically attach to a password account with the
same identifier because password registration does not yet verify email
ownership. Such a collision fails generically. A future account-linking flow
must require an already authenticated local session and fresh Google proof.

Google access and refresh tokens are not persisted. LostLink creates its own
rotating refresh session, redirects to the fixed web callback page, and lets
the frontend obtain a short-lived LostLink access token through `/refresh`.
Configure all three variables together:

```dotenv
GOOGLE_OAUTH_CLIENT_ID=your-web-client-id
GOOGLE_OAUTH_CLIENT_SECRET=your-web-client-secret
GOOGLE_OAUTH_REDIRECT_URL=http://localhost:8088/api/v1/auth/google/callback
```

The redirect URL must exactly match an authorized redirect URI in Google Cloud.
Production requires HTTPS. No Google-hosted-domain restriction is enforced
until the university supplies an approved domain/admission policy.
