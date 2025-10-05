# Implementation Plan: Sales Call Analysis System

**Branch**: `001-sales-call-analysis` | **Date**: 2025-01-05 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-sales-call-analysis/spec.md`

## Summary

Build a local, privacy-first sales call analysis system that uses GMM for speaker identification and RandomForest (initially rule-based) for emotion analysis (enthusiasm, agreement, stress). The system processes audio through streaming upload, transcribes using dual-language Vosk models (Russian + English), and presents results in a Material-UI React dashboard with real-time Chart.js visualizations. All processing happens locally with CPU-only inference, user-configurable audio retention, and continuous learning from user feedback.

## Technical Context

**Language/Version**: Python 3.9+, TypeScript 4.9+, Node.js 16+  
**Primary Dependencies**: 
- Backend: FastAPI, scikit-learn, Vosk, librosa, SQLite, pickle
- Frontend: React 18, Material-UI 5, Chart.js, Axios, React Router

**Storage**: SQLite for metadata (users, calls, segments, alerts, feedback), filesystem for audio files and pickled models  
**Testing**: pytest (backend), Jest/React Testing Library (frontend)  
**Target Platform**: Cross-platform desktop (Linux, macOS, Windows), CPU-only processing  
**Project Type**: Web (FastAPI backend + React frontend)  
**Performance Goals**: 
- Streaming upload: <2s per 1MB chunk
- First segment result: <10s from upload start
- Analysis throughput: 1:1 ratio (real-time)
- Memory per call: <500MB
- Concurrent uploads: 5+ users

**Constraints**: 
- CPU-only processing (no GPU)
- Model size: ~100MB total (both Vosk models)
- Local processing (privacy-first)
- Offline capable after model download

**Scale/Scope**: 
- Single-user to small team (5-10 concurrent users)
- 30+ minute call support via streaming
- Bilingual (Russian + English)

---

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Privacy-First Architecture ✅
- **Requirement**: All ML processing local, no cloud dependencies
- **Compliance**: ✅ Vosk STT, scikit-learn GMM/RF all run locally, SQLite local storage
- **Evidence**: No external API calls in processing pipeline

### II. Local ML Processing ✅
- **Requirement**: Models run locally, CPU-optimized, <500MB base models
- **Compliance**: ✅ Vosk models ~90MB total, GMM <1MB per user, rule-based initially
- **Evidence**: Target latency <10s for first result on 4-core CPU

### III. Modular Architecture ✅
- **Requirement**: Independent modules with clear API contracts
- **Compliance**: ✅ Separate modules: audio processing, transcription, analysis, storage, frontend
- **Evidence**: FastAPI routes, React components, independent testability

### IV. Real-Time Processing Pipeline ✅
- **Requirement**: Continuous buffer processing, incremental output
- **Compliance**: ✅ Streaming upload with incremental analysis, WebSocket updates
- **Evidence**: 30-second processing windows, async pipeline

### V. Lightweight & Efficient ✅
- **Requirement**: <2GB RAM basic operation, <4GB advanced
- **Compliance**: ✅ Target <500MB per call, streaming to reduce memory
- **Evidence**: Incremental processing, discard raw audio after feature extraction

### VI. User-Friendly React Interface ✅
- **Requirement**: Material-UI, Chart.js visualizations, responsive
- **Compliance**: ✅ MUI components, real-time charts, accessible design
- **Evidence**: Dashboard, training wizard, settings UI specified

### VII. Scalability for Telephony Integration ✅
- **Requirement**: Support multiple input types, plugin architecture
- **Compliance**: ✅ WAV, MP3 support, streaming upload ready for WebRTC
- **Evidence**: Chunked upload API extensible to live streams

### Security & Privacy ✅
- **Requirement**: AES-256 encryption, configurable retention, audit logging
- **Compliance**: ✅ User-configurable retention (1-90 days), auto-deletion
- **Evidence**: Database schema includes retention fields, cleanup tasks

**Constitution Compliance**: ✅ **PASS** - All principles satisfied

---

## Progress Tracking
- [x] Initial Constitution Check (2025-01-05)
- [x] Phase 0: Research decisions documented
- [x] Phase 1: Data model, contracts, quickstart created
- [x] Post-Design Constitution Check
- [ ] Phase 2: Task breakdown (via /tasks command)
- [ ] Phase 3-4: Implementation (via /implement command)

---

## Phase 0: Research & Technical Decisions

### Decision: ML Model Strategy

**Options Considered**:
1. Pre-trained deep learning models (BERT, Wav2Vec)
2. Traditional ML (GMM, RandomForest) with hand-crafted features
3. Hybrid: rule-based MVP → ML with collected data

**Choice**: **Hybrid approach** (Option 3)

**Rationale**:
- No labeled training data available initially
- Rule-based heuristics provide immediate functionality
- User feedback loop builds training dataset organically
- Transition to ML models after 50+ samples per emotion
- Aligns with clarification: "Use rule-based heuristics for MVP"

**Implementation**:
- Phase 1: Rule-based scoring functions (pitch variance → enthusiasm)
- Phase 2: Collect user corrections in `emotion_feedback` table
- Phase 3: Retrain RandomForest models weekly when data sufficient
- Fallback: Keep rule-based if RF unavailable

---

### Decision: Audio Upload Strategy

**Options Considered**:
1. Single-shot upload (entire file base64-encoded)
2. Multipart form upload
3. Chunked streaming upload with incremental processing

**Choice**: **Chunked streaming** (Option 3)

**Rationale**:
- Handles 30+ minute calls without memory overflow
- Provides faster time-to-first-result (<10s)
- Better user experience with progress indicators
- Aligns with clarification: "Streaming analysis"

**Implementation**:
- Client splits file into 1MB chunks
- Server processes 30-second windows incrementally
- WebSocket pushes results as segments complete
- Temporary file assembly during upload

---

### Decision: Language Detection

**Options Considered**:
1. User selects language manually
2. Try both models, choose higher confidence
3. langdetect library on transcript sample

**Choice**: **Dual-model confidence comparison** (Option 2)

**Rationale**:
- No user friction (automatic)
- Vosk provides confidence scores naturally
- Minimal overhead (both models loaded anyway)
- Aligns with clarification: "Auto-detect language"

**Implementation**:
- Process first 10 seconds with both Vosk models
- Compare average confidence scores
- Use higher-confidence model for remainder
- Store detected language in `calls.detected_language`

---

### Decision: GMM Threshold Calibration

**Options Considered**:
1. Fixed global threshold (-15.0)
2. Per-user calibration during training
3. Adaptive threshold during analysis

**Choice**: **Per-user calibration** (Option 2)

**Rationale**:
- Voice characteristics vary significantly
- Training phase provides clean samples for calibration
- Improves speaker identification accuracy
- Aligns with clarification: "Calibrated per user"

**Implementation**:
- Compute log-likelihoods on all training samples
- Set threshold = mean - 2*std (95% confidence)
- Store in `users.gmm_threshold`
- Use during speaker identification

---

### Decision: Data Retention Management

**Options Considered**:
1. No retention (delete immediately)
2. Fixed 7-day retention
3. User-configurable retention

**Choice**: **User-configurable** (Option 3)

**Rationale**:
- Different use cases have different needs
- Privacy-conscious users can minimize storage
- Compliance teams may need longer retention
- Aligns with clarification: "User configurable (1-90 days)"

**Implementation**:
- `users.audio_retention_days` field (default 7)
- Calculate `calls.auto_delete_at` on upload
- Daily cron job deletes expired audio files
- Settings UI allows users to adjust

---

## Phase 1: Design Artifacts

### File Structure

```
nAnalyzer/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                    # FastAPI application entry point
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── users.py               # User registration, voice training, settings
│   │   │   ├── analysis.py            # Streaming upload, analysis endpoints
│   │   │   ├── calls.py               # Call management, feedback
│   │   │   └── websocket.py           # WebSocket for real-time updates
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   ├── config.py              # Settings (Pydantic)
│   │   │   ├── database.py            # SQLAlchemy setup
│   │   │   └── security.py            # JWT auth (optional)
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── user.py                # SQLAlchemy models
│   │   │   ├── call.py
│   │   │   ├── segment.py
│   │   │   └── feedback.py
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── user.py                # Pydantic request/response schemas
│   │   │   ├── call.py
│   │   │   └── analysis.py
│   │   ├── ml/
│   │   │   ├── __init__.py
│   │   │   ├── audio_processing.py    # librosa feature extraction
│   │   │   ├── speaker_id.py          # GMM training & identification
│   │   │   ├── transcription.py       # Vosk wrapper
│   │   │   ├── emotion_analysis.py    # Rule-based + RandomForest
│   │   │   └── language_detection.py  # Dual-model comparison
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── upload_service.py      # Chunked upload handling
│   │   │   ├── analysis_service.py    # Orchestrate analysis pipeline
│   │   │   └── cleanup_service.py     # Background audio deletion
│   │   └── utils/
│   │       ├── __init__.py
│   │       └── helpers.py
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── test_api/
│   │   ├── test_ml/
│   │   └── test_services/
│   ├── models/                        # Pickled models (gitignored)
│   │   ├── voice/
│   │   ├── emotion/
│   │   └── vosk/
│   ├── data/                          # Database & uploads (gitignored)
│   │   ├── uploads/
│   │   └── audio/
│   ├── alembic/                       # Database migrations
│   ├── requirements.txt
│   ├── pytest.ini
│   └── .env.example
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── index.tsx
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── Navigation.tsx
│   │   │   ├── AudioUploader.tsx      # Chunked upload with progress
│   │   │   ├── VoiceRecorder.tsx      # Microphone recording
│   │   │   ├── AudioPlayer.tsx        # Playback with timeline
│   │   │   ├── EmotionChart.tsx       # Chart.js line graph
│   │   │   ├── TranscriptView.tsx     # Scrollable transcript
│   │   │   ├── AlertPopup.tsx         # MUI Snackbar alerts
│   │   │   └── MetricsCard.tsx        # Current emotion display
│   │   ├── pages/
│   │   │   ├── Register.tsx           # User registration form
│   │   │   ├── VoiceTraining.tsx      # Voice training wizard
│   │   │   ├── AnalysisDashboard.tsx  # Main analysis UI
│   │   │   ├── CallHistory.tsx        # Call list with search
│   │   │   ├── CallDetails.tsx        # Single call view
│   │   │   └── Settings.tsx           # User settings (retention, etc.)
│   │   ├── services/
│   │   │   ├── api.ts                 # Axios client
│   │   │   ├── uploadService.ts       # Chunked upload logic
│   │   │   └── websocketService.ts    # WebSocket client
│   │   ├── hooks/
│   │   │   ├── useAudioRecorder.ts
│   │   │   ├── useChunkedUpload.ts
│   │   │   └── useWebSocket.ts
│   │   ├── types/
│   │   │   └── index.ts               # TypeScript interfaces
│   │   └── utils/
│   │       └── audioUtils.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── docker-compose.yml
└── README.md
```

---

### Data Model

See [data-model.md](./data-model.md) for complete schema definitions.

**Key Entities**:
- **User**: Registration, voice model metadata, retention settings
- **Call**: Uploaded audio metadata, detected language, deletion schedule
- **Segment**: Per-segment transcription, speaker, emotion scores
- **Alert**: Generated recommendations with timestamps
- **EmotionFeedback**: User corrections for continuous learning

**Relationships**:
- User 1:N Call
- Call 1:N Segment
- Call 1:N Alert
- Segment 1:N EmotionFeedback

---

### API Contracts

See [contracts/](./contracts/) for detailed OpenAPI specs.

**Core Endpoints**:

1. **User Management** (`/api/v1/users`)
   - POST /register - Create user
   - POST /{id}/train-voice - Upload training samples, train GMM
   - GET /{id} - Get user info
   - PUT /{id}/settings - Update retention period

2. **Analysis** (`/api/v1/analysis`)
   - POST /upload - Initialize chunked upload
   - POST /upload/{id}/chunk - Upload chunk
   - POST /upload/{id}/complete - Trigger analysis
   - WS /{call_id}/stream - Real-time progress updates

3. **Calls** (`/api/v1/calls`)
   - GET / - List user's calls
   - GET /{id} - Get call details
   - GET /{id}/segments - Get all segments
   - POST /{id}/feedback - Submit emotion corrections
   - DELETE /{id} - Delete call

**WebSocket Messages**:
- `upload_progress`: Upload % completion
- `analysis_started`: Begin processing notification
- `segment_complete`: New segment result
- `analysis_complete`: Final summary
- `error`: Error messages

---

### Integration Scenarios

See [quickstart.md](./quickstart.md) for full test scenarios.

**Critical Paths**:

1. **User Onboarding**
   - Register → Train voice (8 phrases) → GMM calibrated → Ready

2. **Single Call Analysis**
   - Upload audio (chunked) → Auto-detect language → Segment → Identify speakers → Transcribe → Analyze emotions → Display results

3. **Continuous Learning**
   - View analysis → Correct emotion scores → Store feedback → Retrain models weekly

4. **Long Call Handling**
   - 45-minute call → Stream in 1MB chunks → Process 30-second windows → Provide incremental results → Complete in <2 minutes

---

## Phase 2: Task Generation Strategy

**Approach**: Dependency-ordered tasks with parallel execution markers

**Task Categories**:
1. **Setup** (T001-T005): Environment, dependencies, database schema
2. **Tests** (T006-T030): Contract tests for all endpoints [P]
3. **Core ML** (T031-T045): Audio processing, GMM, transcription, emotion analysis
4. **API** (T046-T060): Endpoint implementation, WebSocket server
5. **Frontend** (T061-T080): Components, pages, services [P where independent]
6. **Integration** (T081-T090): End-to-end workflows, cleanup tasks
7. **Polish** (T091-T100): Unit tests, documentation, performance tuning [P]

**Parallelization Strategy**:
- Tests for different contracts can run in parallel [P]
- Frontend components without shared state can develop in parallel [P]
- ML modules (GMM, transcription, emotion) can develop in parallel [P]
- API endpoints sharing database models must be sequential

**Task IDs**: T001-T100 (estimated ~100 tasks)

**Execution via /tasks command**: Will generate full task breakdown with:
- Specific file paths for each task
- Dependencies between tasks
- Parallel execution markers [P]
- Acceptance criteria per task

---

## Complexity Tracking

**Inherent Complexity** (unavoidable):
- Streaming audio upload with chunked processing
- Dual-language Vosk model management
- Real-time WebSocket communication
- Audio feature extraction (librosa MFCC, pitch, jitter)

**Accidental Complexity** (minimized):
- ❌ Avoided: External ML APIs (TensorFlow Serving, cloud APIs)
- ❌ Avoided: Complex message queues (Kafka, RabbitMQ) - using WebSocket
- ❌ Avoided: Pre-trained deep learning models requiring labeled data
- ✅ Simplified: Rule-based MVP instead of requiring training data
- ✅ Simplified: SQLite instead of PostgreSQL for MVP

**Risk Mitigation**:
- Streaming upload complexity → Well-tested chunked upload libraries, incremental processing
- Language detection accuracy → Confidence-based selection, user can override if needed
- GMM calibration → Standard statistical method (mean - 2*std)
- Memory management → Process 30-second windows, discard raw audio after features

---

## Open Questions
*All clarified via /clarify command - no remaining questions*

---

## Next Steps

**Ready for Task Generation** ✅

Run `/tasks` command to generate `tasks.md` with:
- ~100 dependency-ordered tasks
- File paths and acceptance criteria per task
- Parallel execution markers [P]
- Organized by phase (Setup → Tests → Core → Integration → Polish)

**Estimated Timeline**:
- Setup: 1 day
- Backend core: 5-7 days
- Frontend: 4-5 days
- Integration & polish: 2-3 days
- **Total**: ~2 weeks for MVP (single developer)

---

**Plan Status**: ✅ Complete - Ready for /tasks command
