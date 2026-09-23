package report

import (
	"errors"
	"time"
)

type Type string

const (
	TypeLost  Type = "lost"
	TypeFound Type = "found"
)

var (
	ErrInvalid             = errors.New("invalid report")
	ErrNotFound            = errors.New("report not found")
	ErrIdempotencyConflict = errors.New("idempotency key reused with different content")
	ErrInvalidState        = errors.New("report state does not allow this action")
	ErrTooManyImages       = errors.New("report image limit reached")
	ErrStorageUnavailable  = errors.New("object storage unavailable")
)

type CreateInput struct {
	ReportType          Type   `json:"report_type"`
	ItemName            string `json:"item_name"`
	Category            string `json:"category"`
	PublicDescription   string `json:"public_description"`
	EventDate           string `json:"event_date"`
	ApproximateTime     string `json:"approximate_time"`
	ApproximateLocation string `json:"approximate_location"`
}

type Report struct {
	ID                  string     `json:"id"`
	ReportType          Type       `json:"report_type"`
	ItemName            string     `json:"item_name"`
	Category            string     `json:"category"`
	PublicDescription   string     `json:"public_description"`
	EventDate           string     `json:"event_date"`
	ApproximateTime     *string    `json:"approximate_time"`
	ApproximateLocation string     `json:"approximate_location"`
	Status              Status     `json:"status"`
	CreatedAt           time.Time  `json:"created_at"`
	WithdrawnAt         *time.Time `json:"withdrawn_at,omitempty"`
	ClosedAt            *time.Time `json:"closed_at,omitempty"`
}

type Status string

const (
	StatusActive    Status = "active"
	StatusWithdrawn Status = "withdrawn"
	StatusHidden    Status = "hidden"
	StatusClosed    Status = "closed"
)

type UpdateInput struct {
	ItemName            *string `json:"item_name"`
	Category            *string `json:"category"`
	PublicDescription   *string `json:"public_description"`
	EventDate           *string `json:"event_date"`
	ApproximateTime     *string `json:"approximate_time"`
	ApproximateLocation *string `json:"approximate_location"`
}

type Image struct {
	ID          string    `json:"id"`
	ContentType string    `json:"content_type"`
	SizeBytes   int64     `json:"size_bytes"`
	Width       int       `json:"width"`
	Height      int       `json:"height"`
	IsPrimary   bool      `json:"is_primary"`
	CreatedAt   time.Time `json:"created_at"`
	ObjectKey   string    `json:"-"`
}

type StoredImage struct {
	ObjectKey   string
	ContentType string
	SizeBytes   int64
	Width       int
	Height      int
	SHA256      [32]byte
}

type ModerationAction string

const (
	ModerationHide    ModerationAction = "hide"
	ModerationRestore ModerationAction = "restore"
	ModerationClose   ModerationAction = "close"
)

type SearchFilter struct {
	Query    string
	Category string
	Type     Type
	Limit    int
	Offset   int
}
