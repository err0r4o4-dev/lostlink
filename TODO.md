# Task: Implement Full-Stack Localization (Thai/English)

## Task Scope Contract
- **TASK**: Implement full-stack localization (Thai/English).
- **OWNER**: apps/web, apps/api, apps/ai.
- **FEATURE**: Multi-language Support (i18n).
- **SUB-SCOPE**: Global language state, API header injection, Go middleware, Python prompt localization.
- **GOAL**: Ensure UI, API responses, and AI outputs dynamically switch between Thai and English.

## Phase 1: Frontend (`apps/web`) Setup
- [x] Use existing custom `LanguageProvider` state.
- [x] Inject `Accept-Language` header into API clients using `localStorage`.

## Phase 2: Go Backend (`apps/api`) Setup
- [x] Create `i18n` middleware to parse `Accept-Language`.
- [x] Inject parsed language into Gin Context.
- [x] Extract language in `aichat.Service` and inject into Python request.

## Phase 3: Python AI (`apps/ai`) Setup
- [x] Update `ChatRequest` to accept `language` parameter.
- [x] Adjust System Prompts in LLM service to enforce target language based on request payload.

## Phase 4: Verification
- [ ] Frontend typecheck/lint.
- [ ] Go API build.
- [ ] Python ruff/pytest.

---

# Task: Implement AI Chat Feature
(Completed)