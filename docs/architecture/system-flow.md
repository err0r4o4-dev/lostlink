# System Flow

## Product lifecycle

```text
Login -> Home -> Report Lost / Report Found -> AI Matching -> Matching Results
      -> Claim -> Ownership Verification -> Staff Review -> Tracking
      -> Pickup -> Returned -> Closed
```

State transitions will be enforced in Go and persisted transactionally. Public item discovery and private claim evidence use different DTOs and authorization paths.

## Matching flow

1. The browser submits an authorized report and image upload request to Go.
2. Go validates metadata, stores images through the storage abstraction, and persists safe references.
3. Go asks the internal AI service for embeddings/scores using bounded calls and non-public identifiers.
4. PostgreSQL/pgvector supports candidate retrieval; deterministic eligibility filters apply before/after ranking as designed.
5. Go returns a public-safe match result with uncertainty, never private ownership answers.
6. A user may start a separate claim. Verification evidence is evaluated by authorized application/staff workflow, not inferred from similarity.

Retries must be idempotent at mutation boundaries. Failure of AI ranking must not corrupt report or claim state.

## Authoritative states

```text
Report: active -> withdrawn
        active/hidden -> closed
        active <-> hidden (staff moderation)

Claim: draft -> submitted -> under_review
       under_review/submitted -> needs_more_info -> submitted
       under_review/submitted -> approved | rejected
       non-terminal -> cancelled

Return: scheduling -> scheduled -> picked_up -> returned -> closed
        scheduling/scheduled -> cancelled
```

Matching state is separate from reports and claims. A matching run may complete
or fail; a match may be reviewed or dismissed; neither transition changes claim
approval. Closing a completed return closes active/hidden lost and found reports
in the same database transaction.

## Access flow

- Anonymous callers can search active public-safe reports and stream their approved report images.
- Authenticated report owners can edit/withdraw reports, manage images, run matching, and create claims from their own lost-report matches.
- Claim evidence is available only to the claimant and staff/admin roles. Evidence never enters matching input or public report DTOs.
- Staff/admin roles own claim decisions and return transitions. Admin alone can list the audit log.
- Tracking references return `404` when the authenticated account is not an involved party, avoiding resource-existence disclosure.

