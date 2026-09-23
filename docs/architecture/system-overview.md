# System Overview

## Runtime topology

```text
Internet
  -> Caddy (TLS/static entry point)
     -> React web
     -> Go/Gin API (/api/* externally, /v1 internally)
        -> PostgreSQL + pgvector
        -> MinIO/S3-compatible object storage
        -> internal FastAPI AI service
```

The Go API is a modular monolith and the public trust boundary. Feature packages (`auth`, `lost`, `found`, `matching`, `claim`, `verification`, `tracking`, `notification`, `admin`) will own cohesive application behavior without becoming separate deployable services. Handlers translate HTTP, services own rules and transactions, and repositories own SQL.

The AI service is separately deployed because Python/ML dependencies and compute needs differ. It accepts only internal service requests and returns similarity artifacts; it does not authorize users or decide ownership.

## Data ownership

- PostgreSQL: users, reports, workflow state, auditable metadata, embeddings, and object references when schemas are approved.
- Object storage: original/processed images under server-generated keys; no Base64 image payloads in PostgreSQL.
- Go: authoritative workflow state, RBAC, public DTO shaping, signed object access, and AI orchestration.
- Python: embedding, candidate scoring, ranking, explainability summaries, and offline evaluation.
- React: presentation and interaction only; client-side roles are not authorization.

## Implemented lifecycle

The Go API now owns report editing/withdrawal, sanitized report images, versioned
matching runs, private claims and evidence, staff verification decisions, return
arrangements, tracking events, notifications, moderation, and audit events. The
browser continues to call only Go. Go stores private objects in MinIO/S3 and
calls the internal AI service with public-safe report text through an
authenticated, bounded contract.

The current matching model is a deterministic 32-dimensional bootstrap
baseline. It exercises the privacy, persistence, versioning, pgvector, degraded
failure, and review boundaries without downloading model weights. It is not a
production semantic model and cannot approve claims.
