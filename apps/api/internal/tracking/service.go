package tracking

import (
	"context"
	"regexp"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/err0r4o4-dev/lostlink/apps/api/internal/auth"
)

var uuidPattern = regexp.MustCompile(`^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$`)

type Store interface {
	Create(context.Context, string, string) (ReturnArrangement, error)
	ByID(context.Context, string) (ReturnArrangement, error)
	Timeline(context.Context, string, string, bool) (Timeline, error)
	StaffList(context.Context, ReturnStatus, int, int) ([]ReturnArrangement, error)
	Schedule(context.Context, string, string, time.Time, string, string) (ReturnArrangement, error)
	Transition(context.Context, string, string, Transition) (ReturnArrangement, error)
}

type Service struct{ store Store }

func NewService(store Store) *Service { return &Service{store: store} }

func (service *Service) Create(ctx context.Context, actorID, claimID string) (ReturnArrangement, error) {
	if !uuidPattern.MatchString(claimID) {
		return ReturnArrangement{}, ErrInvalid
	}
	return service.store.Create(ctx, actorID, claimID)
}

func (service *Service) ByID(ctx context.Context, principal auth.User, returnID string) (ReturnArrangement, error) {
	if !uuidPattern.MatchString(returnID) {
		return ReturnArrangement{}, ErrNotFound
	}
	value, err := service.store.ByID(ctx, returnID)
	if err != nil {
		return ReturnArrangement{}, err
	}
	if principal.Role == auth.RoleUser && principal.ID != value.ClaimantID && principal.ID != value.FoundReporterID {
		return ReturnArrangement{}, ErrNotFound
	}
	if principal.Role == auth.RoleUser {
		value.PrivateNotes = nil
	}
	return value, nil
}

func (service *Service) Timeline(ctx context.Context, principal auth.User, reference string) (Timeline, error) {
	if !uuidPattern.MatchString(reference) {
		return Timeline{}, ErrNotFound
	}
	return service.store.Timeline(ctx, principal.ID, reference, principal.Role == auth.RoleStaff || principal.Role == auth.RoleAdmin)
}

func (service *Service) StaffList(ctx context.Context, status ReturnStatus, limit, offset int) ([]ReturnArrangement, error) {
	if status != "" && !validStatus(status) {
		return nil, ErrInvalid
	}
	limit, offset = pageBounds(limit, offset)
	return service.store.StaffList(ctx, status, limit, offset)
}

func (service *Service) Schedule(ctx context.Context, actorID, returnID string, input ScheduleInput) (ReturnArrangement, error) {
	input.PickupLocation = strings.TrimSpace(input.PickupLocation)
	input.PrivateNotes = strings.TrimSpace(input.PrivateNotes)
	pickupAt, err := time.Parse(time.RFC3339, input.PickupAt)
	if !uuidPattern.MatchString(returnID) || err != nil || !pickupAt.After(time.Now().UTC()) || pickupAt.After(time.Now().UTC().AddDate(1, 0, 0)) ||
		!lengthBetween(input.PickupLocation, 2, 240) || utf8.RuneCountInString(input.PrivateNotes) > 1000 {
		return ReturnArrangement{}, ErrInvalid
	}
	return service.store.Schedule(ctx, actorID, returnID, pickupAt.UTC(), input.PickupLocation, input.PrivateNotes)
}

func (service *Service) Transition(ctx context.Context, actorID, returnID string, transition Transition) (ReturnArrangement, error) {
	if !uuidPattern.MatchString(returnID) || (transition != TransitionPickup && transition != TransitionComplete && transition != TransitionClose && transition != TransitionCancel) {
		return ReturnArrangement{}, ErrInvalid
	}
	return service.store.Transition(ctx, actorID, returnID, transition)
}

func validStatus(value ReturnStatus) bool {
	return value == StatusScheduling || value == StatusScheduled || value == StatusPickedUp || value == StatusReturned || value == StatusClosed || value == StatusCancelled
}

func lengthBetween(value string, minimum, maximum int) bool {
	length := utf8.RuneCountInString(value)
	return length >= minimum && length <= maximum
}

func pageBounds(limit, offset int) (int, int) {
	if limit <= 0 {
		limit = 20
	}
	if limit > 50 {
		limit = 50
	}
	if offset < 0 {
		offset = 0
	}
	if offset > 10_000 {
		offset = 10_000
	}
	return limit, offset
}
