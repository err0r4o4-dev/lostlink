package tracking

import (
	"errors"
	"time"
)

var (
	ErrInvalid      = errors.New("invalid tracking request")
	ErrNotFound     = errors.New("tracking resource not found")
	ErrConflict     = errors.New("return arrangement already exists")
	ErrInvalidState = errors.New("return state does not allow this action")
)

type ReturnStatus string

const (
	StatusScheduling ReturnStatus = "scheduling"
	StatusScheduled  ReturnStatus = "scheduled"
	StatusPickedUp   ReturnStatus = "picked_up"
	StatusReturned   ReturnStatus = "returned"
	StatusClosed     ReturnStatus = "closed"
	StatusCancelled  ReturnStatus = "cancelled"
)

type ReturnArrangement struct {
	ID              string       `json:"id"`
	ClaimID         string       `json:"claim_id"`
	Status          ReturnStatus `json:"status"`
	PickupAt        *time.Time   `json:"pickup_at,omitempty"`
	PickupLocation  *string      `json:"pickup_location,omitempty"`
	PrivateNotes    *string      `json:"private_notes,omitempty"`
	CreatedAt       time.Time    `json:"created_at"`
	UpdatedAt       time.Time    `json:"updated_at"`
	CompletedAt     *time.Time   `json:"completed_at,omitempty"`
	ClosedAt        *time.Time   `json:"closed_at,omitempty"`
	ClaimantID      string       `json:"-"`
	FoundReporterID string       `json:"-"`
	LostReportID    string       `json:"-"`
	FoundReportID   string       `json:"-"`
}

type Event struct {
	ID        string    `json:"id"`
	EventType string    `json:"event_type"`
	Message   string    `json:"message"`
	CreatedAt time.Time `json:"created_at"`
}

type Timeline struct {
	Reference     string  `json:"reference"`
	ReferenceType string  `json:"reference_type"`
	CurrentStatus string  `json:"current_status"`
	Events        []Event `json:"events"`
}

type ScheduleInput struct {
	PickupAt       string `json:"pickup_at"`
	PickupLocation string `json:"pickup_location"`
	PrivateNotes   string `json:"private_notes"`
}

type Transition string

const (
	TransitionPickup   Transition = "confirm_pickup"
	TransitionComplete Transition = "complete"
	TransitionClose    Transition = "close"
	TransitionCancel   Transition = "cancel"
)
