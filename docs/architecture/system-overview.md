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

## Bootstrap state

Health, Swagger, local account authentication, refresh-session rotation, role middleware, and public-safe text report discovery are implemented alongside the development infrastructure. Image storage and later product workflows remain deferred.
