# Definition of Done

A change is complete only when:

- the task scope guard and acceptance criteria are satisfied with no unrelated changes;
- implementation and failure states are complete for the assigned sub-scope;
- appropriate unit, integration, contract, E2E, migration, or AI evaluation checks pass;
- public API changes update Swagger, docs, providers, consumers, and tests;
- schema changes use new paired migrations and were exercised on disposable PostgreSQL when practical;
- protected behavior receives auth/RBAC review; sensitive or upload behavior receives security/privacy review;
- AI changes preserve the ownership boundary and include versioned evaluation evidence;
- documentation, environment examples, and deployment configuration match actual behavior;
- no secrets, personal data, build output, model weights, or disabled/weakened tests are included;
- QA/reviewer findings are resolved or explicitly accepted, and a human approves the PR.

