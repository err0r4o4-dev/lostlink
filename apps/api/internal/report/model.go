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
	CreatedAt           time.Time  `json:"created_at"`
	WithdrawnAt         *time.Time `json:"withdrawn_at,omitempty"`
}

type SearchFilter struct {
	Query    string
	Category string
	Type     Type
	Limit    int
	Offset   int
}
