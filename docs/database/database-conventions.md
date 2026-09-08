# Database Conventions

- PostgreSQL is authoritative for application state; `pgvector` supports similarity retrieval.
- Use sequential paired files `NNNNNN_description.up.sql` and `.down.sql` with golang-migrate. Never edit a migration after it has been applied to a shared environment.
- Prefer UUID/opaque identifiers, `timestamptz` in UTC, explicit constraints, foreign keys, and indexes justified by real query plans.
- Keep SQL in `database/queries` and repository packages; write queries in a sqlc-compatible style with named comments.
- Use parameterized statements only. Transactions live at service/application boundaries.
- Store object keys/metadata, not Base64 images. Keep restricted verification data separated from public item data at schema and query boundaries.
- Embedding dimensions, distance operator, model/version, normalization, and re-index/backfill strategy must be documented before vector columns/indexes are added.
- Seeds are deterministic, synthetic, non-sensitive, and safe only for non-production environments.
- Validate migration up/down on disposable PostgreSQL. Backups and explicit rollback plans are required before destructive production data work.

Bootstrap migration `000001_enable_vector` enables pgvector only; product tables await finalized requirements.

