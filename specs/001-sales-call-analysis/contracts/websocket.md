# WebSocket API Specification

## Connection

**Endpoint**: `ws://localhost:8000/api/v1/analysis/{call_id}/stream`

**Protocol**: WebSocket (RFC 6455)

**Authentication**: Include user_id in connection query parameter
```
ws://localhost:8000/api/v1/analysis/call_abc456/stream?user_id=user_123
```

## Message Format

All messages are JSON-encoded with the following base structure:

```json
{
  "type": "message_type",
  "timestamp": 1704452400.123,
  "data": { }
}
```

## Client → Server Messages

### Subscribe to Call Updates

```json
{
  "type": "subscribe",
  "call_id": "call_abc456"
}
```

**Response**: `subscribed` message

---

## Server → Client Messages

### 1. Subscribed Confirmation

Sent immediately after successful subscription.

```json
{
  "type": "subscribed",
  "timestamp": 1704452400.0,
  "data": {
    "call_id": "call_abc456",
    "status": "processing"
  }
}
```

---

### 2. Upload Progress

Sent during chunked upload to show progress.

```json
{
  "type": "upload_progress",
  "timestamp": 1704452401.5,
  "data": {
    "call_id": "call_abc456",
    "chunks_received": 15,
    "chunks_total": 50,
    "progress_percent": 30.0,
    "bytes_received": 15728640
  }
}
```

**Fields**:
- `chunks_received` (integer): Number of chunks received
- `chunks_total` (integer): Total expected chunks
- `progress_percent` (float): Upload progress (0-100)
- `bytes_received` (integer): Total bytes received

---

### 3. Analysis Started

Sent when analysis pipeline begins processing.

```json
{
  "type": "analysis_started",
  "timestamp": 1704452410.0,
  "data": {
    "call_id": "call_abc456",
    "duration": 180.5,
    "detected_language": "ru",
    "estimated_segments": 45
  }
}
```

**Fields**:
- `duration` (float): Audio duration in seconds
- `detected_language` (string): 'ru' or 'en'
- `estimated_segments` (integer): Estimated number of segments

---

### 4. Segment Complete

Sent each time a segment is processed. This is the primary real-time update.

```json
{
  "type": "segment_complete",
  "timestamp": 1704452412.3,
  "data": {
    "call_id": "call_abc456",
    "segment_number": 1,
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
}
```

**Fields**:
- `segment_number` (integer): Sequential segment ID (0, 1, 2...)
- `start_time` (float): Segment start in seconds
- `end_time` (float): Segment end in seconds
- `speaker` (string): 'seller' or 'client'
- `transcript` (string): Vosk transcription
- `emotions` (object, nullable): Only present for client segments
  - `enthusiasm` (float): 0-10 scale
  - `agreement` (float): 0-10 scale
  - `stress` (float): 0-10 scale

---

### 5. Alert Generated

Sent when analysis detects a notable emotion pattern.

```json
{
  "type": "alert",
  "timestamp": 1704452445.3,
  "data": {
    "call_id": "call_abc456",
    "alert_time": 45.3,
    "alert_type": "high_stress",
    "severity": "warning",
    "message": "Клиент показывает признаки стресса",
    "recommendation": "Попробуйте снизить темп разговора"
  }
}
```

**Alert Types**:
- `high_stress`: Client stress > 7.0
- `low_enthusiasm`: Client enthusiasm < 4.0
- `high_enthusiasm`: Client enthusiasm > 8.0
- `low_agreement`: Client agreement < 4.0
- `high_agreement`: Client agreement > 8.0
- `enthusiasm_dropping`: Declining trend over 3+ segments

**Severity Levels**:
- `info`: Positive signals (high_enthusiasm, high_agreement)
- `warning`: Concerning patterns (high_stress, low_enthusiasm)
- `critical`: Multiple negative trends

---

### 6. Analysis Complete

Sent when all processing is finished.

```json
{
  "type": "analysis_complete",
  "timestamp": 1704452500.0,
  "data": {
    "call_id": "call_abc456",
    "summary": {
      "total_segments": 45,
      "seller_segments": 23,
      "client_segments": 22,
      "avg_client_emotions": {
        "enthusiasm": 5.8,
        "agreement": 6.4,
        "stress": 4.2
      },
      "alerts_generated": 5,
      "processing_time_seconds": 90
    }
  }
}
```

**Fields**:
- `summary.total_segments` (integer): Total segments processed
- `summary.seller_segments` (integer): Segments identified as seller
- `summary.client_segments` (integer): Segments identified as client
- `summary.avg_client_emotions` (object): Average emotion scores
- `summary.alerts_generated` (integer): Number of alerts
- `summary.processing_time_seconds` (float): Time taken

---

### 7. Error

Sent when an error occurs during processing.

```json
{
  "type": "error",
  "timestamp": 1704452450.0,
  "data": {
    "call_id": "call_abc456",
    "error_code": "TRANSCRIPTION_FAILED",
    "error_message": "Vosk model failed to load",
    "recoverable": false,
    "details": {
      "model_path": "/models/vosk/vosk-model-small-ru-0.22",
      "reason": "file_not_found"
    }
  }
}
```

**Error Codes**:
- `TRANSCRIPTION_FAILED`: STT error
- `MODEL_NOT_FOUND`: GMM or emotion model missing
- `AUDIO_CORRUPTED`: Invalid audio format
- `PROCESSING_TIMEOUT`: Analysis exceeded timeout
- `INSUFFICIENT_MEMORY`: Out of memory during processing

**Fields**:
- `recoverable` (boolean): Whether client should retry
- `details` (object): Additional error context

---

### 8. Heartbeat

Sent every 30 seconds to keep connection alive.

```json
{
  "type": "heartbeat",
  "timestamp": 1704452430.0,
  "data": {
    "status": "connected"
  }
}
```

---

## Connection Lifecycle

```
1. Client connects to WebSocket endpoint
   ↓
2. Server sends "subscribed" message
   ↓
3. [If upload in progress] Server sends "upload_progress" messages
   ↓
4. Server sends "analysis_started"
   ↓
5. Server sends multiple "segment_complete" messages as processing occurs
   ↓
6. [Optional] Server sends "alert" messages when patterns detected
   ↓
7. Server sends "analysis_complete"
   ↓
8. Connection remains open for heartbeats or client closes
```

## Error Handling

### Reconnection Strategy

If WebSocket disconnects:

1. Wait 1 second
2. Reconnect to same endpoint
3. Re-subscribe to call
4. Server resumes from last acknowledged segment

### Exponential Backoff

- 1st retry: 1 second
- 2nd retry: 2 seconds
- 3rd retry: 4 seconds
- Max delay: 30 seconds

### Idempotency

Server tracks last sent `segment_number` per client. On reconnect, server skips already-sent segments.

---

## Client Implementation Example

```javascript
class CallAnalysisWebSocket {
  constructor(callId, userId) {
    this.callId = callId;
    this.userId = userId;
    this.ws = null;
    this.reconnectAttempts = 0;
  }

  connect() {
    const url = `ws://localhost:8000/api/v1/analysis/${this.callId}/stream?user_id=${this.userId}`;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.subscribe();
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onclose = () => {
      console.log('WebSocket closed');
      this.reconnect();
    };
  }

  subscribe() {
    this.send({
      type: 'subscribe',
      call_id: this.callId
    });
  }

  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  handleMessage(message) {
    switch(message.type) {
      case 'subscribed':
        console.log('Subscribed to', message.data.call_id);
        break;
      case 'segment_complete':
        this.onSegmentComplete(message.data);
        break;
      case 'alert':
        this.onAlert(message.data);
        break;
      case 'analysis_complete':
        this.onComplete(message.data);
        break;
      case 'error':
        this.onError(message.data);
        break;
    }
  }

  reconnect() {
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;
    
    setTimeout(() => {
      console.log(`Reconnecting (attempt ${this.reconnectAttempts})...`);
      this.connect();
    }, delay);
  }

  // Callback methods to be implemented by consumer
  onSegmentComplete(data) {}
  onAlert(data) {}
  onComplete(data) {}
  onError(data) {}
}
```

---

## Testing

### Manual Testing with wscat

```bash
# Install wscat
npm install -g wscat

# Connect to WebSocket
wscat -c "ws://localhost:8000/api/v1/analysis/call_abc456/stream?user_id=user_123"

# Send subscribe message
> {"type": "subscribe", "call_id": "call_abc456"}

# Observe incoming messages
```

### Integration Test Scenarios

1. **Normal Flow**: Upload → Analysis → Completion
2. **Disconnection**: Disconnect mid-analysis, reconnect, verify resumption
3. **Multiple Clients**: Multiple clients subscribe to same call
4. **Error Handling**: Trigger error, verify error message format
5. **Heartbeat**: Keep connection open > 1 minute, verify heartbeats

---

**Version**: 1.0.0  
**Last Updated**: 2025-01-05
