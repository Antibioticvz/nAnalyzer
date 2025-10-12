# nAnalyzer 🎙️

> A lightweight, privacy-focused real-time sales call analysis platform with local ML processing

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python 3.9+](https://img.shields.io/badge/python-3.9+-blue.svg)](https://www.python.org/downloads/)
[![React 18+](https://img.shields.io/badge/react-18+-61dafb.svg)](https://reactjs.org/)

## 🌟 Overview

nAnalyzer is a real-time sales call analysis solution that processes conversations entirely on your local machine. Built with privacy at its core, it provides actionable insights without ever sending your sensitive data to the cloud.

### Key Features

- 🔒 **Privacy-First**: All processing happens locally on your machine
- ⚡ **Real-Time Analysis**: Live transcription and sentiment analysis during calls
- 🎯 **Sales Intelligence**: Talk/listen ratios, sentiment trends, keyword extraction
- 📊 **Beautiful Visualizations**: React-based dashboard with live updates
- 🔌 **Telephony Ready**: Plugin architecture for VoIP, WebRTC, and telephony APIs
- 🪶 **Lightweight**: Runs efficiently on modest hardware (4-core CPU, 8GB RAM)
- 🔧 **Modular Design**: Independent, testable components with clear APIs

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React Dashboard                          │
│  (Live Monitoring, Analytics, Historical Views)              │
└─────────────────┬───────────────────────────────────────────┘
                  │ WebSocket
┌─────────────────┴───────────────────────────────────────────┐
│                     FastAPI Backend                          │
│  (API Gateway, WebSocket Server, Orchestration)              │
└─────┬──────────────┬──────────────┬───────────────┬─────────┘
      │              │              │               │
┌─────┴─────┐  ┌────┴────┐  ┌──────┴─────┐  ┌──────┴──────┐
│  Audio    │  │  Trans- │  │  Analysis  │  │   Storage   │
│  Capture  │  │ cription│  │   Engine   │  │   (SQLite)  │
│  Module   │  │  (STT)  │  │            │  │             │
└───────────┘  └─────────┘  └────────────┘  └─────────────┘
     │              │              │
     │         ┌────┴────┐    ┌────┴─────┐
     │         │ Whisper │    │Sentiment │
     │         │  /Vosk  │    │  Model   │
     │         └─────────┘    └──────────┘
     │
┌────┴──────────────────────────────────────────┐
│  Telephony Plugins (WebRTC, Twilio, etc.)     │
└────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Python 3.9 or higher
- Node.js 16+ and npm
- 4-core CPU, 8GB RAM (minimum)
- ~2GB free disk space for models

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/nAnalyzer.git
cd nAnalyzer

# Backend setup
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Download ML models (this may take a few minutes)
python scripts/download_models.py

# Frontend setup
cd ../frontend
npm install

# Start the application
cd ..
docker-compose up  # Or run backend and frontend separately
```

### Running Without Docker

```bash
# Terminal 1: Start backend
cd backend
source venv/bin/activate
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2: Start frontend
cd frontend
npm start
```

Visit `http://localhost:3000` to access the dashboard.

## 📖 Documentation

- [Constitution](.specify/memory/constitution.md) - Core principles and architectural decisions
- [API Documentation](docs/API.md) - Backend API reference
- [Module Documentation](docs/MODULES.md) - Individual module specifications
- [Deployment Guide](docs/DEPLOYMENT.md) - Installation and deployment options
- [Development Guide](docs/DEVELOPMENT.md) - Contributing and development setup

## 🧩 Core Modules

### 1. Audio Capture

Handles audio input from various sources (microphone, files, VoIP streams).

**Features:**

- Multi-format support (WAV, MP3, Opus)
- WebRTC integration for live calls
- Automatic audio normalization and preprocessing

### 2. Transcription Engine

Converts speech to text using local ML models.

**Features:**

- Real-time streaming transcription
- Word-level timestamps
- Speaker diarization (multi-speaker detection)
- Multiple language support

### 3. Analysis Engine

Extracts insights from transcribed conversations.

**Features:**

- Sentiment analysis (positive/negative/neutral)
- Keyword and topic extraction
- Talk/listen ratio calculation
- Compliance checking (customizable rules)
- Question detection and counting

### 4. React Dashboard

User-friendly interface for monitoring and analysis.

**Features:**

- Live call monitoring with waveform visualization
- Real-time sentiment graphs
- Historical analytics and trends
- Exportable reports
- Searchable call archive

### 5. Data Storage

Local-first storage with optional cloud sync.

**Features:**

- SQLite for lightweight local storage
- Automatic data retention management
- PII redaction capabilities
- Encrypted backups

## 🔧 Configuration

Create a `.env` file in the backend directory:

```env
# Application Settings
APP_ENV=development
DEBUG=true
LOG_LEVEL=INFO

# Model Settings
STT_MODEL=whisper-base  # Options: whisper-tiny, whisper-base, whisper-small
SENTIMENT_MODEL=distilbert-base-uncased-finetuned-sst-2-english
MAX_MODEL_MEMORY_MB=2048

# Performance Settings
AUDIO_CHUNK_SIZE_MS=200
TRANSCRIPTION_BUFFER_SIZE=5
MAX_CONCURRENT_CALLS=10

# Privacy Settings
AUTO_DELETE_AUDIO_DAYS=7
ENABLE_PII_REDACTION=true
REDACTION_PATTERNS=phone,ssn,credit_card

# Storage Settings
DATABASE_URL=sqlite:///./data/nanalyzer.db
AUDIO_STORAGE_PATH=./data/audio
BACKUP_ENABLED=false

# Frontend Settings
FRONTEND_URL=http://localhost:3000
WEBSOCKET_PING_INTERVAL=30
```

## 📊 Performance Benchmarks

| Metric                | Target        | Typical |
| --------------------- | ------------- | ------- |
| Audio Capture Latency | <50ms         | ~30ms   |
| Transcription Delay   | <1s           | ~500ms  |
| Analysis Update       | 5-10s         | ~7s     |
| End-to-End Latency    | <2s           | ~1.2s   |
| Memory Usage (idle)   | <2GB          | ~1.5GB  |
| Memory Usage (active) | <4GB          | ~3GB    |
| CPU Usage (idle)      | <50% (1 core) | ~30%    |

## 🛠️ Development

### Developer Instructions

#### Database Management

**Reset Database (Docker):**

```bash
# Reset database inside Docker container (drops all tables and recreates them)
docker compose exec backend python scripts/init_db.py
```

**Reset Database (Local):**

```bash
# Reset database locally (when running without Docker)
cd backend
source venv/bin/activate
python scripts/init_db.py
```

**Database Status:**

```bash
# Check migration status
docker compose exec backend alembic current

# Run pending migrations
docker compose exec backend alembic upgrade head
```

#### Common Development Tasks

**Full System Restart:**

```bash
# Stop all containers
docker compose down

# Rebuild and restart
docker compose up --build
```

**Backend Development:**

```bash
# Run backend with auto-reload
docker compose exec backend uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# View backend logs
docker compose logs -f backend
```

**Frontend Development:**

```bash
# Run frontend with hot reload
cd frontend && npm start

# View frontend logs
docker compose logs -f frontend
```

**Testing:**

```bash
# Run all backend tests
docker compose exec backend pytest -v

# Run specific test file
docker compose exec backend pytest tests/test_api/test_users_login.py -v

# Run frontend tests
cd frontend && npm test -- --watchAll=false
```

**Debugging:**

```bash
# Access backend container shell
docker compose exec backend bash

# View API documentation
open http://localhost:8000/docs

# Check database content
docker compose exec backend sqlite3 data/nanalyzer.db ".tables"
```

### Project Structure

```
nAnalyzer/
├── backend/
│   ├── app/
│   │   ├── api/              # API endpoints
│   │   ├── core/             # Core configuration
│   │   ├── models/           # Data models
│   │   ├── modules/          # Core modules
│   │   │   ├── audio/        # Audio capture
│   │   │   ├── transcription/# STT engine
│   │   │   ├── analysis/     # Analysis engine
│   │   │   └── storage/      # Data storage
│   │   ├── services/         # Business logic
│   │   └── main.py           # Application entry point
│   ├── tests/                # Backend tests
│   ├── scripts/              # Utility scripts
│   └── requirements.txt
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── hooks/            # Custom hooks
│   │   ├── services/         # API clients
│   │   ├── pages/            # Page components
│   │   └── App.tsx           # Root component
│   ├── package.json
│   └── tsconfig.json
├── models/                   # ML model files (gitignored)
├── data/                     # Local data storage (gitignored)
├── docs/                     # Documentation
├── docker-compose.yml
└── README.md
```

### Running Tests

```bash
# Backend tests
cd backend
pytest tests/ -v --cov=app

# Frontend tests
cd frontend
npm test

# Integration tests
npm run test:integration
```

### Code Quality

```bash
# Python linting and type checking
cd backend
black app/ tests/
mypy app/
flake8 app/

# TypeScript/React linting
cd frontend
npm run lint
npm run type-check
```

## 🔐 Security & Privacy

nAnalyzer is built with privacy as a fundamental principle:

- **Local Processing**: All audio and text processing happens on your machine
- **No Cloud Dependencies**: Core functionality works completely offline
- **Data Encryption**: All stored data is encrypted at rest (AES-256)
- **Automatic Cleanup**: Configurable retention policies for audio files
- **PII Redaction**: Automatic detection and redaction of sensitive information
- **Open Source**: Full transparency of data handling practices

For detailed security information, see [SECURITY.md](SECURITY.md).

## 🗺️ Roadmap

### Phase 1: Core Functionality (Current)

- ✅ Local audio processing
- ✅ Real-time transcription
- ✅ Basic sentiment analysis
- ✅ React dashboard MVP

### Phase 2: Enhanced Analysis

- 📋 Advanced NLP (topic modeling, entity recognition)
- 📋 Custom keyword libraries
- 📋 Multi-language support
- 📋 Speaker diarization improvements

### Phase 3: Telephony Integration

- 📋 WebRTC plugin
- 📋 Twilio integration
- 📋 Vonage integration
- 📋 SIP protocol support

### Phase 4: Advanced Features

- 📋 Active learning and model improvement
- 📋 Team collaboration features
- 📋 Advanced analytics and reporting
- 📋 Mobile app companion

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

Before contributing, please review our [Constitution](.specify/memory/constitution.md) to understand the project's core principles.

### Development Setup

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes following our code style
4. Write tests for your changes
5. Ensure all tests pass (`pytest` for backend, `npm test` for frontend)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to your branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [OpenAI Whisper](https://github.com/openai/whisper) - Speech recognition models
- [Faster Whisper](https://github.com/guillaumekln/faster-whisper) - Optimized Whisper implementation
- [Hugging Face Transformers](https://huggingface.co/transformers/) - NLP models
- [FastAPI](https://fastapi.tiangolo.com/) - Modern Python web framework
- [React](https://reactjs.org/) - Frontend framework

## 💬 Support

- 📧 Email: support@nanalyzer.dev
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/nAnalyzer/issues)
- 📖 Docs: [Full Documentation](https://docs.nanalyzer.dev)

---

**Built with ❤️ for privacy-conscious sales teams**
