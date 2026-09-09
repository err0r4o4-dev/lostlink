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
	if _, ok := document.Paths["/health"]; !ok {
		t.Fatal("OpenAPI document does not define /health")
	}
}
