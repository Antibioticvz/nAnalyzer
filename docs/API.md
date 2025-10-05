# API Documentation

nAnalyzer REST API Reference

Base URL: `http://localhost:8000/api/v1`

## Authentication

For single-user deployments, authentication is optional. For multi-user deployments, include JWT token in headers:

```http
Authorization: Bearer <your-jwt-token>
```

## Calls API

### Start Call Recording

Start capturing and analyzing a new call.

```http
POST /api/v1/calls/start
```

**Request Body:**
```json
{
  "source": "microphone",
  "metadata": {
    "caller": "John Doe",
    "tags": ["sales", "demo"]
  }
}
```

**Response:**
```json
{
  "id": "call_abc123",
  "status": "recording",
  "started_at": "2025-01-05T10:30:00Z",
  "duration": null
}
```

**Status Codes:**
- `200 OK`: Call started successfully
- `400 Bad Request`: Invalid source or parameters
- `503 Service Unavailable`: Max concurrent calls reached

---

### Stop Call Recording

Stop recording and finalize analysis.

```http
POST /api/v1/calls/{call_id}/stop
```

**Response:**
```json
{
  "id": "call_abc123",
  "status": "completed",
  "started_at": "2025-01-05T10:30:00Z",
  "duration": 180.5
}
```

---

### List Calls

Get a paginated list of all calls.

```http
GET /api/v1/calls?limit=50&offset=0&status=completed
```

**Query Parameters:**
- `limit` (optional): Number of results (1-100, default: 50)
- `offset` (optional): Pagination offset (default: 0)
- `status` (optional): Filter by status (`recording`, `completed`, `failed`)

**Response:**
```json
{
  "calls": [
    {
      "id": "call_abc123",
      "status": "completed",
      "started_at": "2025-01-05T10:30:00Z",
      "duration": 180.5,
      "sentiment": "positive"
    }
  ],
  "total": 42,
  "limit": 50,
  "offset": 0
}
```

---

### Get Call Details

Retrieve detailed information about a specific call.

```http
GET /api/v1/calls/{call_id}
```

**Response:**
```json
{
  "id": "call_abc123",
  "status": "completed",
  "started_at": "2025-01-05T10:30:00Z",
  "ended_at": "2025-01-05T10:33:00Z",
  "duration": 180.5,
  "metadata": {
    "caller": "John Doe",
    "tags": ["sales", "demo"]
  },
  "transcript": {
    "segments": [
      {
        "text": "Hello, how can I help you today?",
        "start_time": 0.5,
        "end_time": 2.3,
        "speaker": "agent",
        "confidence": 0.95
      }
    ]
  },
  "analysis": {
    "sentiment": "positive",
    "talk_ratio": 0.6,
    "listen_ratio": 0.4,
    "questions_asked": 5,
    "keywords": [
      {"word": "product", "relevance": 0.9, "count": 7},
      {"word": "pricing", "relevance": 0.85, "count": 4}
    ]
  }
}
```

---

### Delete Call

Delete a call and all associated data.

```http
DELETE /api/v1/calls/{call_id}
```

**Response:**
```json
{
  "message": "Call deleted successfully"
}
```

---

## Analysis API

### Get Call Analysis

Get analysis results for a completed call.

```http
GET /api/v1/analysis/{call_id}
```

**Response:**
```json
{
  "call_id": "call_abc123",
  "sentiment": {
    "overall": "positive",
    "score": 0.85,
    "distribution": {
      "positive": 0.7,
      "neutral": 0.2,
      "negative": 0.1
    }
  },
  "metrics": {
    "talk_ratio": 0.6,
    "listen_ratio": 0.4,
    "total_words": 1250,
    "speaking_pace": 140.5,
    "questions_asked": 5,
    "questions_answered": 8
  },
  "keywords": [
    {"word": "product", "relevance": 0.9, "count": 7},
    {"word": "pricing", "relevance": 0.85, "count": 4}
  ],
  "topics": [
    {"topic": "pricing_discussion", "score": 0.8},
    {"topic": "product_demo", "score": 0.75}
  ]
}
```

---

### Get Sentiment Timeline

Get sentiment analysis over time.

```http
GET /api/v1/analysis/{call_id}/sentiment
```

**Response:**
```json
{
  "call_id": "call_abc123",
  "timeline": [
    {
      "timestamp": 5.0,
      "label": "positive",
      "score": 0.85
    },
    {
      "timestamp": 10.0,
      "label": "neutral",
      "score": 0.65
    }
  ]
}
```

---

### Get Keywords

Get extracted keywords from a call.

```http
GET /api/v1/analysis/{call_id}/keywords?top_n=10
```

**Query Parameters:**
- `top_n` (optional): Number of top keywords (default: 10)

**Response:**
```json
{
  "call_id": "call_abc123",
  "keywords": [
    {"word": "product", "relevance": 0.9, "count": 7},
    {"word": "pricing", "relevance": 0.85, "count": 4},
    {"word": "demo", "relevance": 0.82, "count": 3}
  ]
}
```

---

## Upload API

### Upload Audio File

Upload an audio file for batch processing.

```http
POST /api/v1/upload
Content-Type: multipart/form-data
```

**Request:**
```
file: <audio_file>
metadata: {"caller": "John Doe", "date": "2025-01-05"}
```

**Supported Formats:**
- WAV (audio/wav)
- MP3 (audio/mpeg, audio/mp3)
- Opus (audio/ogg)

**Response:**
```json
{
  "call_id": "call_uploaded_123",
  "filename": "sales_call.wav",
  "size_bytes": 5242880,
  "status": "processing"
}
```

**Status Codes:**
- `200 OK`: File uploaded successfully
- `400 Bad Request`: Invalid file type or size
- `413 Payload Too Large`: File exceeds maximum size (100MB)

---

## Configuration API

### Get Configuration

Get current system configuration.

```http
GET /api/v1/config
```

**Response:**
```json
{
  "stt_model": "whisper-base",
  "sentiment_model": "distilbert-base-uncased-finetuned-sst-2-english",
  "auto_delete_days": 7,
  "pii_redaction_enabled": true,
  "max_concurrent_calls": 10
}
```

---

### Update Configuration

Update system settings.

```http
PUT /api/v1/config
```

**Request Body:**
```json
{
  "auto_delete_days": 14,
  "pii_redaction_enabled": false
}
```

**Response:**
```json
{
  "stt_model": "whisper-base",
  "sentiment_model": "distilbert-base-uncased-finetuned-sst-2-english",
  "auto_delete_days": 14,
  "pii_redaction_enabled": false,
  "max_concurrent_calls": 10
}
```

---

### List Available Models

Get list of available ML models.

```http
GET /api/v1/config/models
```

**Response:**
```json
{
  "stt_models": [
    {
      "name": "whisper-tiny",
      "size_mb": 75,
      "languages": ["en"],
      "accuracy": "good"
    },
    {
      "name": "whisper-base",
      "size_mb": 150,
      "languages": ["en", "es", "fr"],
      "accuracy": "better"
    }
  ],
  "sentiment_models": [
    {
      "name": "distilbert-base-uncased-finetuned-sst-2-english",
      "size_mb": 250,
      "languages": ["en"]
    }
  ]
}
```

---

## WebSocket API

### Live Call Updates

Connect to WebSocket for real-time updates during a call.

```
ws://localhost:8000/api/v1/calls/ws/{call_id}
```

**Message Types:**

#### Transcript Update
```json
{
  "type": "transcript_update",
  "call_id": "call_abc123",
  "text": "Hello, how can I help you?",
  "timestamp": 5.2,
  "speaker": "agent",
  "confidence": 0.95
}
```

#### Sentiment Update
```json
{
  "type": "sentiment_update",
  "call_id": "call_abc123",
  "label": "positive",
  "score": 0.85,
  "timestamp": 5.5
}
```

#### Keyword Detected
```json
{
  "type": "keyword_detected",
  "call_id": "call_abc123",
  "keyword": "pricing",
  "timestamp": 12.3
}
```

#### Audio Level
```json
{
  "type": "audio_level",
  "call_id": "call_abc123",
  "level": 0.75,
  "timestamp": 10.0
}
```

---

## Error Responses

All endpoints may return standard error responses:

### 400 Bad Request
```json
{
  "error": "Bad Request",
  "message": "Invalid source type. Supported: microphone, file, webrtc",
  "details": {
    "field": "source",
    "value": "invalid_source"
  }
}
```

### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "Call with id 'call_xyz789' not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "message": "Failed to load transcription model",
  "request_id": "req_abc123"
}
```

---

## Rate Limiting

Default rate limit: 100 requests per minute per IP address.

Rate limit headers:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704452400
```

---

## Pagination

List endpoints support pagination:

```http
GET /api/v1/calls?limit=50&offset=100
```

Response includes pagination metadata:
```json
{
  "data": [...],
  "pagination": {
    "total": 250,
    "limit": 50,
    "offset": 100,
    "has_more": true
  }
}
```

---

## Versioning

API version is included in the URL path: `/api/v1/`

Breaking changes will result in a new version: `/api/v2/`

---

## OpenAPI/Swagger

Interactive API documentation available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- OpenAPI JSON: `http://localhost:8000/openapi.json`

---

## Code Examples

### Python

```python
import requests

# Start a call
response = requests.post(
    "http://localhost:8000/api/v1/calls/start",
    json={"source": "microphone"}
)
call = response.json()
print(f"Started call: {call['id']}")

# Get analysis
analysis = requests.get(
    f"http://localhost:8000/api/v1/analysis/{call['id']}"
).json()
print(f"Sentiment: {analysis['sentiment']['overall']}")
```

### JavaScript

```javascript
// Start a call
const response = await fetch('http://localhost:8000/api/v1/calls/start', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ source: 'microphone' })
});
const call = await response.json();
console.log(`Started call: ${call.id}`);

// WebSocket connection
const ws = new WebSocket(`ws://localhost:8000/api/v1/calls/ws/${call.id}`);
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Update:', data);
};
```

### cURL

```bash
# Start a call
curl -X POST http://localhost:8000/api/v1/calls/start \
  -H "Content-Type: application/json" \
  -d '{"source": "microphone"}'

# Get call details
curl http://localhost:8000/api/v1/calls/call_abc123

# Upload audio file
curl -X POST http://localhost:8000/api/v1/upload \
  -F "file=@recording.wav" \
  -F 'metadata={"caller":"John Doe"}'
```

---

For more examples and client libraries, see the [GitHub repository](https://github.com/yourusername/nAnalyzer).
