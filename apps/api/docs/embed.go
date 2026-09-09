// Package docs embeds the public LostLink OpenAPI contract into the API binary.
package docs

import _ "embed"

// OpenAPI contains the canonical Scalar-compatible OpenAPI 3.1 specification.
//
//go:embed swagger.yaml
var OpenAPI []byte
