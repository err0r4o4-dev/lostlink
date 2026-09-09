package auth

import (
	"sync"
	"time"
)

type attemptWindow struct {
	count int
	start time.Time
}

type attemptLimiter struct {
	mu      sync.Mutex
	entries map[string]attemptWindow
	limit   int
	window  time.Duration
}

func newAttemptLimiter(limit int, window time.Duration) *attemptLimiter {
	return &attemptLimiter{entries: make(map[string]attemptWindow), limit: limit, window: window}
}

func (limiter *attemptLimiter) Allow(key string, now time.Time) bool {
	limiter.mu.Lock()
	defer limiter.mu.Unlock()

	entry := limiter.entries[key]
	if entry.start.IsZero() && len(limiter.entries) >= 10_000 {
		for existingKey, existing := range limiter.entries {
			if now.Sub(existing.start) >= limiter.window {
				delete(limiter.entries, existingKey)
			}
		}
		if len(limiter.entries) >= 10_000 {
			return false
		}
	}
	if entry.start.IsZero() || now.Sub(entry.start) >= limiter.window {
		limiter.entries[key] = attemptWindow{count: 1, start: now}
		return true
	}
	if entry.count >= limiter.limit {
		return false
	}
	entry.count++
	limiter.entries[key] = entry
	return true
}

func (limiter *attemptLimiter) Reset(key string) {
	limiter.mu.Lock()
	delete(limiter.entries, key)
	limiter.mu.Unlock()
}
