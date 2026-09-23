package storage

import (
	"bytes"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"image"
	"image/jpeg"
	"image/png"
	"io"
	"path"
	"strings"
)

const (
	MaxImageBytes  = 8 << 20
	MaxImageWidth  = 6000
	MaxImageHeight = 6000
	maxImagePixels = 24_000_000
)

var (
	ErrInvalidImage  = errors.New("invalid image")
	ErrImageTooLarge = errors.New("image too large")
)

type PreparedImage struct {
	Data        []byte
	ContentType string
	Width       int
	Height      int
	SHA256      [32]byte
}

// PrepareImage decodes and re-encodes supported images, removing embedded metadata.
func PrepareImage(reader io.Reader) (PreparedImage, error) {
	raw, err := io.ReadAll(io.LimitReader(reader, MaxImageBytes+1))
	if err != nil {
		return PreparedImage{}, fmt.Errorf("read image: %w", err)
	}
	if len(raw) == 0 {
		return PreparedImage{}, ErrInvalidImage
	}
	if len(raw) > MaxImageBytes {
		return PreparedImage{}, ErrImageTooLarge
	}

	config, format, err := image.DecodeConfig(bytes.NewReader(raw))
	if err != nil || (format != "jpeg" && format != "png") {
		return PreparedImage{}, ErrInvalidImage
	}
	if config.Width < 1 || config.Height < 1 || config.Width > MaxImageWidth || config.Height > MaxImageHeight || config.Width*config.Height > maxImagePixels {
		return PreparedImage{}, ErrImageTooLarge
	}

	decoded, decodedFormat, err := image.Decode(bytes.NewReader(raw))
	if err != nil || decodedFormat != format {
		return PreparedImage{}, ErrInvalidImage
	}

	var sanitized bytes.Buffer
	var contentType string
	switch format {
	case "jpeg":
		contentType = "image/jpeg"
		err = jpeg.Encode(&sanitized, decoded, &jpeg.Options{Quality: 90})
	case "png":
		contentType = "image/png"
		err = png.Encode(&sanitized, decoded)
	default:
		return PreparedImage{}, ErrInvalidImage
	}
	if err != nil {
		return PreparedImage{}, fmt.Errorf("sanitize image: %w", err)
	}
	if sanitized.Len() > MaxImageBytes {
		return PreparedImage{}, ErrImageTooLarge
	}
	data := sanitized.Bytes()
	return PreparedImage{
		Data: data, ContentType: contentType, Width: config.Width, Height: config.Height, SHA256: sha256.Sum256(data),
	}, nil
}

func NewObjectKey(scope, ownerID, contentType string) (string, error) {
	if scope == "" || ownerID == "" || strings.ContainsAny(scope+ownerID, `/\\`) {
		return "", errors.New("invalid object key scope")
	}
	random := make([]byte, 16)
	if _, err := rand.Read(random); err != nil {
		return "", fmt.Errorf("generate object key: %w", err)
	}
	extension := ".jpg"
	if contentType == "image/png" {
		extension = ".png"
	}
	return path.Join(scope, ownerID, hex.EncodeToString(random)+extension), nil
}
