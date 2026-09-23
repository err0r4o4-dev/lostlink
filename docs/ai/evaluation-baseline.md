# Bootstrap Matching Evaluation

## Version

- Model: `bootstrap-hash-embedding-v1`
- Configuration: `public-safe-32d-v1`
- Vector: 32 dimensions, L2-normalized
- Retrieval: pgvector cosine distance
- Candidate filters: active found reports, same normalized category, within 180 days
- Result threshold: cosine-derived score at least `0.10`, top 20

## Evidence

`apps/ai/tests/test_evaluation.py` contains three synthetic, non-sensitive
public-safe lost/found queries with one intended candidate and two unrelated
candidates each. The checked baseline result is Recall@1 `3/3 = 1.0` for this
small deterministic fixture. Unit tests also verify stable vectors, version
metadata, dimensionality, service authentication, and input bounds.

## Limitations

This fixture is a contract/regression check, not product-quality evidence. It
does not establish campus-language coverage, calibrated Precision@K, MRR/nDCG,
image performance, fairness, or production latency. The baseline can miss
synonyms and may over-weight shared words. It must remain labeled uncertain and
must not approve claims. Replacing it with a learned text/image model requires
an approved versioned dataset, leakage-safe split, slice metrics, false-positive
review, latency/cost evidence, and explicit human approval.
