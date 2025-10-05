# Architecture Overview

## System Components

nAnalyzer follows a modular architecture with clear separation of concerns. Each module is independently deployable, testable, and maintainable.

## Module Descriptions

### 1. Audio Capture Module

**Responsibility**: Handle audio input from various sources

**API Contract**:
```python
class AudioCaptureInterface:
    async def start_capture(self, source: AudioSource) -> StreamId
    async def stop_capture(self, stream_id: StreamId) -> None
    async def get_audio_chunk(self, stream_id: StreamId) -> AudioChunk
    async def get_stream_stats(self, stream_id: StreamId) -> StreamStats
```

**Inputs**:
- Microphone input (local device)
- Audio files (WAV, MP3, Opus)
- WebRTC streams
- VoIP telephony streams

**Outputs**:
- Normalized audio chunks (16kHz, mono, 16-bit PCM)
- Stream metadata (timestamp, duration, format)

**Dependencies**: None (leaf module)

---

### 2. Transcription Engine

**Responsibility**: Convert speech to text with timestamps

**API Contract**:
```python
class TranscriptionInterface:
    async def transcribe_chunk(self, audio: AudioChunk) -> TranscriptSegment
    async def transcribe_stream(self, stream: AudioStream) -> AsyncIterator[TranscriptSegment]
    async def set_language(self, lang: str) -> None
    async def get_model_info(self) -> ModelInfo
```

**Models Used**:
- Primary: faster-whisper (base model, ~150MB)
- Alternative: Vosk (lightweight, ~50MB)
- Large model available for batch processing (~1GB)

**Inputs**:
- Audio chunks from Audio Capture Module
- Language hint (optional)

**Outputs**:
- Transcript segments with word-level timestamps
- Confidence scores
- Speaker labels (if diarization enabled)

**Dependencies**: Audio Capture Module

---

### 3. Analysis Engine

**Responsibility**: Extract insights from transcribed text

**API Contract**:
```python
class AnalysisInterface:
    async def analyze_sentiment(self, text: str) -> SentimentResult
    async def extract_keywords(self, text: str) -> List[Keyword]
    async def detect_questions(self, text: str) -> List[Question]
    async def calculate_metrics(self, transcript: Transcript) -> CallMetrics
    async def check_compliance(self, transcript: Transcript, rules: List[Rule]) -> ComplianceReport
```

**Analysis Types**:
- Sentiment analysis (positive/negative/neutral with confidence)
- Keyword extraction (TF-IDF + domain-specific)
- Talk/listen ratio calculation
- Question detection
- Compliance checking (configurable rules)
- Topic modeling

**Models Used**:
- Sentiment: distilbert-base-uncased-finetuned-sst-2-english (~250MB)
- Keywords: spaCy + custom TF-IDF (~50MB)

**Inputs**:
- Transcript segments from Transcription Engine
- Custom keyword dictionaries
- Compliance rules

**Outputs**:
- Sentiment scores over time
- Extracted keywords with relevance scores
- Call quality metrics
- Compliance flags and violations

**Dependencies**: Transcription Engine

---

### 4. Storage Module

**Responsibility**: Persist and retrieve data locally

**API Contract**:
```python
class StorageInterface:
    async def save_audio(self, audio: AudioData, metadata: dict) -> AudioId
    async def save_transcript(self, transcript: Transcript) -> TranscriptId
    async def save_analysis(self, analysis: AnalysisResult) -> AnalysisId
    async def get_call_data(self, call_id: CallId) -> CallData
    async def search_calls(self, query: SearchQuery) -> List[CallSummary]
    async def delete_call(self, call_id: CallId) -> None
    async def export_data(self, format: ExportFormat) -> ExportData
```

**Storage Strategy**:
- SQLite for metadata and transcripts
- File system for audio files (compressed)
- Optional PostgreSQL for multi-user deployments

**Data Retention**:
- Audio files: auto-delete after N days (configurable, default 7)
- Transcripts: keep indefinitely (user controlled)
- Analysis results: keep indefinitely

**Features**:
- Full-text search on transcripts
- PII redaction (regex-based + ML)
- Encrypted storage (AES-256)
- Automatic backups

**Dependencies**: None (leaf module)

---

### 5. API Gateway (FastAPI Backend)

**Responsibility**: HTTP API and WebSocket server

**Endpoints**:
```
POST   /api/v1/calls/start         - Start a new call recording
POST   /api/v1/calls/stop          - Stop recording
GET    /api/v1/calls               - List calls
GET    /api/v1/calls/{id}          - Get call details
GET    /api/v1/calls/{id}/analysis - Get call analysis
DELETE /api/v1/calls/{id}          - Delete a call
POST   /api/v1/upload              - Upload audio file
GET    /api/v1/models              - List available models
GET    /api/v1/config              - Get configuration
PUT    /api/v1/config              - Update configuration
WS     /ws/live                    - WebSocket for live updates
```

**WebSocket Messages**:
- `audio_level`: Real-time audio levels
- `transcript_update`: New transcript segments
- `sentiment_update`: Sentiment changes
- `keyword_detected`: Important keyword detected
- `analysis_complete`: Final analysis ready

**Dependencies**: All modules

---

### 6. React Dashboard

**Responsibility**: User interface for monitoring and analysis

**Pages**:
1. **Live Monitoring** (`/live`)
   - Active call display
   - Real-time waveform
   - Live transcript
   - Sentiment gauge
   - Talk/listen timer

2. **Dashboard** (`/`)
   - Recent calls list
   - Quick statistics
   - Trend charts
   - Quick actions

3. **Call History** (`/history`)
   - Searchable call archive
   - Filters (date, sentiment, keywords)
   - Bulk actions

4. **Call Details** (`/calls/:id`)
   - Full transcript
   - Analysis results
   - Visualizations
   - Export options

5. **Analytics** (`/analytics`)
   - Aggregate statistics
   - Performance trends
   - Team comparisons (multi-user)

6. **Settings** (`/settings`)
   - Model configuration
   - Retention policies
   - Custom keywords
   - Compliance rules

**Key Components**:
- `<Waveform>`: Audio visualization
- `<SentimentChart>`: Real-time sentiment graph
- `<TranscriptView>`: Scrolling transcript with highlights
- `<KeywordCloud>`: Keyword frequency visualization
- `<MetricsCard>`: Call statistics display

**Dependencies**: API Gateway (via REST + WebSocket)

---

## Data Flow

### Real-Time Call Flow

```
1. Audio Input → Audio Capture Module
2. Audio Capture → Transcription Engine (streaming)
3. Transcription → Analysis Engine (incremental)
4. Analysis → API Gateway → React Dashboard (WebSocket)
5. All data → Storage Module (async, non-blocking)
```

### Batch Processing Flow

```
1. File Upload → API Gateway
2. API Gateway → Audio Capture (file reader)
3. Audio Capture → Transcription Engine (batch)
4. Transcription → Analysis Engine (full analysis)
5. Results → Storage Module
6. Storage → API Gateway → React Dashboard (polling/webhook)
```

## Communication Protocols

### Module-to-Module

- In-process: Direct async function calls
- Distributed: REST APIs (future multi-server deployment)
- Message queue: Redis pub/sub (optional, for scaling)

### Backend-to-Frontend

- REST API: HTTPS/JSON for data operations
- WebSocket: Real-time updates during live calls
- Server-Sent Events (SSE): Alternative for one-way updates

## Error Handling

Each module implements graceful degradation:

1. **Audio Capture fails**: Show error in UI, allow file upload
2. **Transcription fails**: Fall back to audio-only storage
3. **Analysis fails**: Show transcript without insights
4. **Storage fails**: Keep data in memory, retry later
5. **WebSocket disconnects**: Auto-reconnect, buffer updates

## Performance Considerations

### Async Processing

All I/O operations are async to prevent blocking:
- Audio reading: async file I/O
- Transcription: async model inference queue
- Database: async SQLite/PostgreSQL driver
- WebSocket: async broadcast to multiple clients

### Resource Management

- **Memory**: Streaming processing, chunked audio buffers
- **CPU**: Thread pool for CPU-bound ML inference
- **Disk**: Async writes, compression, automatic cleanup
- **Network**: Rate limiting, connection pooling

### Caching Strategy

- Model weights: Load once, keep in memory
- Recent calls: LRU cache (last 100 calls)
- Configuration: Cache with TTL (5 minutes)

## Scalability

### Single Machine

- Single user: Python multiprocessing
- Multiple users: Thread pool, shared model weights
- Multiple calls: Queue system, prioritization

### Distributed (Future)

- Horizontal scaling: Multiple API servers behind load balancer
- Model server: Dedicated ML inference servers
- Database: PostgreSQL with read replicas
- Message queue: Redis for inter-server communication

## Security

### API Security

- JWT authentication for multi-user setups
- Rate limiting per user/IP
- Input validation on all endpoints
- CORS configuration

### Data Security

- Encryption at rest (AES-256)
- Secure WebSocket (WSS) in production
- No logging of sensitive data
- PII redaction before storage

## Monitoring & Observability

### Metrics Collected

- API latency (p50, p95, p99)
- Transcription accuracy (word error rate)
- Sentiment model confidence
- System resources (CPU, memory, disk)
- Queue depths
- Error rates

### Logging

- Structured JSON logs
- Log levels: DEBUG, INFO, WARNING, ERROR
- Sensitive data excluded from logs
- Rotation and retention policies

## Testing Strategy

### Unit Tests

- Each module independently tested
- Mock dependencies
- >80% code coverage

### Integration Tests

- Module-to-module contracts
- API endpoint tests
- Database operations

### Performance Tests

- Latency benchmarks
- Load testing (concurrent calls)
- Memory leak detection
- Model inference speed

### End-to-End Tests

- Full workflow: audio → visualization
- UI automation (Playwright/Cypress)
- Multi-user scenarios
