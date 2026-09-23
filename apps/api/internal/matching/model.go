package matching

import (
	"errors"
	"time"
)

var (
	ErrInvalid       = errors.New("invalid matching request")
	ErrNotFound      = errors.New("match or report not found")
	ErrForbidden     = errors.New("matching access forbidden")
	ErrInvalidState  = errors.New("report state does not allow matching")
	ErrRunInProgress = errors.New("matching run already in progress")
	ErrAIUnavailable = errors.New("AI matching service unavailable")
	ErrRateLimited   = errors.New("matching rate limit reached")
)

type RunStatus string

const (
	RunProcessing RunStatus = "processing"
	RunCompleted  RunStatus = "completed"
	RunFailed     RunStatus = "failed"
)

type Run struct {
	ID             string     `json:"id"`
	ReportID       string     `json:"report_id"`
	RequestedBy    string     `json:"-"`
	Status         RunStatus  `json:"status"`
	ModelVersion   *string    `json:"model_version,omitempty"`
	ConfigVersion  *string    `json:"config_version,omitempty"`
	CandidateCount int        `json:"candidate_count"`
	FailureCode    *string    `json:"failure_code,omitempty"`
	CreatedAt      time.Time  `json:"created_at"`
	CompletedAt    *time.Time `json:"completed_at,omitempty"`
}

type ReportInput struct {
	ID                  string
	ReporterID          string
	ReportType          string
	ItemName            string
	Category            string
	PublicDescription   string
	EventDate           string
	ApproximateLocation string
	Status              string
}

func (input ReportInput) EmbeddingText() string {
	return input.ItemName + "\n" + input.Category + "\n" + input.PublicDescription + "\n" + input.ApproximateLocation + "\n" + input.EventDate
}

type Candidate struct {
	ID                  string    `json:"id"`
	ReportType          string    `json:"report_type"`
	ItemName            string    `json:"item_name"`
	Category            string    `json:"category"`
	PublicDescription   string    `json:"public_description"`
	EventDate           string    `json:"event_date"`
	ApproximateLocation string    `json:"approximate_location"`
	CreatedAt           time.Time `json:"created_at"`
	Status              string    `json:"-"`
}

type Match struct {
	ID             string    `json:"id"`
	SourceReportID string    `json:"source_report_id"`
	Score          float64   `json:"score"`
	Signals        []string  `json:"signals"`
	ModelVersion   string    `json:"model_version"`
	ConfigVersion  string    `json:"config_version"`
	ReviewStatus   string    `json:"review_status"`
	CreatedAt      time.Time `json:"created_at"`
	Candidate      Candidate `json:"candidate"`
}

type EmbeddingInput struct {
	ID   string `json:"id"`
	Text string `json:"text"`
}

type Embedding struct {
	ID     string    `json:"id"`
	Vector []float64 `json:"vector"`
}

type EmbeddingResult struct {
	ModelVersion  string      `json:"model_version"`
	ConfigVersion string      `json:"config_version"`
	Items         []Embedding `json:"items"`
}

type ReviewAction string

const (
	ReviewMark    ReviewAction = "review"
	ReviewDismiss ReviewAction = "dismiss"
)
