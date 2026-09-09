# API Conventions

## Surface

- Public application endpoints use JSON under `/v1`.
- `/health` is an unversioned operational liveness endpoint.
- The canonical OpenAPI 3.1 contract is `apps/api/docs/swagger.yaml` and is embedded into the Go API binary.
- Scalar API Reference is served at `/docs`, and the source document is served at `/docs/swagger.yaml`; both describe public Go endpoints only.
- The legacy `/swagger/index.html` route redirects to `/docs`.
- Internal AI endpoints are not included in public Swagger.

## DTOs and errors

Use explicit request and response DTOs. Do not serialize persistence rows or model-service objects directly. Dates/times use ISO 8601; identifiers are opaque strings; optional fields have documented nullability.

Common error shape:

```json
{
  "error": {
    "code": "validation_failed",
    "message": "Request validation failed",
    "request_id": "optional-correlation-id",
    "details": []
  }
}
```

Use predictable status codes: 400 invalid syntax, 401 missing/invalid authentication, 403 authenticated but disallowed, 404 absent or deliberately concealed, 409 state conflict, 422 semantic validation, 429 rate limited, and 500 safe internal failure.

## Change discipline

For every public endpoint change, update Swagger annotations/generated artifacts, route docs, Go behavior, web types/client, examples, and tests together. Protected endpoints declare BearerAuth and receive authentication plus authorization review. Breaking changes require an explicit version/migration plan.
