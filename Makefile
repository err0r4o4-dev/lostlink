.PHONY: web-check api-check ai-check check compose-config

web-check:
	cd apps/web && npm run lint && npm run typecheck && npm test -- --run && npm run build

api-check:
	cd apps/api && gofmt -w cmd internal docs && go vet ./... && go test ./... && go build -o .cache/lostlink-api ./cmd/api

ai-check:
	cd apps/ai && python -m pip install -e ".[dev]" && python -m ruff check . && python -m pytest

compose-config:
	docker compose --env-file .env.example config

check: web-check api-check ai-check compose-config
