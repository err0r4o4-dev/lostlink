# Authentication and Authorization Design

> Planned design only. Authentication is not implemented by the bootstrap.

## Tokens

- Access token: JWT, short-lived (target 10–15 minutes), validated for signature, algorithm, issuer, audience, expiry, and not-before where used.
- Refresh token: longer-lived session credential (target 30 days), rotated on every use, revocable, and tracked server-side by a hashed identifier/session record.
- Minimal JWT claims: `sub`, `role`, `iss`, `aud`, `iat`, `exp`, `jti`. Do not include password data, phone numbers, private ownership answers, sensitive item secrets, or mutable profile data.

Prefer asymmetric signing (Ed25519/EdDSA or an approved asymmetric alternative) so verifiers do not hold signing capability. If deployment starts with a symmetric key, isolate and rotate it and document the migration path. Pin algorithms; never accept `none` or an algorithm selected solely from untrusted token headers.

## Rotation and revocation

Store only a cryptographic digest of each refresh credential. Bind it to a session/family with user, creation, expiry, last-use, revocation, and replacement metadata. On refresh, atomically revoke/replace the presented token. Reuse of an already rotated token revokes the affected family and generates a security event without logging the credential.

Access tokens are not individually stored by default; short expiry limits exposure. High-risk account events should revoke refresh sessions and may use a user/session epoch for urgent access invalidation.

## Transport

Recommended browser transport is Secure, HttpOnly, SameSite cookies with explicit paths and a CSRF design for state-changing requests. If access tokens use an Authorization header instead, keep them in memory rather than localStorage and protect refresh credentials with HttpOnly cookies. Production requires HTTPS and exact credentialed CORS origins.

## RBAC

Go owns centralized role policy. Initial roles should be deliberately minimal (for example user and staff/admin roles only after product approval). Each protected handler authenticates first, authorizes the action/resource second, and repositories still scope queries to the trusted principal. Frontend checks only improve UX.

## Passwords and abuse controls

Use Argon2id with parameters recorded and upgradeable in the hash encoding. Apply generic login errors, rate limits/backoff, safe recovery flows, constant-time comparisons where relevant, audit events, key rotation, and redacted structured logs. Security review is mandatory for implementation.

