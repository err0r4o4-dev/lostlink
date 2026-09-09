# Task ID Conventions

| Owner | Task form | Example |
| --- | --- | --- |
| Technical Lead | natural feature | `authentication`, `lost-report`, `matching` |
| Person 2 | `FE-xx [UI scope]` | `FE-04 [Matching UI]` |
| Person 3 | same FE ID, integration scope | `FE-04 [Matching Integration]` |
| Person 4 | `AI-xx` | `AI-01 [Image Embedding]` |
| Person 5 | `QA-xx` / `OPS-xx` | `QA-04`, `OPS-01 [Docker]` |

Person 2 and Person 3 share a feature ID only with non-overlapping sub-scopes. One task/sub-scope equals one branch and one PR. Bugs append a sequence to the owning task or Technical Lead feature: `BUG-FE-04-01`, `BUG-AI-01-01`, `BUG-authentication-01`.

The initial roadmap and ownership checklist live in `TODO.md`.

