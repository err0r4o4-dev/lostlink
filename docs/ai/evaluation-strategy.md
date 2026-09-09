# AI Evaluation Strategy

Every matching change requires evidence before integration.

## Dataset and splits

Use consented or synthetic/de-identified representative examples with documented provenance, license, retention, and known gaps. Prevent the same physical item or near-duplicate images from crossing train/tuning/test partitions. Maintain challenging negatives and campus-specific variation without including ownership secrets.

## Metrics

- Retrieval: Recall@K, Precision@K, mean reciprocal rank, and candidate coverage.
- Ranking: nDCG@K or a documented equivalent.
- Operations: latency percentiles, error/degraded rate, embedding throughput, and storage size.
- Safety/quality slices: category, image quality, description length/language, location/time sparsity, and other approved non-sensitive slices.

## Change evidence

Record dataset version, model and preprocessing version, configuration/thresholds, baseline versus candidate metrics, slice regressions, latency/cost impact, and reviewer decision. Thresholds are product tradeoffs, not universal proof values.

Evaluation must include false-positive review because incorrect confident suggestions can expose item details. Human/staff outcome data must not be reused for training without an approved privacy and consent basis.

