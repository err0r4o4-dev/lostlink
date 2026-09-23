package storage

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

// ProcessCleanup retries deletion of private objects whose metadata was already removed.
func ProcessCleanup(ctx context.Context, pool *pgxpool.Pool, objects Store, limit int) (int, int, error) {
	if pool == nil || objects == nil {
		return 0, 0, nil
	}
	if limit <= 0 || limit > 100 {
		limit = 100
	}
	rows, err := pool.Query(ctx, `
		SELECT id::text, object_key FROM object_cleanup_tasks
		WHERE completed_at IS NULL
		ORDER BY created_at, id LIMIT $1`, limit)
	if err != nil {
		return 0, 0, fmt.Errorf("list object cleanup tasks: %w", err)
	}
	type task struct{ id, key string }
	tasks := make([]task, 0)
	for rows.Next() {
		var value task
		if err := rows.Scan(&value.id, &value.key); err != nil {
			rows.Close()
			return 0, 0, fmt.Errorf("scan object cleanup task: %w", err)
		}
		tasks = append(tasks, value)
	}
	if err := rows.Err(); err != nil {
		rows.Close()
		return 0, 0, fmt.Errorf("iterate object cleanup tasks: %w", err)
	}
	rows.Close()

	cleaned, failed := 0, 0
	for _, task := range tasks {
		if err := objects.Delete(ctx, task.key); err != nil {
			failed++
			if _, updateErr := pool.Exec(ctx, `
				UPDATE object_cleanup_tasks SET attempts = attempts + 1, last_error_at = now()
				WHERE id = $1::uuid`, task.id); updateErr != nil {
				return cleaned, failed, fmt.Errorf("record object cleanup failure: %w", updateErr)
			}
			continue
		}
		if _, err := pool.Exec(ctx, `
			UPDATE object_cleanup_tasks SET attempts = attempts + 1, completed_at = now()
			WHERE id = $1::uuid`, task.id); err != nil {
			return cleaned, failed, fmt.Errorf("complete object cleanup task: %w", err)
		}
		cleaned++
	}
	return cleaned, failed, nil
}
