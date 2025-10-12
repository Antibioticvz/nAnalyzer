# Quick Start Guide

Get nAnalyzer up and running in 5 minutes!

## Prerequisites

- **Python 3.9+** installed
- **Node.js 16+** and npm installed
- **Docker** (optional, but recommended)
- **Git** for cloning the repository

## Installation

### Option 1: Using Docker (Easiest) 🐳

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/nAnalyzer.git
cd nAnalyzer

# 2. Start the application (backend + frontend + PostgreSQL)
docker-compose up

# That's it! Wait for containers to build and start
```

Access the dashboard at: **http://localhost:3000**

### Option 2: Using Setup Script

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/nAnalyzer.git
cd nAnalyzer

# 2. Run setup script
chmod +x setup.sh
./setup.sh

# 3. Start backend (Terminal 1)
cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate
uvicorn app.main:app --reload

# 4. Start frontend (Terminal 2)
cd frontend
npm start
```

Access the dashboard at: **http://localhost:3000**

### Option 3: Manual Setup

#### Backend

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup environment
cp .env.example .env
# Tip: switch DATABASE_URL to the PostgreSQL DSN if you're running the Docker stack

# Create directories
mkdir -p ../data/audio ../models

# Run backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

## First Steps

### 1. Verify Installation

Open your browser:

- **Dashboard**: http://localhost:3000
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

### 2. Explore the Interface

Navigate through the sidebar:

- **Dashboard** - Overview and quick actions
- **Live Monitoring** - Start/stop call recording
- **Call History** - View past calls
- **Analytics** - Aggregate insights
- **Settings** - Configure models and privacy

### 3. Train your voice model

1. Click **Voice Training** in the navigation (or **Retrain Voice Model** from Settings if you're already trained).
2. Record each prompted phrase. You can add custom phrases, re-record, or discard clips at any time.
3. After capturing at least five samples, submit to build the speaker identification model. The backend stores the calibrated model in `models/voice/`.

For quick CLI experiments you can also run `python scripts/voice_model_demo.py --help`.

### 4. (Optional) Download ML Models

```bash
cd backend
source venv/bin/activate
python scripts/download_models.py
```

This downloads the speech-to-text and sentiment analysis models (~500MB).

## Basic Usage

### Recording a Call

1. Go to **Live Monitoring** page
2. Click **Start Recording**
3. Speak into your microphone
4. Watch real-time transcription and sentiment
5. Click **Stop Recording** when done

### Uploading an Audio File

1. Go to **Dashboard**
2. Click **Upload Audio File**
3. Select a WAV, MP3, or Opus file
4. Wait for processing
5. View results in **Call History**

### Viewing Analysis

1. Go to **Call History**
2. Click on a call
3. View:
   - Full transcript
   - Sentiment timeline
   - Key keywords
   - Talk/listen ratio
   - Questions asked

## Configuration

Edit `backend/.env` to customize:

```env
# Model selection
STT_MODEL=whisper-base  # Options: whisper-tiny, whisper-base, whisper-small

# Privacy settings
AUTO_DELETE_AUDIO_DAYS=7  # Auto-delete audio after N days
ENABLE_PII_REDACTION=true # Redact phone numbers, SSN, etc.

# Performance
MAX_CONCURRENT_CALLS=10   # Max simultaneous calls
```

Or use the **Settings** page in the UI!

## Troubleshooting

### Port Already in Use

```bash
# Check what's using port 8000 or 3000
lsof -i :8000
lsof -i :3000

# Kill the process or use different ports
uvicorn app.main:app --port 8080
npm start  # Will prompt for alternative port
```

### Models Not Loading

```bash
# Re-download models
cd backend
python scripts/download_models.py

# Check model directory
ls -lh ../models/
```

### Docker Issues

```bash
# Clean up and rebuild
docker-compose down
docker-compose build --no-cache
docker-compose up
```

### Backend Errors

```bash
# Check logs
docker-compose logs backend

# Or if running manually
cd backend
tail -f logs/nanalyzer.log  # If logging to file
```

## Next Steps

- **Read the [README](README.md)** for detailed features
- **Review the [Constitution](.specify/memory/constitution.md)** to understand design principles
- **Check [API Documentation](docs/API.md)** to integrate with other tools
- **See [Contributing](CONTRIBUTING.md)** to add features

## Common Questions

**Q: Is my data sent to the cloud?**
A: No! All processing happens locally on your machine. See [SECURITY.md](SECURITY.md).

**Q: What audio formats are supported?**
A: WAV, MP3, and Opus. More formats coming soon.

**Q: Can I use this for multiple calls simultaneously?**
A: Yes! Configure `MAX_CONCURRENT_CALLS` in settings.

**Q: Does it work offline?**
A: Yes, once models are downloaded, nAnalyzer works completely offline.

**Q: Can I integrate with my phone system?**
A: WebRTC and VoIP integration is on the roadmap (Phase 3).

## Getting Help

- **Issues**: [GitHub Issues](https://github.com/yourusername/nAnalyzer/issues)
- **Discord**: [Community Server](https://discord.gg/nanalyzer)
- **Email**: support@nanalyzer.dev
- **Docs**: [Full Documentation](docs/)

---

**Happy Analyzing! 🎙️📊**
