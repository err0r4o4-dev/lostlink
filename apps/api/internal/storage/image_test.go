package storage

import (
	"bytes"
	"errors"
	"image"
	"image/color"
	"image/png"
	"strings"
	"testing"
)

func TestPrepareImageSanitizesPNG(t *testing.T) {
	input := image.NewRGBA(image.Rect(0, 0, 12, 8))
	input.Set(2, 3, color.RGBA{R: 10, G: 20, B: 30, A: 255})
	var encoded bytes.Buffer
	if err := png.Encode(&encoded, input); err != nil {
		t.Fatal(err)
	}

	prepared, err := PrepareImage(bytes.NewReader(encoded.Bytes()))
	if err != nil {
		t.Fatal(err)
	}
	if prepared.ContentType != "image/png" || prepared.Width != 12 || prepared.Height != 8 || len(prepared.Data) == 0 {
		t.Fatalf("prepared image = %#v", prepared)
	}
}

func TestPrepareImageRejectsNonImageAndOversize(t *testing.T) {
	if _, err := PrepareImage(strings.NewReader("not an image")); !errors.Is(err, ErrInvalidImage) {
		t.Fatalf("non-image error = %v", err)
	}
	if _, err := PrepareImage(bytes.NewReader(make([]byte, MaxImageBytes+1))); !errors.Is(err, ErrImageTooLarge) {
		t.Fatalf("oversized error = %v", err)
	}
}

func TestNewObjectKeyDoesNotUseUserFilename(t *testing.T) {
	key, err := NewObjectKey("reports", "11111111-1111-4111-8111-111111111111", "image/jpeg")
	if err != nil {
		t.Fatal(err)
	}
	if !strings.HasPrefix(key, "reports/11111111-1111-4111-8111-111111111111/") || !strings.HasSuffix(key, ".jpg") {
		t.Fatalf("object key = %q", key)
	}
}
