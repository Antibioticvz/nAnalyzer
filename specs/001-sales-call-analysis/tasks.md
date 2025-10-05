# Tasks: Sales Call Analysis System

**Input**: Design documents from `/specs/001-sales-call-analysis/`
**Prerequisites**: plan.md (✅), data-model.md (✅), contracts/ (✅), quickstart.md (✅)

## Overview

This task breakdown implements a local, privacy-first sales call analysis system with GMM speaker identification, rule-based emotion analysis (upgrading to RandomForest with user feedback), dual-language Vosk transcription, and React/Material-UI dashboard.

**Total Tasks**: 110
**Estimated Timeline**: 2 weeks (single developer)
**Tech Stack**: Python 3.9+, FastAPI, React 18, Material-UI 5, scikit-learn, Vosk, SQLite

---

## Path Conventions

```
nAnalyzer/
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI route handlers
│   │   ├── core/         # Config, database, security
│   │   ├── models/       # SQLAlchemy models
│   │   ├── schemas/      # Pydantic schemas
│   │   ├── ml/           # ML modules (GMM, Vosk, emotions)
│   │   ├── services/     # Business logic
│   │   └── utils/        # Helper functions
│   ├── tests/            # pytest tests
│   ├── models/           # Pickled models (gitignored)
│   ├── data/             # Database & uploads (gitignored)
│   └── alembic/          # Database migrations
└── frontend/
    └── src/
        ├── components/   # Reusable components
        ├── pages/        # Page components
        ├── services/     # API clients
        ├── hooks/        # React hooks
        └── types/        # TypeScript interfaces
```

---

## Phase 3.1: Setup

- [X] **T001** Create project directory structure (backend/ and frontend/ with all subdirectories per plan.md)
- [X] **T002** Initialize Python backend project (requirements.txt with FastAPI, scikit-learn, Vosk, librosa, SQLite, pytest)
- [X] **T003** Initialize React frontend project (package.json with React 18, Material-UI 5, Chart.js, TypeScript, Axios)
- [X] **T004** [P] Configure Python linting (black, flake8, mypy in backend/.pre-commit-config.yaml)
- [X] **T005** [P] Configure TypeScript linting (ESLint, Prettier in frontend/.eslintrc.json)
- [X] **T006** Create SQLite database schema migration (alembic/versions/001_initial_schema.py with users, calls, segments, alerts, emotion_feedback tables)
- [X] **T007** [P] Create .gitignore files (backend/models/, backend/data/, frontend/build/)
- [X] **T008** [P] Create .env.example files (backend/.env.example, frontend/.env.example)
- [X] **T009** Create docker-compose.yml for development environment
- [X] **T010** Download Vosk models script (backend/scripts/download_models.py for Russian and English models)

---

## Phase 3.2: Contract Definitions

- [X] **T011** [P] Create users.yaml OpenAPI contract (POST /register, POST /{id}/train-voice, GET /{id}, PUT /{id}/settings)
- [X] **T012** [P] Create analysis.yaml OpenAPI contract (POST /upload, POST /upload/{id}/chunk, POST /upload/{id}/complete)
- [X] **T013** [P] Create calls.yaml OpenAPI contract (GET /, GET /{id}, GET /{id}/segments, POST /{id}/feedback, DELETE /{id})
- [X] **T014** [P] Create websocket.md specification (upload_progress, analysis_started, segment_complete, analysis_complete, error messages)

---

## Phase 3.3: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.4

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Backend Contract Tests

- [X] **T015** [P] Contract test POST /api/v1/users/register in backend/tests/test_api/test_users_register.py
- [X] **T016** [P] Contract test POST /api/v1/users/{id}/train-voice in backend/tests/test_api/test_users_train.py
- [X] **T017** [P] Contract test GET /api/v1/users/{id} in backend/tests/test_api/test_users_get.py
- [X] **T018** [P] Contract test PUT /api/v1/users/{id}/settings in backend/tests/test_api/test_users_settings.py
- [X] **T019** [P] Contract test POST /api/v1/analysis/upload in backend/tests/test_api/test_analysis_upload_init.py
- [X] **T020** [P] Contract test POST /api/v1/analysis/upload/{id}/chunk in backend/tests/test_api/test_analysis_chunk.py
- [X] **T021** [P] Contract test POST /api/v1/analysis/upload/{id}/complete in backend/tests/test_api/test_analysis_complete.py
- [X] **T022** [P] Contract test GET /api/v1/calls in backend/tests/test_api/test_calls_list.py
- [X] **T023** [P] Contract test GET /api/v1/calls/{id} in backend/tests/test_api/test_calls_get.py
- [X] **T024** [P] Contract test GET /api/v1/calls/{id}/segments in backend/tests/test_api/test_calls_segments.py
- [X] **T025** [P] Contract test POST /api/v1/calls/{id}/feedback in backend/tests/test_api/test_calls_feedback.py
- [X] **T026** [P] Contract test DELETE /api/v1/calls/{id} in backend/tests/test_api/test_calls_delete.py

### Backend ML Tests

- [X] **T027** [P] Test audio feature extraction (MFCC, pitch, jitter) in backend/tests/test_ml/test_audio_processing.py
- [X] **T028** [P] Test GMM training and calibration in backend/tests/test_ml/test_speaker_id.py
- [X] **T029** [P] Test Vosk transcription in backend/tests/test_ml/test_transcription.py
- [X] **T030** [P] Test language detection logic in backend/tests/test_ml/test_language_detection.py
- [X] **T031** [P] Test rule-based emotion analysis in backend/tests/test_ml/test_emotion_analysis.py

### Backend Integration Tests

- [X] **T032** [P] Integration test user onboarding flow (register → train voice → GMM created) in backend/tests/test_integration/test_user_onboarding.py
- [X] **T033** [P] Integration test simple call analysis (upload → detect lang → transcribe → emotions) in backend/tests/test_integration/test_call_analysis.py
- [X] **T034** [P] Integration test feedback collection in backend/tests/test_integration/test_feedback_loop.py
- [X] **T035** [P] Integration test cleanup service in backend/tests/test_integration/test_audio_cleanup.py

### Frontend Tests

- [X] **T036** [P] Test AudioUploader component (chunked upload logic) in frontend/src/components/__tests__/AudioUploader.test.tsx
- [X] **T037** [P] Test VoiceRecorder component (microphone recording) in frontend/src/components/__tests__/VoiceRecorder.test.tsx
- [X] **T038** [P] Test EmotionChart component (Chart.js rendering) in frontend/src/components/__tests__/EmotionChart.test.tsx
- [X] **T039** [P] Test TranscriptView component (scrolling, highlighting) in frontend/src/components/__tests__/TranscriptView.test.tsx
- [X] **T040** [P] Test useChunkedUpload hook in frontend/src/hooks/__tests__/useChunkedUpload.test.ts
- [X] **T041** [P] Test useWebSocket hook in frontend/src/hooks/__tests__/useWebSocket.test.ts

---

## Phase 3.4: Core Backend Implementation (ONLY after tests are failing)

### Database Models

- [X] **T042** [P] Create User SQLAlchemy model in backend/app/models/user.py
- [X] **T043** [P] Create Call SQLAlchemy model in backend/app/models/call.py
- [X] **T044** [P] Create Segment SQLAlchemy model in backend/app/models/segment.py
- [X] **T045** [P] Create Alert SQLAlchemy model in backend/app/models/alert.py
- [X] **T046** [P] Create EmotionFeedback SQLAlchemy model in backend/app/models/feedback.py

### Pydantic Schemas

- [X] **T047** [P] Create user request/response schemas in backend/app/schemas/user.py
- [X] **T048** [P] Create call request/response schemas in backend/app/schemas/call.py
- [X] **T049** [P] Create analysis request/response schemas in backend/app/schemas/analysis.py

### Core Configuration

- [X] **T050** Create application config (Pydantic settings) in backend/app/core/config.py
- [X] **T051** Create database setup (SQLAlchemy engine, session) in backend/app/core/database.py
- [X] **T052** [P] Create optional JWT security helpers in backend/app/core/security.py

### ML Modules

- [X] **T053** [P] Implement audio feature extraction (librosa MFCC, pitch, jitter) in backend/app/ml/audio_processing.py
- [X] **T054** [P] Implement GMM training and speaker identification in backend/app/ml/speaker_id.py
- [X] **T055** [P] Implement Vosk transcription wrapper in backend/app/ml/transcription.py
- [X] **T056** [P] Implement dual-model language detection in backend/app/ml/language_detection.py
- [X] **T057** [P] Implement rule-based emotion analysis (with RandomForest fallback) in backend/app/ml/emotion_analysis.py

### Services Layer

- [X] **T058** Implement chunked upload handling service in backend/app/services/upload_service.py
- [X] **T059** Implement analysis pipeline orchestration in backend/app/services/analysis_service.py
- [X] **T060** [P] Implement background audio cleanup service in backend/app/services/cleanup_service.py

### API Endpoints

- [X] **T061** Implement POST /api/v1/users/register endpoint in backend/app/api/users.py
- [X] **T062** Implement POST /api/v1/users/{id}/train-voice endpoint in backend/app/api/users.py
- [X] **T063** Implement GET /api/v1/users/{id} endpoint in backend/app/api/users.py
- [X] **T064** Implement PUT /api/v1/users/{id}/settings endpoint in backend/app/api/users.py
- [X] **T065** Implement POST /api/v1/analysis/upload endpoint in backend/app/api/analysis.py
- [X] **T066** Implement POST /api/v1/analysis/upload/{id}/chunk endpoint in backend/app/api/analysis.py
- [X] **T067** Implement POST /api/v1/analysis/upload/{id}/complete endpoint in backend/app/api/analysis.py
- [X] **T068** Implement WebSocket connection handler in backend/app/api/websocket.py
- [X] **T069** Implement GET /api/v1/calls endpoint in backend/app/api/calls.py
- [X] **T070** Implement GET /api/v1/calls/{id} endpoint in backend/app/api/calls.py
- [X] **T071** Implement GET /api/v1/calls/{id}/segments endpoint in backend/app/api/calls.py
- [X] **T072** Implement POST /api/v1/calls/{id}/feedback endpoint in backend/app/api/calls.py
- [X] **T073** Implement DELETE /api/v1/calls/{id} endpoint in backend/app/api/calls.py

### FastAPI Application

- [ ] **T074** Create FastAPI app with CORS, middleware, and route registration in backend/app/main.py

---

## Phase 3.5: Frontend Implementation

### TypeScript Types

- [ ] **T075** [P] Create TypeScript interfaces for all entities in frontend/src/types/index.ts

### Services

- [ ] **T076** Create Axios API client configuration in frontend/src/services/api.ts
- [ ] **T077** Implement chunked upload service in frontend/src/services/uploadService.ts
- [ ] **T078** Implement WebSocket client service in frontend/src/services/websocketService.ts

### React Hooks

- [ ] **T079** [P] Implement useAudioRecorder hook in frontend/src/hooks/useAudioRecorder.ts
- [ ] **T080** [P] Implement useChunkedUpload hook in frontend/src/hooks/useChunkedUpload.ts
- [ ] **T081** [P] Implement useWebSocket hook in frontend/src/hooks/useWebSocket.ts

### Reusable Components

- [ ] **T082** [P] Create Navigation component (MUI AppBar) in frontend/src/components/Navigation.tsx
- [ ] **T083** [P] Create AudioUploader component (drag-drop, progress) in frontend/src/components/AudioUploader.tsx
- [ ] **T084** [P] Create VoiceRecorder component (mic recording, waveform) in frontend/src/components/VoiceRecorder.tsx
- [ ] **T085** [P] Create AudioPlayer component (playback, timeline) in frontend/src/components/AudioPlayer.tsx
- [ ] **T086** [P] Create EmotionChart component (Chart.js line graph) in frontend/src/components/EmotionChart.tsx
- [ ] **T087** [P] Create TranscriptView component (scrollable, speaker labels) in frontend/src/components/TranscriptView.tsx
- [ ] **T088** [P] Create AlertPopup component (MUI Snackbar) in frontend/src/components/AlertPopup.tsx
- [ ] **T089** [P] Create MetricsCard component (current emotion display) in frontend/src/components/MetricsCard.tsx

### Pages

- [ ] **T090** Create Register page (user registration form) in frontend/src/pages/Register.tsx
- [ ] **T091** Create VoiceTraining page (8-phrase recording wizard) in frontend/src/pages/VoiceTraining.tsx
- [ ] **T092** Create AnalysisDashboard page (main analysis UI) in frontend/src/pages/AnalysisDashboard.tsx
- [ ] **T093** Create CallHistory page (call list with search) in frontend/src/pages/CallHistory.tsx
- [ ] **T094** Create CallDetails page (single call view with feedback) in frontend/src/pages/CallDetails.tsx
- [ ] **T095** Create Settings page (retention period adjustment) in frontend/src/pages/Settings.tsx

### App Integration

- [ ] **T096** Create App component with React Router and theme provider in frontend/src/App.tsx
- [ ] **T097** Create index.tsx entry point in frontend/src/index.tsx

---

## Phase 3.6: Integration & Polish

- [ ] **T098** Run all backend tests and verify they pass (pytest backend/tests/ -v)
- [ ] **T099** Run all frontend tests and verify they pass (npm test --watchAll=false)
- [ ] **T100** Test Scenario 1: User Onboarding (from quickstart.md)
- [ ] **T101** Test Scenario 2: Simple Call Analysis (from quickstart.md)
- [ ] **T102** Test Scenario 3: User Feedback & Continuous Learning (from quickstart.md)
- [ ] **T103** Test Scenario 4: Long Call Handling (45-minute call) (from quickstart.md)
- [ ] **T104** Test Scenario 5: Multi-User Concurrent Uploads (5 users) (from quickstart.md)
- [ ] **T105** Test Scenario 6: Settings Management (from quickstart.md)
- [ ] **T106** Test Scenario 7: Background Cleanup (from quickstart.md)
- [ ] **T107** [P] Performance optimization: Profile memory usage and optimize audio processing
- [ ] **T108** [P] Create README.md with setup and usage instructions
- [ ] **T109** [P] Create API documentation from OpenAPI specs (generate with Swagger UI)
- [ ] **T110** [P] Create quickstart script (scripts/quickstart.sh for one-command setup)

---

## Dependencies

### Critical Path

```
Setup (T001-T010)
  ↓
Contract Definitions (T011-T014)
  ↓
Tests (T015-T041)
  ↓
Backend Models (T042-T046) → Schemas (T047-T049) → Config (T050-T052)
  ↓
ML Modules (T053-T057) [P where independent]
  ↓
Services (T058-T060)
  ↓
API Endpoints (T061-T074)
  ↓
Frontend Types (T075) → Services (T076-T078) → Hooks (T079-T081)
  ↓
Components (T082-T089) [P] → Pages (T090-T095) → App (T096-T097)
  ↓
Integration & Polish (T098-T110)
```

### Specific Dependencies

- T042-T046 must complete before T061-T073 (models needed for endpoints)
- T053-T057 can run in parallel (independent ML modules)
- T058-T060 depend on T053-T057 (services use ML modules)
- T065-T067 must be sequential (upload endpoints share state)
- T082-T089 can run in parallel (independent components)
- T090-T095 depend on T082-T089 (pages use components)

---

## Parallel Execution Examples

### Backend ML Modules (can run together)

```bash
# T053, T054, T055, T056, T057 can be developed in parallel
Task T053: "Implement audio feature extraction (librosa MFCC, pitch, jitter) in backend/app/ml/audio_processing.py"
Task T054: "Implement GMM training and speaker identification in backend/app/ml/speaker_id.py"
Task T055: "Implement Vosk transcription wrapper in backend/app/ml/transcription.py"
Task T056: "Implement dual-model language detection in backend/app/ml/language_detection.py"
Task T057: "Implement rule-based emotion analysis in backend/app/ml/emotion_analysis.py"
```

### Frontend Components (can run together)

```bash
# T082-T089 can be developed in parallel
Task T082: "Create Navigation component in frontend/src/components/Navigation.tsx"
Task T083: "Create AudioUploader component in frontend/src/components/AudioUploader.tsx"
Task T084: "Create VoiceRecorder component in frontend/src/components/VoiceRecorder.tsx"
Task T085: "Create AudioPlayer component in frontend/src/components/AudioPlayer.tsx"
Task T086: "Create EmotionChart component in frontend/src/components/EmotionChart.tsx"
Task T087: "Create TranscriptView component in frontend/src/components/TranscriptView.tsx"
Task T088: "Create AlertPopup component in frontend/src/components/AlertPopup.tsx"
Task T089: "Create MetricsCard component in frontend/src/components/MetricsCard.tsx"
```

### Contract Tests (can run together)

```bash
# T015-T026 can be developed in parallel (different test files)
Task T015: "Contract test POST /api/v1/users/register in backend/tests/test_api/test_users_register.py"
Task T016: "Contract test POST /api/v1/users/{id}/train-voice in backend/tests/test_api/test_users_train.py"
# ... all contract tests are independent
```

---

## Validation Checklist

*GATE: Verify before marking Phase 3 complete*

- [ ] All contracts have corresponding tests (T015-T026 cover all endpoints in T011-T014)
- [ ] All entities have model tasks (T042-T046 cover all tables in data-model.md)
- [ ] All tests come before implementation (Phase 3.3 before Phase 3.4)
- [ ] Parallel tasks truly independent (checked file paths, no shared state)
- [ ] Each task specifies exact file path (all tasks include file paths)
- [ ] No task modifies same file as another [P] task (verified unique paths for [P] tasks)
- [ ] All quickstart scenarios have integration tests (T100-T106 cover all 7 scenarios)
- [ ] Constitution compliance verified (Privacy-first ✅, Local ML ✅, Modular ✅, Real-time ✅, Lightweight ✅, User-friendly ✅, Scalable ✅, Secure ✅)

---

## Notes

### TDD Discipline

- Write tests FIRST (T015-T041) before ANY implementation
- Verify tests FAIL initially (expected behavior)
- Implement code to make tests PASS
- Refactor if needed while keeping tests green

### Parallel Execution Rules

- **[P]** marker = different files AND no dependencies
- Contract tests are always [P] (different test files)
- ML modules are [P] if they don't share state
- Frontend components are [P] if they don't share context
- API endpoints are sequential if they modify same database tables

### File Naming Conventions

- Backend: `snake_case.py`
- Frontend: `PascalCase.tsx` for components, `camelCase.ts` for services
- Tests: `test_*.py` or `*.test.tsx`
- Contracts: `resource.yaml` or `feature.md`

### Commit Strategy

- Commit after each task completion
- Use conventional commits: `feat:`, `test:`, `fix:`, `docs:`
- Example: `feat(ml): implement GMM speaker identification (T054)`

### Performance Targets

- Streaming upload: <2s per 1MB chunk ✅
- First segment result: <10s from upload start ✅
- Analysis throughput: 1:1 ratio (real-time) ✅
- Memory per call: <500MB ✅
- Concurrent uploads: 5+ users ✅

---

**Task Breakdown Status**: ✅ Complete - Ready for /implement command
**Total Tasks**: 110
**Estimated Timeline**: 2 weeks (single developer)
**Last Updated**: 2025-01-05
