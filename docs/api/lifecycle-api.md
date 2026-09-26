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

AI chat follows a separate conversation flow:

```text
client turn id + user message
  -> generate AI reply without writing chat data
  -> commit user message + AI message in one transaction
  -> expose the completed turn in chat history
```

## AI chat turn lifecycle

- `POST /v1/chats` creates a session only after its first AI reply succeeds.
- `POST /v1/chats/{sessionId}/messages` appends the user message and AI reply as one atomic pair.
- `PUT /v1/chats/{sessionId}/messages/{messageId}` edits a past user message. The original message and every later message remain stored during AI generation; one transaction replaces that branch only after generation succeeds.
- Each mutation carries a client-generated UUID in `client_turn_id`. An identical retry reuses that UUID, so a response lost after commit returns the existing turn instead of storing a duplicate.
- A `client_turn_id` must not be reused for different content or a different logical operation. Conflicting reuse returns `409 turn_conflict`.
- If another request changes the session while AI generation is running, the stale turn is not stored and the API returns `409 chat_history_changed`; retrying regenerates against the latest history.
- Failed and cancelled attempts are displayed only in frontend state. They are not part of the persisted session history and disappear when discarded or after a successful retry.

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
- Chat turns use the body field `client_turn_id` instead of `Idempotency-Key`, because the UUID also becomes the persisted user-message identifier.
- Chat AI failure returns `503 ai_temporarily_unavailable`; no new session/message is stored, and a failed edit preserves the complete original branch.
- AI timeout/invalid output returns `503` and marks the matching run failed without changing report or claim state.
- Object upload writes the private object before metadata; failed immediate deletion is persisted as an object-cleanup task and retried when the API starts.
- Workflow state, tracking events, notifications, and audit records are written transactionally for claim decisions and return transitions.
