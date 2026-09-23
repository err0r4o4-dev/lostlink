# Lifecycle API

The canonical machine-readable contract is `apps/api/docs/swagger.yaml`. Public
routes are served by Go under `/v1`; the internal AI endpoint is intentionally
excluded from public Swagger.

## Flow

```text
report + images
  -> matching run + ranked candidates
  -> claim draft + restricted evidence
  -> submit + staff decision
  -> return scheduling + pickup + returned + closed
  -> tracking and notifications at each authoritative transition
```

## Authorization

- Public: active report search/detail and public-safe report images.
- User: own report lifecycle, own matching results, own claims/evidence, and return details when the user is claimant or finder.
- Staff/Admin: report/match queues, claim evidence and decisions, and return transitions.
- Admin: audit-event listing.

Object-level authorization is performed from the authenticated principal in Go;
frontend route guards are not security controls. Unauthorized access to private
claims, evidence, returns, and tracking references is concealed as `404`.

## Privacy and lifecycle notes

- Report uploads accept JPEG/PNG, enforce byte/dimension/pixel limits, and are re-encoded before private object storage to remove embedded metadata.
- Claim evidence uses a separate object-key prefix and is never returned through public report or matching DTOs.
- Evidence can be deleted while a claim is editable. Submitted evidence is retained with the claim and verification audit history; automated expiry/purge remains a future retention-policy task.
- Matching inputs contain item name, category, public description, approximate location, and event date only.
- Pickup locations are visible only to involved users and staff/admin roles; private staff notes are omitted from ordinary user responses.

## Failure behavior

- Mutation retries use `Idempotency-Key` where duplicate creation would be unsafe.
- AI timeout/invalid output returns `503` and marks the matching run failed without changing report or claim state.
- Object upload writes the private object before metadata; failed immediate deletion is persisted as an object-cleanup task and retried when the API starts.
- Workflow state, tracking events, notifications, and audit records are written transactionally for claim decisions and return transitions.
