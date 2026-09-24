# 384-Dimensional Embedding Re-embed Plan

## Status and scope

This is the deployment plan for moving report embeddings from the legacy
32-dimensional bootstrap representation to 384-dimensional
`paraphrase-multilingual-MiniLM-L12-v2` vectors. Migration `000009` creates the
parallel table and index; it does not rewrite or delete the legacy table.

The repository does not yet contain an operator backfill command. Implement and
review that bounded command before running the data phase. It must reuse Go's
public-safe report projection and AI client, write only embedding rows, and
must not create matching runs, matches, notifications, or tracking events.

## Preconditions

1. Record the exact AI `model_version` and `config_version` selected for the
   rollout. Do not mix vectors from different versions in one retrieval run.
2. Complete Thai, English, and Thai-to-English/English-to-Thai retrieval
   evaluation against the approved dataset and thresholds.
3. Pre-provision model artifacts in the AI deployment. Do not download model
   weights during an application request or commit weights/caches to Git.
4. Confirm the embedding input remains limited to the fields produced by
   `ReportInput.EmbeddingText()` and contains no private claim evidence.
5. Take and verify the normal database backup even though the expand migration
   is additive.

## Rollout sequence

1. Apply `000009_report_embeddings_384.up.sql`. It creates an empty
   `report_embeddings_384` table with `vector(384)` and an HNSW cosine index.
2. Deploy the AI service version that keeps the same endpoint/request shape and
   returns exactly 384 finite values per item.
3. Run an internal contract smoke test and verify the returned model/config
   versions and vector length before enabling Go matching traffic.
4. Deploy the Go API change that rejects non-384 responses and reads/writes
   `report_embeddings_384`.
5. Run the dedicated re-embed command in bounded batches. Use a stable report
   ID cursor, no more than the AI contract's 101 items per request, a bounded
   concurrency limit, retry with backoff, and resumable checkpoints.
6. Re-embed active matching-eligible reports first, then any retained report
   whose legacy embedding must remain searchable under product retention rules.
7. Upsert by `report_id`; record the exact model/config versions returned by the
   AI service and update `updated_at` only after a full batch validates.
8. Monitor batch error rate, AI latency, database write latency, index growth,
   and matching-unavailable responses throughout the rollout.

## Progress checks

Use the deployed model/config values when measuring coverage:

```sql
SELECT
    count(*) FILTER (WHERE r.status = 'active') AS eligible_active_reports,
    count(*) FILTER (
        WHERE r.status = 'active'
          AND e.report_id IS NOT NULL
          AND e.model_version = '<deployed-model-version>'
          AND e.config_version = '<deployed-config-version>'
    ) AS reembedded_active_reports
FROM reports r
LEFT JOIN report_embeddings_384 e ON e.report_id = r.id
WHERE r.report_type IN ('lost', 'found');
```

Check for version drift:

```sql
SELECT model_version, config_version, count(*)
FROM report_embeddings_384
GROUP BY model_version, config_version
ORDER BY count(*) DESC;
```

After representative data exists, use `EXPLAIN (ANALYZE, BUFFERS)` on the
actual cosine-distance retrieval query and confirm the HNSW index is suitable
for the dataset and query filters. Do not claim index effectiveness from schema
creation alone.

## Acceptance gates

- Every successful AI response item has exactly 384 finite values.
- Active-report coverage for the selected model/config reaches the approved
  target, with no unexplained missing IDs or mixed-version retrieval.
- Thai, English, and cross-language regression metrics meet the approved
  evaluation baseline.
- Matching error rate and latency remain within the operational target.
- Sampled matches expose only public-safe report data and remain discovery
  suggestions rather than ownership decisions.

## Rollback

If the AI or Go cutover fails, stop the backfill and roll the Go API and AI
service back together. The legacy `report_embeddings` table and 32-dimensional
vectors remain available because migration `000009` does not modify them.

Do not run `000009_report_embeddings_384.down.sql` until the rollback decision
is final; it drops the new 384-dimensional table and its derived vectors. A
later, separately approved contract migration may remove the legacy table only
after coverage, evaluation, backup, and rollback requirements are satisfied.
