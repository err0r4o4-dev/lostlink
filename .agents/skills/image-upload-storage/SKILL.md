---
name: image-upload-storage
description: Design, implement, or review LostLink image uploads and S3-compatible storage. Use for multipart handling, validation, object keys, MinIO/S3 adapters, signed URLs, retention, deletion, or image privacy.
---

# Image Upload Storage

## Purpose

Store untrusted images safely while keeping access private and portable.

## Trigger

Use for upload endpoints, image processing, storage adapters, object access, or lifecycle policy.

## When Not To Use

Skip for UI-only image previews that do not change upload/storage behavior.

## Inputs

Read data classification, allowed formats/sizes/counts, storage config, authorization, retention, and threat model.

## Workflow

1. Validate size, count, decoded content type, dimensions, and processing limits.
2. Generate non-user-controlled object keys and strip unsafe metadata when approved.
3. Store via a narrow S3-compatible abstraction with private buckets.
4. Issue authorized short-lived access and define delete/retention/orphan cleanup.
5. Test malformed, oversized, traversal-like, unauthorized, timeout, and partial-failure cases.

## Rules

- Never store image Base64 in PostgreSQL.
- Never expose storage credentials or trust filename/Content-Type alone.
- Do not make verification evidence public or feed it to matching.
- Keep production buckets private and logs free of sensitive URLs.

## Verification

Run unit/integration tests against disposable MinIO and review auth, limits, cleanup, and configuration.

## Outputs

Produce upload/storage changes, threat controls, lifecycle notes, and test evidence.
