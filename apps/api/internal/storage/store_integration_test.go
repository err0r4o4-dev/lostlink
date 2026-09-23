package storage

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"os"
	"strconv"
	"testing"
	"time"
)

func TestS3StorePutGetDelete(t *testing.T) {
	endpoint := os.Getenv("STORAGE_ENDPOINT")
	accessKey := os.Getenv("STORAGE_ACCESS_KEY")
	secretKey := os.Getenv("STORAGE_SECRET_KEY")
	bucket := os.Getenv("STORAGE_BUCKET")
	if endpoint == "" || accessKey == "" || secretKey == "" || bucket == "" {
		t.Skip("object storage integration environment is not configured")
	}
	useSSL, err := strconv.ParseBool(os.Getenv("STORAGE_USE_SSL"))
	if err != nil {
		t.Fatal(err)
	}
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	store, err := NewS3Store(endpoint, bucket, accessKey, secretKey, useSSL)
	if err != nil {
		t.Fatal(err)
	}
	if err := store.EnsureBucket(ctx); err != nil {
		t.Fatal(err)
	}

	key := fmt.Sprintf("integration/%d.txt", time.Now().UnixNano())
	data := []byte("lostlink-storage-integration")
	t.Cleanup(func() {
		cleanupCtx, cleanupCancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cleanupCancel()
		_ = store.Delete(cleanupCtx, key)
	})
	if err := store.Put(ctx, key, data, "text/plain"); err != nil {
		t.Fatal(err)
	}
	object, err := store.Get(ctx, key)
	if err != nil {
		t.Fatal(err)
	}
	received, readErr := io.ReadAll(object.Body)
	closeErr := object.Body.Close()
	if readErr != nil || closeErr != nil {
		t.Fatalf("read error=%v close error=%v", readErr, closeErr)
	}
	if object.ContentType != "text/plain" || !bytes.Equal(received, data) {
		t.Fatalf("object content type=%q data=%q", object.ContentType, received)
	}
	if err := store.Delete(ctx, key); err != nil {
		t.Fatal(err)
	}
	if _, err := store.Get(ctx, key); err == nil {
		t.Fatal("deleted object is still readable")
	}
}
