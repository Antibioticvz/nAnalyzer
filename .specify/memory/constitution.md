# nAnalyzer Constitution
<!-- Real-time Sales Call Analysis Platform -->

## Core Principles

### I. Privacy-First Architecture (NON-NEGOTIABLE)
All data processing must prioritize user privacy and data sovereignty. Local ML processing is the default; cloud processing requires explicit opt-in. No personal identifiable information (PII) leaves the user's environment without explicit consent. All audio data must be processed locally using on-device ML models. Transcripts and analysis results are stored locally by default with optional encrypted cloud backup. Third-party API calls (if any) must be minimal, anonymized, and clearly documented.

### II. Local ML Processing
Machine learning models must run locally on user hardware. Primary models: lightweight speech-to-text (Whisper.cpp, Vosk), sentiment analysis (distilled transformers), keyword extraction (TF-IDF, local embeddings). Models should be optimized for CPU inference with optional GPU acceleration. Model files must be versioned, downloadable, and verifiable. Maximum model size: 500MB for base models, 2GB for advanced models. Target latency: <500ms for real-time inference on modest hardware (4-core CPU, 8GB RAM).

### III. Modular Architecture
The system follows a strict separation of concerns with independently deployable modules. Core modules: Audio Capture (telephony integration), Transcription Engine (STT), Analysis Engine (sentiment, keywords, compliance), React Visualization (dashboard), Data Storage (local-first). Each module exposes a well-defined API contract. Modules communicate via lightweight message queues or REST APIs. All modules must be independently testable and documented.

### IV. Real-Time Processing Pipeline
The system processes audio streams with minimal latency. Audio streaming: continuous buffer processing (100-500ms chunks). Transcription: incremental output with word-level timestamps. Analysis: event-driven updates as transcripts arrive. Visualization: WebSocket-based live updates to React frontend. Graceful degradation: if real-time fails, batch processing as fallback.

### V. Lightweight & Efficient
Resource efficiency is paramount for local deployment. Target resource usage: <2GB RAM for basic operation, <4GB for advanced features. CPU usage: <50% of single core during idle, <200% during active call. Storage: compressed audio (Opus), efficient text storage (SQLite). Network: minimal bandwidth usage (<100KB/s for metadata sync). Battery efficiency for laptop deployments considered in all design decisions.

### VI. User-Friendly React Interface
The frontend prioritizes simplicity and clarity. Dashboard views: live call monitoring, historical analysis, insights trends. Key metrics: talk/listen ratio, sentiment trends, keyword frequency, compliance flags. Visualizations: real-time waveforms, sentiment graphs, topic clouds. Accessibility: keyboard navigation, screen reader support, high-contrast modes. Responsive design: desktop-first with mobile-friendly views.

### VII. Scalability for Telephony Integration
The architecture supports future telephony integrations without major refactoring. Supported inputs: audio files (WAV, MP3, Opus), microphone input, VoIP streams (WebRTC), telephony APIs (Twilio, Vonage). Standard protocols: SIP, WebRTC for live call integration. Multi-channel support: handle multiple concurrent calls. Plugin architecture for adding new telephony providers.

## Security & Privacy Requirements

### Data Handling
All sensitive data encrypted at rest using AES-256. Audio files automatically deleted after configurable retention period (default: 7 days). Transcripts stored with configurable redaction rules (phone numbers, SSN, credit cards). User controls for data export, deletion, and anonymization. Compliance readiness: GDPR, CCPA, SOC 2 alignment through privacy-by-design.

### Authentication & Access Control
Local deployment: optional password protection for dashboard. Multi-user environments: role-based access control (RBAC). API authentication: JWT tokens with short expiration. Audit logging for all data access and configuration changes.

## Performance Standards

### Real-Time Requirements
Audio capture latency: <50ms. Transcription output delay: <1 second for real-time mode. Analysis update frequency: every 5-10 seconds. Dashboard refresh rate: 2-5 updates per second. End-to-end latency (audio → visualization): <2 seconds.

### Batch Processing
Historical call analysis: process 1-hour call in <5 minutes. Bulk import: support batch processing of 100+ calls. Background processing: non-blocking for ongoing operations.

### Model Performance
Transcription accuracy: >90% WER (Word Error Rate) for clear audio. Sentiment classification: >85% accuracy on sales conversations. Keyword extraction: >80% precision and recall for domain-specific terms. Model warm-up time: <10 seconds on first run.

## Development Workflow

### Technology Stack
Backend: Python 3.9+ (FastAPI, asyncio for streaming). ML frameworks: PyTorch (model inference), transformers (NLP), faster-whisper or Vosk (STT). Frontend: React 18+, TypeScript, WebSocket client, D3.js or Recharts for visualization. Data storage: SQLite (local), optional PostgreSQL (multi-user). Message queue: Redis (optional) or in-memory queue for single-user. Containerization: Docker for easy deployment.

### Testing Requirements
Unit tests: >80% code coverage for core modules. Integration tests: all module interfaces and API contracts. Performance tests: latency benchmarks for real-time pipeline. Model evaluation: accuracy metrics tracked with test datasets. End-to-end tests: complete workflow from audio input to visualization.

### Code Quality
Type hints mandatory for all Python code (mypy strict mode). ESLint + Prettier for TypeScript/React code. Clear documentation: README per module, API documentation (OpenAPI/Swagger). Code reviews required for all changes. Automated CI/CD pipeline: lint, test, build on every commit.

## Continuous Improvement

### Model Training & Updates
Active learning: flag low-confidence predictions for review. Feedback loop: users can correct transcriptions and sentiment labels. Model fine-tuning: periodic retraining with accumulated feedback data (privacy-preserved). Model versioning: semver for model releases, backward compatibility guaranteed. Minimal data collection: only store misclassified samples (opt-in), never raw audio.

### Feature Development
User-driven roadmap: prioritize features based on user feedback. Incremental releases: ship small, testable features frequently. Beta testing: early access program for new ML models and features. Telemetry: anonymous usage statistics (opt-in) for feature prioritization.

## Deployment & Distribution

### Installation Methods
Single-user: standalone executable (PyInstaller/Electron wrapper). Multi-user: Docker Compose for small teams. Enterprise: Kubernetes deployment with horizontal scaling. Package managers: pip for Python backend, npm for frontend development.

### Configuration
Environment-based configuration (dotenv). Sensible defaults for all settings. Configuration UI in React dashboard for non-technical users. Hot-reload configuration without restart where possible.

## Governance

This constitution defines the architectural and operational principles for nAnalyzer. All design decisions, feature implementations, and third-party integrations must align with these principles. Privacy and local processing are non-negotiable core values. Any deviation requires explicit documentation and user consent. The modular architecture ensures components can be improved independently without breaking the system. Performance benchmarks must be maintained across releases. Regular security audits and dependency updates are mandatory. Community contributions welcome but must adhere to this constitution.

**Version**: 1.0.0 | **Ratified**: 2025-01-05 | **Last Amended**: 2025-01-05