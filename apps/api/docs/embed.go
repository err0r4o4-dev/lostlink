// Package docs embeds the public LostLink OpenAPI contract into the API binary.
package docs

import _ "embed"

// OpenAPI contains the canonical Swagger UI-compatible OpenAPI 3 specification.
//
//go:embed swagger.yaml
var OpenAPI []byte
