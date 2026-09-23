CREATE TABLE return_arrangements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id uuid NOT NULL UNIQUE REFERENCES claims(id) ON DELETE RESTRICT,
    created_by uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    status text NOT NULL DEFAULT 'scheduling'
        CHECK (status IN ('scheduling', 'scheduled', 'picked_up', 'returned', 'closed', 'cancelled')),
    pickup_at timestamptz,
    pickup_location text CHECK (pickup_location IS NULL OR char_length(pickup_location) BETWEEN 2 AND 240),
    private_notes text CHECK (private_notes IS NULL OR char_length(private_notes) <= 1000),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    completed_at timestamptz,
    closed_at timestamptz,
    CONSTRAINT return_arrangements_schedule_consistent CHECK (
        status IN ('scheduling', 'cancelled') OR (pickup_at IS NOT NULL AND pickup_location IS NOT NULL)
    ),
    CONSTRAINT return_arrangements_completion_consistent CHECK (
        status NOT IN ('returned', 'closed') OR completed_at IS NOT NULL
    ),
    CONSTRAINT return_arrangements_closed_consistent CHECK (
        status <> 'closed' OR closed_at IS NOT NULL
    )
);

CREATE INDEX return_arrangements_status_updated_idx
    ON return_arrangements (status, updated_at DESC);

CREATE TABLE tracking_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_type text NOT NULL CHECK (subject_type IN ('report', 'claim', 'return')),
    subject_id uuid NOT NULL,
    event_type text NOT NULL CHECK (char_length(event_type) BETWEEN 1 AND 120),
    actor_id uuid REFERENCES users(id) ON DELETE SET NULL,
    message text NOT NULL CHECK (char_length(message) BETWEEN 1 AND 500),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX tracking_events_subject_created_idx
    ON tracking_events (subject_type, subject_id, created_at, id);

CREATE TABLE notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type text NOT NULL CHECK (char_length(notification_type) BETWEEN 1 AND 80),
    title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 160),
    message text NOT NULL CHECK (char_length(message) BETWEEN 1 AND 500),
    related_path text CHECK (related_path IS NULL OR char_length(related_path) BETWEEN 1 AND 500),
    read_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX notifications_user_unread_idx
    ON notifications (user_id, created_at DESC)
    WHERE read_at IS NULL;

CREATE INDEX notifications_user_created_idx
    ON notifications (user_id, created_at DESC, id DESC);
