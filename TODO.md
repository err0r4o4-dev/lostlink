# Task: Implement AI Chat Feature

## Task Scope Contract
- **TASK**: Implement AI Chat feature with history and analysis tracking.
- **OWNER**: Full-stack (Database, Go API, Python AI Service, React PWA).
- **FEATURE**: AI Chat Menu.
- **SUB-SCOPE**: Database schemas, LLM integration, Chat UI.
- **GOAL**: Enable users to converse with an LLM for item discovery, generating dynamic chat titles and securely tracking analysis metadata.

## Phase 1: Database Migrations
- [x] Create `000010_ai_chat.up.sql` and `000010_ai_chat.down.sql` in `database/migrations/`.
- [x] Define `ai_chat_sessions` table.
- [x] Define `ai_chat_messages` table.

## Phase 2: Python AI Service (`apps/ai`)
- [x] Define schemas in `apps/ai/app/schemas/chat.py`.
- [x] Implement LLM interaction logic in `apps/ai/app/services/llm.py` (structured JSON output).
- [x] Expose endpoint `POST /internal/v1/chat/generate` in `apps/ai/app/api/routes/chat.py`.
- [x] Register router in `apps/ai/app/api/router.py`.

## Phase 3: Go API (`apps/api`)
- [x] Create module `apps/api/internal/aichat`.
- [x] Implement `model.go` (Session, Message structs).
- [x] Implement `repository.go` (Save/Fetch sessions and messages).
- [x] Extend AI client to call Python chat endpoint.
- [x] Implement `service.go` (Business logic, orchestration).
- [x] Implement `http.go` (Routes: GET/POST chats, GET/POST messages).
- [x] Register routes in `main.go`.

## Phase 4: Frontend (`apps/web`)
- [x] Create `apps/web/src/features/chat/chat-api.ts`.
- [x] Create `apps/web/src/pages/AIChatPage.tsx` with sidebar (history) and main chat view.
- [x] Add route to `apps/web/src/routes/router.tsx`.
- [x] Add i18n entries if necessary.

## Phase 5: Verification & Cleanup
- [x] Run database migrations (`make migrate-up`).
- [x] Run backend tests (`cd apps/api && go test ./...`).
- [x] Run frontend checks (`npm run lint`, `npm run typecheck`).
- [x] Verify E2E flow works correctly from browser.
