# Production deployment

Production deployment is intentionally not implemented during bootstrap. A future `OPS-xx` task must define secrets management, TLS/DNS, backups and restore tests, storage retention, image provenance, observability, rollout, and rollback. Only Caddy 80/443 may be public; databases, object storage, migration jobs, and the AI service remain private.
