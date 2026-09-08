# Security Boundaries

| Boundary | Trusted responsibility | Untrusted input / primary controls |
| --- | --- | --- |
| Browser -> Caddy/Go | Go authenticates and authorizes | JWT/cookie/header data, JSON, uploads; validate size/type/schema/origin |
| Go -> PostgreSQL | Repositories use trusted identity and parameterized SQL | Never trust IDs as authorization; constrain relationships |
| Go -> object storage | Go creates keys and grants short-lived access | Validate content, prevent traversal, keep bucket private |
| Go -> AI | Go selects allowed fields and authenticates service traffic | Timeouts, response validation, no claim secrets or raw auth context |
| AI -> model/runtime | AI service bounds resources and versions artifacts | Treat images/text/model output as untrusted; no autonomous decisions |

## Data classes

- Public-safe item attributes: deliberately approved descriptions and coarse location/time fields.
- Account/private report data: identity and contact details available only to authorized flows.
- Restricted verification evidence: ownership answers, distinctive marks, receipts, serial details, and staff notes. Never expose in public item APIs or matching explanations.
- Secrets: credentials, JWT keys/tokens, storage keys, and service credentials. Never commit or log.

Similarity output cannot cross the ownership-decision boundary by itself. Claims require separately authorized evidence and staff review according to the future approved policy.

