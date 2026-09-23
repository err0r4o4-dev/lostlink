package storage

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

type Object struct {
	Body        io.ReadCloser
	Size        int64
	ContentType string
}

type Store interface {
	Put(context.Context, string, []byte, string) error
	Get(context.Context, string) (Object, error)
	Delete(context.Context, string) error
}

type S3Store struct {
	client *minio.Client
	bucket string
}

func NewS3Store(endpoint, bucket, accessKey, secretKey string, useSSL bool) (*S3Store, error) {
	if endpoint == "" || bucket == "" || accessKey == "" || secretKey == "" {
		return nil, errors.New("object storage configuration is incomplete")
	}
	client, err := minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKey, secretKey, ""),
		Secure: useSSL,
	})
	if err != nil {
		return nil, fmt.Errorf("create object storage client: %w", err)
	}
	return &S3Store{client: client, bucket: bucket}, nil
}

func (store *S3Store) EnsureBucket(ctx context.Context) error {
	exists, err := store.client.BucketExists(ctx, store.bucket)
	if err != nil {
		return fmt.Errorf("check object storage bucket: %w", err)
	}
	if exists {
		return nil
	}
	if err := store.client.MakeBucket(ctx, store.bucket, minio.MakeBucketOptions{}); err != nil {
		return fmt.Errorf("create object storage bucket: %w", err)
	}
	return nil
}

func (store *S3Store) Put(ctx context.Context, key string, data []byte, contentType string) error {
	_, err := store.client.PutObject(ctx, store.bucket, key, bytes.NewReader(data), int64(len(data)), minio.PutObjectOptions{ContentType: contentType})
	if err != nil {
		return fmt.Errorf("put object: %w", err)
	}
	return nil
}

func (store *S3Store) Get(ctx context.Context, key string) (Object, error) {
	object, err := store.client.GetObject(ctx, store.bucket, key, minio.GetObjectOptions{})
	if err != nil {
		return Object{}, fmt.Errorf("get object: %w", err)
	}
	info, err := object.Stat()
	if err != nil {
		_ = object.Close()
		return Object{}, fmt.Errorf("stat object: %w", err)
	}
	return Object{Body: object, Size: info.Size, ContentType: info.ContentType}, nil
}

func (store *S3Store) Delete(ctx context.Context, key string) error {
	if err := store.client.RemoveObject(ctx, store.bucket, key, minio.RemoveObjectOptions{}); err != nil {
		return fmt.Errorf("delete object: %w", err)
	}
	return nil
}
