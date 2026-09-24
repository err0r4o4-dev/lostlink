package docs

import (
	"testing"

	"gopkg.in/yaml.v3"
)

func TestOpenAPIYAML(t *testing.T) {
	var document struct {
		OpenAPI string `yaml:"openapi"`
		Info    struct {
			Title string `yaml:"title"`
		} `yaml:"info"`
		Paths map[string]any `yaml:"paths"`
	}

	if err := yaml.Unmarshal(OpenAPI, &document); err != nil {
		t.Fatalf("parse embedded OpenAPI YAML: %v", err)
	}
	if document.OpenAPI != "3.1.0" {
		t.Fatalf("openapi = %q; want 3.1.0", document.OpenAPI)
	}
	if document.Info.Title != "LostLink API" {
		t.Fatalf("info.title = %q; want LostLink API", document.Info.Title)
	}
	for _, path := range []string{
		"/health",
		"/v1/reports/{reportId}/matching-runs",
		"/v1/claims",
		"/v1/tracking/{reference}",
		"/v1/notifications",
		"/v1/staff/claims/{claimId}/decisions",
		"/v1/staff/return-arrangements/{returnId}/close",
	} {
		if _, ok := document.Paths[path]; !ok {
			t.Fatalf("OpenAPI document does not define %s", path)
		}
	}
	if _, ok := document.Paths["/internal/v1/embeddings"]; ok {
		t.Fatal("public OpenAPI document must not expose the internal AI embedding endpoint")
	}
}
