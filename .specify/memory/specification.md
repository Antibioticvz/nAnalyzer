# nAnalyzer Technical Specification v1.0

## Executive Summary

nAnalyzer is a local, privacy-first sales call analysis system that identifies speakers, analyzes client emotional states (enthusiasm, agreement, stress), and provides real-time visual feedback to help salespeople improve their pitch effectiveness.

## Core Requirements

### Technology Stack

**Backend:**
- Python 3.9+ with FastAPI for REST API
- scikit-learn for ML models (GMM speaker identification, RandomForest emotion classification)
- Vosk for speech-to-text transcription
- librosa for audio processing and feature extraction
- SQLite for data persistence
- pickle for model serialization

**Frontend:**
- React 18+ with TypeScript
- Material-UI (MUI) for component library
- Chart.js for real-time emotion visualizations
- Axios for API communication
- React Router for navigation

**Audio Processing:**
- Supported formats: WAV, MP3
- Sample rate: 16kHz (standard for speech)
- CPU-only processing (no GPU required)
- Model size constraint: <50MB total

### System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend (MUI)                  │
│  Registration → Voice Training → Analysis Dashboard      │
└─────────────────┬───────────────────────────────────────┘
                  │ REST API (FastAPI)
┌─────────────────┴───────────────────────────────────────┐
│                   FastAPI Backend                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐          │
│  │  User    │  │  Voice   │  │   Analysis   │          │
│  │  Auth    │  │ Training │  │   Engine     │          │
│  └──────────┘  └──────────┘  └──────────────┘          │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────┴───────────────────────────────────────┐
│              ML Processing Pipeline                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   Vosk      │  │     GMM     │  │ RandomForest│     │
│  │    STT      │  │  Speaker    │  │  Emotion    │     │
│  │             │  │Identification│  │  Analysis   │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└─────────────────────────────────────────────────────────┘
                  │
┌─────────────────┴───────────────────────────────────────┐
│                 Data Storage                             │
│  SQLite (users, calls) + Pickle (trained models)         │
└─────────────────────────────────────────────────────────┘
```

## Feature Specifications

### 1. User Registration

**API Endpoint:** `POST /api/v1/users/register`

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "role": "seller",
  "metadata": {
    "company": "ACME Corp",
    "department": "Sales"
  }
}
```

**Response:**
```json
{
  "user_id": "user_abc123",
  "name": "John Doe",
  "email": "john@example.com",
  "voice_trained": false,
  "created_at": "2025-01-05T10:30:00Z"
}
```

**UI Flow:**
1. Simple registration form with name, email, role
2. Validation: email format, required fields
3. Success message with redirect to voice training

---

### 2. Voice Training (Speaker Model Creation)

**Purpose:** Train a Gaussian Mixture Model (GMM) on user's voice for speaker identification

**API Endpoint:** `POST /api/v1/users/{user_id}/train-voice`

**Process:**
1. User records 5-10 short phrases (10-15 seconds each)
2. System extracts MFCC features from each recording
3. Trains GMM model (n_components=16, covariance_type='diag')
4. Saves model as pickle file: `models/voice/{user_id}.pkl`

**Request:**
```json
{
  "audio_samples": [
    {
      "phrase_number": 1,
      "audio_base64": "UklGRiQAAABXQVZFZm10...",
      "duration": 12.5
    }
  ]
}
```

**Response:**
```json
{
  "user_id": "user_abc123",
  "voice_trained": true,
  "samples_count": 8,
  "model_accuracy": 0.95,
  "model_size_kb": 45
}
```

**Training Phrases (Suggested):**
1. "Здравствуйте, меня зовут [Имя], я представляю компанию [Компания]"
2. "Позвольте рассказать о нашем продукте и его преимуществах"
3. "У нас есть специальное предложение для вас сегодня"
4. "Какие вопросы у вас есть по нашему предложению?"
5. "Отлично, давайте обсудим детали и условия сотрудничества"
6. "Спасибо за ваше время, я отправлю вам дополнительную информацию"
7. "Можем ли мы назначить следующую встречу на этой неделе?"
8. "Я уверен, что наше решение идеально подойдет для вашего бизнеса"

**UI Components:**
- Material-UI Card with instructions
- Recording button (MUI Fab with microphone icon)
- Progress indicator: "Фраза 3 из 8"
- Audio playback for confirmation
- LinearProgress showing training progress
- Success animation on completion

**Technical Details:**
- MFCC extraction: n_mfcc=13, hop_length=512, n_fft=2048
- Frame length: 25ms, frame shift: 10ms
- Delta and delta-delta features included
- GMM parameters: 16 components, diagonal covariance

---

### 3. Audio Analysis Pipeline

**API Endpoint:** `POST /api/v1/analysis/analyze-call`

**Request:**
```json
{
  "user_id": "user_abc123",
  "audio_file": "base64_encoded_audio_data",
  "filename": "call_2025_01_05.wav",
  "metadata": {
    "client_name": "Client Corp",
    "call_type": "sales",
    "date": "2025-01-05"
  }
}
```

**Processing Steps:**

#### Step 1: Audio Segmentation
- Use librosa to detect voice activity
- Split audio into segments based on silence (threshold: -40dB, min_silence: 0.5s)
- Segment duration: 2-10 seconds

#### Step 2: Speaker Identification (GMM)
For each segment:
1. Extract MFCC features (same as training)
2. Calculate log-likelihood against trained GMM
3. Classify as "A" (seller) if likelihood > threshold, else "B" (client)

**Algorithm:**
```python
def identify_speaker(audio_segment, gmm_model, threshold=-15.0):
    mfcc = librosa.feature.mfcc(y=audio_segment, sr=16000, n_mfcc=13)
    log_likelihood = gmm_model.score(mfcc.T)
    return "seller" if log_likelihood > threshold else "client"
```

#### Step 3: Client Emotion Analysis (RandomForest)

For each client segment, extract features and predict three metrics (0-10 scale):

**A. Enthusiasm Detection**
- Features: pitch variance, energy, speaking rate
- High pitch variance + high energy = high enthusiasm
- RandomForest trained on labeled samples

**Feature Extraction:**
```python
# Pitch features
pitch = librosa.yin(audio, fmin=75, fmax=400)
pitch_mean = np.mean(pitch)
pitch_std = np.std(pitch)
pitch_range = np.max(pitch) - np.min(pitch)

# Energy features
energy = librosa.feature.rms(y=audio)[0]
energy_mean = np.mean(energy)
energy_std = np.std(energy)

# Speaking rate (syllable rate approximation)
onset_env = librosa.onset.onset_strength(y=audio, sr=sr)
tempo, _ = librosa.beat.beat_track(onset_envelope=onset_env, sr=sr)
```

**B. Agreement Detection**
- Features: keyword matching, speech tempo, pitch contour
- Keywords: "да", "согласен", "хорошо", "понятно", "подходит"
- Steady tempo + positive keywords = high agreement

**Keyword Detection:**
```python
AGREEMENT_KEYWORDS = [
    "да", "согласен", "согласна", "хорошо", "отлично", 
    "понятно", "правильно", "верно", "подходит", "устраивает"
]

DISAGREEMENT_KEYWORDS = [
    "нет", "не согласен", "не подходит", "дорого", 
    "не понятно", "сомневаюсь", "подумаю"
]

# Transcribe with Vosk, count keyword occurrences
agreement_score = (agreement_count * 10) / (agreement_count + disagreement_count + 1)
```

**C. Stress Detection**
- Features: jitter (pitch perturbation), pause duration, speech rate variance
- High jitter + long pauses = high stress

**Jitter Calculation:**
```python
def calculate_jitter(pitch):
    """Local jitter: average absolute difference between consecutive periods"""
    periods = 1.0 / pitch[pitch > 0]  # Convert Hz to periods
    jitter = np.mean(np.abs(np.diff(periods))) / np.mean(periods)
    return jitter * 100  # Percentage

# Pause analysis
silence_intervals = librosa.effects.split(audio, top_db=30)
pauses = []
for i in range(len(silence_intervals) - 1):
    pause_duration = (silence_intervals[i+1][0] - silence_intervals[i][1]) / sr
    pauses.append(pause_duration)
avg_pause = np.mean(pauses) if pauses else 0
```

**RandomForest Model Structure:**
```python
# Training data format
X = [
    [pitch_mean, pitch_std, pitch_range, energy_mean, energy_std, 
     tempo, jitter, avg_pause, keyword_score, speech_rate]
]
y_enthusiasm = [7]  # 0-10 scale
y_agreement = [8]
y_stress = [3]

# Three separate models
rf_enthusiasm = RandomForestClassifier(n_estimators=50, max_depth=10)
rf_agreement = RandomForestClassifier(n_estimators=50, max_depth=10)
rf_stress = RandomForestClassifier(n_estimators=50, max_depth=10)
```

**Response Format:**
```json
{
  "call_id": "call_xyz789",
  "user_id": "user_abc123",
  "duration": 180.5,
  "segments": [
    {
      "segment_id": 0,
      "start_time": 0.0,
      "end_time": 5.2,
      "speaker": "seller",
      "transcript": "Здравствуйте, меня зовут Иван..."
    },
    {
      "segment_id": 1,
      "start_time": 5.2,
      "end_time": 8.7,
      "speaker": "client",
      "transcript": "Здравствуйте, да, слушаю вас",
      "emotions": {
        "enthusiasm": 6.5,
        "agreement": 7.2,
        "stress": 3.1
      }
    }
  ],
  "summary": {
    "total_segments": 45,
    "seller_segments": 23,
    "client_segments": 22,
    "avg_client_emotions": {
      "enthusiasm": 5.8,
      "agreement": 6.4,
      "stress": 4.2
    }
  },
  "alerts": [
    {
      "time": 45.3,
      "type": "high_stress",
      "message": "Клиент показывает признаки стресса",
      "recommendation": "Попробуйте снизить темп разговора"
    },
    {
      "time": 78.1,
      "type": "low_enthusiasm",
      "message": "Энтузиазм клиента снижается",
      "recommendation": "Добавьте конкретные примеры или кейсы"
    }
  ]
}
```

**Alert Generation Rules:**
```python
# Enthusiasm alerts
if enthusiasm < 4.0:
    alert("low_enthusiasm", "Попробуйте задать открытые вопросы")
if enthusiasm > 8.0:
    alert("high_enthusiasm", "Отличный момент для закрытия сделки")

# Agreement alerts  
if agreement < 4.0:
    alert("low_agreement", "Клиент выражает сомнения, уточните возражения")
if agreement > 8.0:
    alert("high_agreement", "Клиент готов двигаться дальше")

# Stress alerts
if stress > 7.0:
    alert("high_stress", "Снизьте темп, дайте клиенту время подумать")
if stress < 3.0 and enthusiasm > 6.0:
    alert("comfortable", "Клиент расслаблен и вовлечен")

# Trend alerts (3+ consecutive segments)
if enthusiasm_trend_down > 3:
    alert("enthusiasm_dropping", "Теряем интерес клиента")
```

---

### 4. Frontend Implementation

#### 4.1 Registration Page (`/register`)

**Components:**
```tsx
<Container maxWidth="sm">
  <Paper elevation={3} sx={{ p: 4, mt: 8 }}>
    <Typography variant="h4" gutterBottom>Регистрация</Typography>
    <Box component="form" onSubmit={handleSubmit}>
      <TextField label="Имя" fullWidth required />
      <TextField label="Email" type="email" fullWidth required />
      <TextField label="Компания" fullWidth />
      <Button type="submit" variant="contained" fullWidth>
        Зарегистрироваться
      </Button>
    </Box>
  </Paper>
</Container>
```

#### 4.2 Voice Training Page (`/train-voice`)

**Components:**
```tsx
<Container maxWidth="md">
  <Card>
    <CardContent>
      <Typography variant="h5">Обучение голоса</Typography>
      <Typography variant="body2" color="text.secondary">
        Запишите {TOTAL_PHRASES} коротких фраз для обучения системы
      </Typography>
      
      <Box sx={{ mt: 3 }}>
        <LinearProgress 
          variant="determinate" 
          value={(currentPhrase / TOTAL_PHRASES) * 100} 
        />
        <Typography variant="caption">
          Фраза {currentPhrase} из {TOTAL_PHRASES}
        </Typography>
      </Box>

      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography variant="body1" sx={{ mb: 2 }}>
          {phrases[currentPhrase]}
        </Typography>
        
        <Fab 
          color={isRecording ? "secondary" : "primary"}
          onClick={handleRecordToggle}
        >
          <MicIcon />
        </Fab>
      </Box>

      {recordedAudio && (
        <Box sx={{ mt: 2 }}>
          <audio controls src={recordedAudio} />
          <Button onClick={handleConfirm}>Подтвердить</Button>
          <Button onClick={handleRetry}>Повторить</Button>
        </Box>
      )}
    </CardContent>
  </Card>
</Container>
```

**State Management:**
```typescript
interface TrainingState {
  currentPhrase: number;
  totalPhrases: number;
  recordedSamples: AudioBlob[];
  isRecording: boolean;
  isTraining: boolean;
}

const [state, setState] = useState<TrainingState>({
  currentPhrase: 0,
  totalPhrases: 8,
  recordedSamples: [],
  isRecording: false,
  isTraining: false
});
```

#### 4.3 Analysis Dashboard (`/analyze`)

**Layout:**
```tsx
<Grid container spacing={3}>
  {/* Left Panel: Audio Player & Controls */}
  <Grid item xs={12} md={4}>
    <Card>
      <CardContent>
        <input 
          type="file" 
          accept=".wav,.mp3" 
          onChange={handleFileUpload}
        />
        <audio ref={audioRef} controls onTimeUpdate={handleTimeUpdate} />
        <Typography>Длительность: {duration}s</Typography>
      </CardContent>
    </Card>

    {/* Current Metrics Display */}
    <Card sx={{ mt: 2 }}>
      <CardContent>
        <Typography variant="h6">Текущие показатели</Typography>
        <Box sx={{ mt: 2 }}>
          <Typography>Энтузиазм: {currentMetrics.enthusiasm}/10</Typography>
          <LinearProgress 
            variant="determinate" 
            value={currentMetrics.enthusiasm * 10}
            color="success"
          />
        </Box>
        {/* Similar for agreement and stress */}
      </CardContent>
    </Card>
  </Grid>

  {/* Right Panel: Charts */}
  <Grid item xs={12} md={8}>
    <Card>
      <CardContent>
        <Typography variant="h6">Анализ эмоций клиента</Typography>
        <Line
          data={chartData}
          options={chartOptions}
          height={300}
        />
      </CardContent>
    </Card>

    {/* Transcript Timeline */}
    <Card sx={{ mt: 2 }}>
      <CardContent>
        <Typography variant="h6">Транскрипция</Typography>
        <List>
          {segments.map(segment => (
            <ListItem key={segment.id}>
              <ListItemText
                primary={segment.transcript}
                secondary={`${segment.speaker} - ${segment.start_time}s`}
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  </Grid>
</Grid>
```

**Chart.js Configuration:**
```typescript
const chartData = {
  labels: timeLabels, // ['0s', '5s', '10s', ...]
  datasets: [
    {
      label: 'Энтузиазм',
      data: enthusiasmData,
      borderColor: '#4caf50',
      backgroundColor: 'rgba(76, 175, 80, 0.1)',
      tension: 0.4
    },
    {
      label: 'Согласие',
      data: agreementData,
      borderColor: '#2196f3',
      backgroundColor: 'rgba(33, 150, 243, 0.1)',
      tension: 0.4
    },
    {
      label: 'Стресс',
      data: stressData,
      borderColor: '#f44336',
      backgroundColor: 'rgba(244, 67, 54, 0.1)',
      tension: 0.4
    }
  ]
};

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      min: 0,
      max: 10,
      title: { display: true, text: 'Уровень' }
    },
    x: {
      title: { display: true, text: 'Время (секунды)' }
    }
  },
  plugins: {
    legend: {
      position: 'top' as const
    },
    tooltip: {
      mode: 'index',
      intersect: false
    }
  },
  interaction: {
    mode: 'nearest',
    axis: 'x',
    intersect: false
  }
};
```

**Alert Popup Component:**
```tsx
<Snackbar
  open={alertOpen}
  autoHideDuration={6000}
  onClose={handleAlertClose}
  anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
>
  <Alert 
    severity={alertSeverity} 
    onClose={handleAlertClose}
    icon={<InfoIcon />}
  >
    <AlertTitle>{alertTitle}</AlertTitle>
    {alertMessage}
  </Alert>
</Snackbar>
```

**Real-time Synchronization:**
```typescript
const handleTimeUpdate = () => {
  const currentTime = audioRef.current?.currentTime || 0;
  
  // Find current segment
  const currentSegment = segments.find(
    s => s.start_time <= currentTime && s.end_time >= currentTime
  );
  
  if (currentSegment && currentSegment.speaker === 'client') {
    setCurrentMetrics(currentSegment.emotions);
    
    // Update chart position indicator
    setChartCurrentTime(currentTime);
  }
  
  // Check for alerts at this timestamp
  const alert = alerts.find(a => 
    Math.abs(a.time - currentTime) < 0.5 && !a.shown
  );
  
  if (alert) {
    showAlert(alert);
    alert.shown = true;
  }
};
```

---

### 5. Data Models

#### SQLite Schema

```sql
-- Users table
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'seller',
    voice_trained BOOLEAN DEFAULT 0,
    model_path TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Calls table
CREATE TABLE calls (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    filename TEXT NOT NULL,
    duration REAL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    analyzed BOOLEAN DEFAULT 0,
    metadata JSON,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Segments table
CREATE TABLE segments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    call_id TEXT NOT NULL,
    segment_number INTEGER,
    start_time REAL,
    end_time REAL,
    speaker TEXT,
    transcript TEXT,
    enthusiasm REAL,
    agreement REAL,
    stress REAL,
    FOREIGN KEY (call_id) REFERENCES calls(id)
);

-- Alerts table
CREATE TABLE alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    call_id TEXT NOT NULL,
    timestamp REAL,
    alert_type TEXT,
    message TEXT,
    recommendation TEXT,
    FOREIGN KEY (call_id) REFERENCES calls(id)
);
```

#### Pickle Model Storage

```
models/
├── voice/
│   ├── user_abc123.pkl          # GMM model for user
│   ├── user_def456.pkl
│   └── ...
├── emotion/
│   ├── enthusiasm_rf.pkl        # Pre-trained RandomForest
│   ├── agreement_rf.pkl
│   └── stress_rf.pkl
└── vosk/
    └── vosk-model-small-ru-0.22/  # ~50MB Russian model
```

---

### 6. API Specification

#### Authentication (Simple Token-based)

```python
# For MVP: Simple user_id in header
headers = {
    "X-User-ID": "user_abc123"
}
```

#### Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/users/register` | Register new user |
| GET | `/api/v1/users/{id}` | Get user info |
| POST | `/api/v1/users/{id}/train-voice` | Train voice model |
| POST | `/api/v1/analysis/upload` | Upload audio file |
| POST | `/api/v1/analysis/analyze` | Start analysis |
| GET | `/api/v1/analysis/{call_id}` | Get analysis results |
| GET | `/api/v1/analysis/{call_id}/segments` | Get all segments |
| GET | `/api/v1/calls` | List user's calls |
| DELETE | `/api/v1/calls/{call_id}` | Delete call |

#### Error Responses

```json
{
  "error": "ValidationError",
  "message": "Audio file too large. Max size: 100MB",
  "code": "AUDIO_TOO_LARGE",
  "details": {
    "max_size": 104857600,
    "received_size": 150000000
  }
}
```

---

### 7. Performance Requirements

| Metric | Target | Notes |
|--------|--------|-------|
| Voice training time | <30s | For 8 samples |
| Audio upload | <5s | For 10MB file |
| Analysis processing | <1min | For 3-minute call |
| Model loading | <2s | GMM + RandomForest |
| UI responsiveness | <100ms | Button clicks, navigation |
| Chart rendering | <500ms | For 100 data points |
| Memory usage | <1GB | During analysis |
| Model size | <50MB | All models combined |

**Optimization Strategies:**
- Use multiprocessing for parallel segment processing
- Cache extracted features for re-analysis
- Lazy load Vosk model on first use
- Stream large audio files in chunks
- Use Web Workers for frontend audio processing

---

### 8. Future Enhancements (Phase 2)

#### Real-time Analysis via WebSocket

**Architecture:**
```
Client Browser → WebRTC → FastAPI WebSocket → Analysis Engine
                    ↓
              Live metrics stream
```

**Implementation:**
```python
@app.websocket("/ws/live-analysis")
async def live_analysis(websocket: WebSocket):
    await websocket.accept()
    
    buffer = AudioBuffer(chunk_size=3.0)  # 3-second chunks
    
    while True:
        # Receive audio chunk
        audio_data = await websocket.receive_bytes()
        buffer.add(audio_data)
        
        if buffer.is_ready():
            # Analyze chunk
            segment = buffer.get_segment()
            speaker = identify_speaker(segment)
            
            if speaker == "client":
                emotions = analyze_emotions(segment)
                
                # Send results
                await websocket.send_json({
                    "type": "emotion_update",
                    "timestamp": time.time(),
                    "emotions": emotions
                })
            
            buffer.clear()
```

**Frontend WebSocket Client:**
```typescript
const ws = new WebSocket('ws://localhost:8000/ws/live-analysis');

navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => {
    const mediaRecorder = new MediaRecorder(stream);
    
    mediaRecorder.ondataavailable = (event) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(event.data);
      }
    };
    
    mediaRecorder.start(1000); // Send chunks every second
  });

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  updateCharts(data.emotions);
  checkAlerts(data);
};
```

#### Additional Features
- Multi-language support (English, Russian)
- Export reports to PDF
- Team analytics dashboard
- A/B testing for different pitch strategies
- Integration with CRM systems
- Mobile app for on-the-go analysis

---

### 9. Testing Strategy

#### Unit Tests
```python
# test_speaker_identification.py
def test_gmm_training():
    samples = load_test_samples("tests/data/user_voice/")
    gmm = train_gmm_model(samples)
    assert gmm.n_components == 16
    assert gmm.covariance_type == 'diag'

def test_speaker_classification():
    gmm = load_model("tests/models/test_user.pkl")
    seller_audio = load_audio("tests/data/seller_segment.wav")
    client_audio = load_audio("tests/data/client_segment.wav")
    
    assert identify_speaker(seller_audio, gmm) == "seller"
    assert identify_speaker(client_audio, gmm) == "client"

# test_emotion_analysis.py
def test_enthusiasm_detection():
    audio = load_audio("tests/data/high_enthusiasm.wav")
    features = extract_features(audio)
    enthusiasm = predict_enthusiasm(features)
    assert enthusiasm > 7.0

def test_stress_detection():
    audio = load_audio("tests/data/high_stress.wav")
    features = extract_features(audio)
    stress = predict_stress(features)
    assert stress > 6.0
```

#### Integration Tests
```python
def test_full_analysis_pipeline():
    # Upload audio
    response = client.post("/api/v1/analysis/upload", files={"file": audio_file})
    call_id = response.json()["call_id"]
    
    # Start analysis
    response = client.post(f"/api/v1/analysis/analyze", json={"call_id": call_id})
    assert response.status_code == 200
    
    # Get results
    response = client.get(f"/api/v1/analysis/{call_id}")
    data = response.json()
    
    assert "segments" in data
    assert len(data["segments"]) > 0
    assert "emotions" in data["segments"][0]
```

#### Frontend Tests
```typescript
describe('Voice Training Component', () => {
  it('records and confirms phrases', async () => {
    render(<VoiceTraining />);
    
    const recordButton = screen.getByRole('button', { name: /record/i });
    fireEvent.click(recordButton);
    
    await waitFor(() => {
      expect(screen.getByText(/recording/i)).toBeInTheDocument();
    });
    
    fireEvent.click(recordButton); // Stop recording
    
    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    expect(confirmButton).toBeEnabled();
  });
});
```

---

### 10. Deployment Instructions

#### Local Development Setup

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Download Vosk model
wget https://alphacephei.com/vosk/models/vosk-model-small-ru-0.22.zip
unzip vosk-model-small-ru-0.22.zip -d models/vosk/

# Initialize database
python scripts/init_db.py

# Train baseline emotion models (if not pre-trained)
python scripts/train_emotion_models.py

# Run backend
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm start
```

#### Production Deployment

```dockerfile
# Dockerfile.backend
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    libsndfile1 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Download Vosk model during build
RUN wget -q https://alphacephei.com/vosk/models/vosk-model-small-ru-0.22.zip \
    && unzip -q vosk-model-small-ru-0.22.zip -d models/vosk/ \
    && rm vosk-model-small-ru-0.22.zip

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    volumes:
      - ./data:/app/data
      - ./models:/app/models
    environment:
      - DATABASE_URL=sqlite:///./data/nanalyzer.db

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_API_URL=http://localhost:8000
    depends_on:
      - backend
```

---

### 11. Dependencies

#### Backend (requirements.txt)
```txt
fastapi==0.109.0
uvicorn[standard]==0.27.0
python-multipart==0.0.6

# ML & Audio
scikit-learn==1.4.0
librosa==0.10.1
numpy==1.26.3
scipy==1.11.4
vosk==0.3.45
soundfile==0.12.1

# Database
sqlalchemy==2.0.25
aiosqlite==0.19.0

# Utilities
python-dotenv==1.0.0
pydantic==2.5.3
```

#### Frontend (package.json)
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.21.1",
    "@mui/material": "^5.15.0",
    "@mui/icons-material": "^5.15.0",
    "@emotion/react": "^11.11.3",
    "@emotion/styled": "^11.11.0",
    "chart.js": "^4.4.1",
    "react-chartjs-2": "^5.2.0",
    "axios": "^1.6.5",
    "typescript": "^5.3.3"
  }
}
```

---

### 12. File Structure

```
nAnalyzer/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── users.py              # User registration, voice training
│   │   │   ├── analysis.py           # Analysis endpoints
│   │   │   └── calls.py              # Call management
│   │   ├── ml/
│   │   │   ├── speaker_id.py         # GMM speaker identification
│   │   │   ├── emotion_analysis.py   # RandomForest emotion models
│   │   │   ├── feature_extraction.py # MFCC, pitch, energy extraction
│   │   │   └── transcription.py      # Vosk integration
│   │   ├── models/
│   │   │   ├── database.py           # SQLAlchemy models
│   │   │   └── schemas.py            # Pydantic schemas
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   └── security.py
│   │   └── main.py
│   ├── models/                        # Trained models (gitignored)
│   │   ├── voice/                    # User GMM models
│   │   ├── emotion/                  # RandomForest models
│   │   └── vosk/                     # Vosk STT model
│   ├── data/                          # Database & uploads (gitignored)
│   │   ├── nanalyzer.db
│   │   └── uploads/
│   ├── scripts/
│   │   ├── init_db.py
│   │   └── train_emotion_models.py
│   ├── tests/
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AudioPlayer.tsx
│   │   │   ├── EmotionChart.tsx
│   │   │   ├── TranscriptView.tsx
│   │   │   └── AlertPopup.tsx
│   │   ├── pages/
│   │   │   ├── Register.tsx
│   │   │   ├── VoiceTraining.tsx
│   │   │   ├── AnalysisDashboard.tsx
│   │   │   └── CallHistory.tsx
│   │   ├── services/
│   │   │   └── api.ts                # Axios API client
│   │   ├── hooks/
│   │   │   └── useAudioRecorder.ts
│   │   ├── App.tsx
│   │   └── index.tsx
│   └── package.json
├── docs/
│   └── SPECIFICATION.md               # This file
└── docker-compose.yml
```

---

## Summary

This specification defines a complete, lightweight, CPU-only sales call analysis system with:

- **Speaker Identification**: GMM-based (scikit-learn) trained on user's voice
- **Emotion Analysis**: RandomForest models for enthusiasm, agreement, and stress
- **Speech-to-Text**: Vosk for Russian transcription
- **UI**: Material-UI React frontend with Chart.js visualizations
- **Storage**: SQLite + pickle for models
- **Size**: <50MB total model size
- **Performance**: <1 minute analysis for 3-minute calls

All processing happens locally with no external API dependencies, ensuring privacy and low latency.
