package claim

import (
	"errors"
	"time"
)

var (
	ErrInvalid             = errors.New("invalid claim request")
	ErrNotFound            = errors.New("claim not found")
	ErrConflict            = errors.New("claim already exists")
	ErrIdempotencyConflict = errors.New("idempotency key conflict")
	ErrInvalidState        = errors.New("claim state does not allow this action")
	ErrEvidenceRequired    = errors.New("claim evidence required")
	ErrEvidenceLimit       = errors.New("claim evidence limit reached")
	ErrStorageUnavailable  = errors.New("evidence storage unavailable")
)

type Status string

const (
	StatusDraft         Status = "draft"
	StatusSubmitted     Status = "submitted"
	StatusUnderReview   Status = "under_review"
	StatusNeedsMoreInfo Status = "needs_more_info"
	StatusApproved      Status = "approved"
	StatusRejected      Status = "rejected"
	StatusCancelled     Status = "cancelled"
)

type Claim struct {
	ID            string     `json:"id"`
	MatchID       string     `json:"match_id"`
	LostReportID  string     `json:"lost_report_id"`
	FoundReportID string     `json:"found_report_id"`
	ClaimantID    string     `json:"claimant_id"`
	Status        Status     `json:"status"`
	SubmittedAt   *time.Time `json:"submitted_at,omitempty"`
	ReviewedAt    *time.Time `json:"reviewed_at,omitempty"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
	Evidence      []Evidence `json:"evidence,omitempty"`
	Decisions     []Decision `json:"decisions,omitempty"`
}

type Evidence struct {
	ID           string    `json:"id"`
	EvidenceType string    `json:"evidence_type"`
	Description  string    `json:"description"`
	ContentType  *string   `json:"content_type,omitempty"`
	SizeBytes    *int64    `json:"size_bytes,omitempty"`
	Width        *int      `json:"width,omitempty"`
	Height       *int      `json:"height,omitempty"`
	ContentURL   string    `json:"content_url,omitempty"`
	CreatedAt    time.Time `json:"created_at"`
	ObjectKey    *string   `json:"-"`
}

type StoredEvidence struct {
	Description string
	ObjectKey   string
	ContentType string
	SizeBytes   int64
	Width       int
	Height      int
	SHA256      [32]byte
}

type Decision struct {
	ID             string    `json:"id"`
	Action         Action    `json:"action"`
	Reason         *string   `json:"reason,omitempty"`
	PreviousStatus Status    `json:"previous_status"`
	NextStatus     Status    `json:"next_status"`
	CreatedAt      time.Time `json:"created_at"`
}

type Action string

const (
	ActionStartReview     Action = "start_review"
	ActionRequestMoreInfo Action = "request_more_info"
	ActionApprove         Action = "approve"
	ActionReject          Action = "reject"
)
