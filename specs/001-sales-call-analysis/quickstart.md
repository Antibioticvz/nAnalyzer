# Quickstart Guide & Test Scenarios

## Overview

This guide provides step-by-step integration scenarios for testing nAnalyzer functionality, from user onboarding to advanced features.

---

## Prerequisites

**Backend Running**:
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

**Frontend Running**:
```bash
cd frontend
npm start
```

**Models Downloaded**:
- Vosk Russian model (~45MB)
- Vosk English model (~40MB)

---

## Scenario 1: User Onboarding

**Goal**: Register new user and train voice model

### Step 1: Register User

**UI**: Navigate to `/register`

**API**:
```bash
curl -X POST http://localhost:8000/api/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Johnson",
    "email": "alice@company.com",
    "role": "seller"
  }'
```

**Expected Response**:
```json
{
  "user_id": "user_abc123",
  "name": "Alice Johnson",
  "email": "alice@company.com",
  "voice_trained": false,
  "created_at": "2025-01-05T10:30:00Z"
}
```

**Validation**:
- [ ] User created in database
- [ ] Unique email enforced
- [ ] Default retention period set (7 days)

---

### Step 2: Voice Training

**UI**: Navigate to `/train-voice` → Record 8 phrases

**Phrases to Record**:
1. "Hello, my name is Alice, I represent TechCorp"
2. "Let me tell you about our product and its advantages"
3. "We have a special offer for you today"
4. "What questions do you have about our proposal?"
5. "Great, let's discuss the details and terms"
6. "Thank you for your time, I'll send you more information"
7. "Can we schedule our next meeting this week?"
8. "I'm confident our solution is perfect for your business"

**API**:
```bash
# For each phrase
curl -X POST http://localhost:8000/api/v1/users/user_abc123/train-voice \
  -H "Content-Type: application/json" \
  -H "X-User-ID: user_abc123" \
  -d '{
    "audio_samples": [
      {
        "phrase_number": 1,
        "audio_base64": "UklGRi...base64...",
        "duration": 12.5
      }
    ]
  }'
```

**Expected Response** (after all samples):
```json
{
  "user_id": "user_abc123",
  "voice_trained": true,
  "samples_count": 8,
  "model_accuracy": 0.95,
  "model_size_kb": 42,
  "calibrated_threshold": -11.8
}
```

**Validation**:
- [ ] GMM model saved to `models/voice/user_abc123.pkl`
- [ ] Threshold calibrated and stored
- [ ] User.voice_trained = true
- [ ] Can load model and get predictions

**Test GMM**:
```python
import pickle
with open('models/voice/user_abc123.pkl', 'rb') as f:
    model = pickle.load(f)
print(f"Threshold: {model['threshold']}")
print(f"GMM components: {model['gmm'].n_components}")
```

---

## Scenario 2: Simple Call Analysis

**Goal**: Upload short audio file, get analysis results

### Step 1: Prepare Test Audio

**Option A**: Use provided test file
```bash
# Russian test audio (3 minutes)
cp tests/data/sample_call_ru.wav /tmp/test_call.wav

# English test audio (2 minutes)
cp tests/data/sample_call_en.wav /tmp/test_call.wav
```

**Option B**: Record live audio (for testing microphone)

---

### Step 2: Initialize Upload

**UI**: Navigate to `/analyze` → Click "Upload Audio"

**API**:
```bash
curl -X POST http://localhost:8000/api/v1/analysis/upload \
  -H "Content-Type: application/json" \
  -H "X-User-ID: user_abc123" \
  -d '{
    "user_id": "user_abc123",
    "filename": "test_call.wav",
    "total_size_bytes": 3145728,
    "metadata": {
      "client_name": "Acme Corp",
      "call_type": "demo"
    }
  }'
```

**Expected Response**:
```json
{
  "upload_id": "upload_xyz789",
  "chunk_size": 1048576,
  "call_id": "call_pending_xyz"
}
```

---

### Step 3: Upload Chunks

**Split File**:
```bash
split -b 1M /tmp/test_call.wav /tmp/chunk_
```

**Upload Each Chunk**:
```bash
for i in {0..2}; do
  curl -X POST http://localhost:8000/api/v1/analysis/upload/upload_xyz789/chunk \
    -H "Content-Type: application/json" \
    -H "X-User-ID: user_abc123" \
    -d "{
      \"chunk_number\": $i,
      \"chunk_data\": \"$(base64 -w0 /tmp/chunk_0$i)\",
      \"is_last\": $([[ $i == 2 ]] && echo true || echo false)
    }"
done
```

**Expected Response** (each chunk):
```json
{
  "upload_id": "upload_xyz789",
  "chunks_received": 1,
  "chunks_total": 3,
  "progress_percent": 33.3
}
```

---

### Step 4: Complete Upload & Trigger Analysis

**API**:
```bash
curl -X POST http://localhost:8000/api/v1/analysis/upload/upload_xyz789/complete \
  -H "X-User-ID: user_abc123"
```

**Expected Response**:
```json
{
  "call_id": "call_abc456",
  "status": "processing",
  "estimated_completion_seconds": 120
}
```

---

### Step 5: Monitor Progress via WebSocket

**JavaScript**:
```javascript
const ws = new WebSocket('ws://localhost:8000/api/v1/analysis/call_abc456/stream');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(data);
  
  switch(data.type) {
    case 'analysis_started':
      console.log('Processing started');
      break;
    case 'segment_complete':
      console.log(`Segment ${data.segment_number}: ${data.speaker} - "${data.transcript}"`);
      if (data.speaker === 'client') {
        console.log(`Emotions: E=${data.emotions.enthusiasm}, A=${data.emotions.agreement}, S=${data.emotions.stress}`);
      }
      break;
    case 'analysis_complete':
      console.log('Analysis finished!');
      break;
  }
};
```

**Expected Messages**:
```json
{"type": "analysis_started", "call_id": "call_abc456", "timestamp": 1704452400}
{"type": "segment_complete", "segment_number": 0, "speaker": "seller", "transcript": "Hello..."}
{"type": "segment_complete", "segment_number": 1, "speaker": "client", "transcript": "Hi...", "emotions": {"enthusiasm": 6.5, "agreement": 7.2, "stress": 3.1}}
...
{"type": "analysis_complete", "call_id": "call_abc456", "summary": {...}}
```

---

### Step 6: Retrieve Full Results

**API**:
```bash
curl http://localhost:8000/api/v1/calls/call_abc456 \
  -H "X-User-ID: user_abc123"
```

**Expected Response**:
```json
{
  "id": "call_abc456",
  "user_id": "user_abc123",
  "filename": "test_call.wav",
  "duration": 180.5,
  "detected_language": "ru",
  "analyzed": true,
  "uploaded_at": "2025-01-05T11:00:00Z",
  "segments": [
    {
      "segment_number": 0,
      "start_time": 0.0,
      "end_time": 5.2,
      "speaker": "seller",
      "transcript": "Здравствуйте, меня зовут Алиса..."
    },
    {
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
  ],
  "alerts": [
    {
      "timestamp": 45.3,
      "alert_type": "high_stress",
      "message": "Клиент показывает признаки стресса",
      "recommendation": "Попробуйте снизить темп разговора"
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
  }
}
```

**Validation**:
- [ ] Language correctly detected (ru or en)
- [ ] Speakers identified correctly
- [ ] Transcriptions in correct language
- [ ] Emotion scores between 0-10
- [ ] Alerts generated appropriately
- [ ] Audio file stored at `data/audio/user_abc123/call_abc456.wav`

---

## Scenario 3: User Feedback & Continuous Learning

**Goal**: User corrects emotion scores, system collects training data

### Step 1: View Call Details

**UI**: Navigate to `/calls/call_abc456` → See emotion scores

---

### Step 2: Submit Corrections

**UI**: Click "Correct Ratings" → Adjust sliders

**API**:
```bash
curl -X POST http://localhost:8000/api/v1/calls/call_abc456/feedback \
  -H "Content-Type: application/json" \
  -H "X-User-ID: user_abc123" \
  -d '{
    "segment_id": 42,
    "corrected_enthusiasm": 8.0,
    "corrected_agreement": 7.5,
    "corrected_stress": 2.5
  }'
```

**Expected Response**:
```json
{
  "feedback_id": "feedback_123",
  "segment_id": 42,
  "accepted": true,
  "total_feedback_count": 15
}
```

**Validation**:
- [ ] Feedback stored in `emotion_feedback` table
- [ ] Original scores preserved
- [ ] Corrected scores validated (0-10 range)

---

### Step 3: Check Training Readiness

**API**:
```bash
curl http://localhost:8000/api/v1/analysis/training-status \
  -H "X-User-ID: user_abc123"
```

**Expected Response**:
```json
{
  "feedback_samples": {
    "enthusiasm": 18,
    "agreement": 22,
    "stress": 15
  },
  "training_threshold": 50,
  "models_trained": false,
  "next_training_date": "2025-01-12T00:00:00Z"
}
```

**After 50+ samples**:
```json
{
  "feedback_samples": {
    "enthusiasm": 55,
    "agreement": 62,
    "stress": 51
  },
  "training_threshold": 50,
  "models_trained": true,
  "last_training_date": "2025-01-10T00:00:00Z",
  "model_accuracy": {
    "enthusiasm": 0.87,
    "agreement": 0.89,
    "stress": 0.84
  }
}
```

---

## Scenario 4: Long Call Handling

**Goal**: Process 45-minute call efficiently via streaming

### Setup

**Generate Test Audio**:
```bash
# Create 45-minute test audio (45MB file)
ffmpeg -f lavfi -i "sine=frequency=1000:duration=2700" -ar 16000 -ac 1 long_call.wav
```

---

### Test Steps

1. **Initialize upload** → Get `upload_id`
2. **Upload 45 chunks** (1MB each) → Monitor progress
3. **Complete upload** → Analysis starts immediately
4. **WebSocket stream** → First results within 10 seconds
5. **Wait for completion** → Should finish in ~2 minutes (1:1 ratio)

---

### Performance Metrics

**Expected**:
- Upload time: <90 seconds (45MB at ~500KB/s)
- First result: <10 seconds after upload starts
- Processing: ~45 minutes of audio in ~2 minutes
- Memory usage: <500MB during processing
- CPU usage: <200% (2 cores)

**Measure**:
```bash
# Monitor resources
htop  # Watch CPU and memory

# Time the process
time curl -X POST .../complete
```

**Validation**:
- [ ] Streaming upload works without memory spike
- [ ] Incremental results arrive via WebSocket
- [ ] Final analysis completes in <2 minutes
- [ ] All segments processed correctly
- [ ] No memory leaks (mem returns to baseline)

---

## Scenario 5: Multi-User Concurrent Uploads

**Goal**: Test system with 5 concurrent users

### Setup

**Create 5 test users**:
```bash
for i in {1..5}; do
  curl -X POST http://localhost:8000/api/v1/users/register \
    -H "Content-Type: application/json" \
    -d "{\"name\": \"User $i\", \"email\": \"user$i@test.com\"}"
done
```

---

### Test Script

```bash
#!/bin/bash
# concurrent_test.sh

for i in {1..5}; do
  (
    USER_ID="user_$i"
    echo "[$USER_ID] Starting upload..."
    
    # Upload small test file
    UPLOAD_ID=$(curl -s -X POST http://localhost:8000/api/v1/analysis/upload \
      -H "X-User-ID: $USER_ID" \
      -d '{"filename": "test.wav", "total_size_bytes": 1048576}' \
      | jq -r '.upload_id')
    
    # Upload single chunk
    curl -s -X POST http://localhost:8000/api/v1/analysis/upload/$UPLOAD_ID/chunk \
      -H "X-User-ID: $USER_ID" \
      -d "{\"chunk_number\": 0, \"chunk_data\": \"...\", \"is_last\": true}" > /dev/null
    
    # Complete
    curl -s -X POST http://localhost:8000/api/v1/analysis/upload/$UPLOAD_ID/complete \
      -H "X-User-ID: $USER_ID"
    
    echo "[$USER_ID] Complete!"
  ) &
done

wait
echo "All uploads complete"
```

**Run**:
```bash
chmod +x concurrent_test.sh
./concurrent_test.sh
```

**Validation**:
- [ ] All 5 uploads succeed
- [ ] No database lock errors
- [ ] Processing times reasonable (<3x single-user)
- [ ] Memory usage scales linearly (<2.5GB for 5 users)

---

## Scenario 6: Settings Management

**Goal**: Test user-configurable retention period

### Step 1: Check Current Settings

**API**:
```bash
curl http://localhost:8000/api/v1/users/user_abc123 \
  -H "X-User-ID: user_abc123"
```

**Response**:
```json
{
  "id": "user_abc123",
  "audio_retention_days": 7,
  ...
}
```

---

### Step 2: Update Retention Period

**UI**: Navigate to `/settings` → Adjust "Audio Retention"

**API**:
```bash
curl -X PUT http://localhost:8000/api/v1/users/user_abc123/settings \
  -H "Content-Type: application/json" \
  -H "X-User-ID: user_abc123" \
  -d '{"audio_retention_days": 30}'
```

**Response**:
```json
{
  "user_id": "user_abc123",
  "audio_retention_days": 30,
  "updated_at": "2025-01-05T12:00:00Z"
}
```

---

### Step 3: Verify Auto-Delete Schedule

**Upload new call** → Check `auto_delete_at`:

```sql
SELECT id, filename, uploaded_at, auto_delete_at 
FROM calls 
WHERE user_id = 'user_abc123' 
ORDER BY uploaded_at DESC 
LIMIT 1;
```

**Expected**: `auto_delete_at` = `uploaded_at` + 30 days

**Validation**:
- [ ] New retention period saved
- [ ] Future uploads use new period
- [ ] Existing calls retain original schedule

---

## Scenario 7: Background Cleanup

**Goal**: Test automatic audio deletion

### Setup

**Create expired call**:
```sql
INSERT INTO calls (id, user_id, filename, audio_path, uploaded_at, auto_delete_at, audio_deleted)
VALUES ('expired_call', 'user_abc123', 'old.wav', 'data/audio/user_abc123/old.wav', 
        datetime('now', '-10 days'), datetime('now', '-3 days'), 0);
```

**Create audio file**:
```bash
touch data/audio/user_abc123/old.wav
```

---

### Run Cleanup

**Manual trigger**:
```bash
curl -X POST http://localhost:8000/api/v1/admin/cleanup \
  -H "X-Admin-Token: secret"
```

**Or via cron** (production):
```bash
# Daily at 2 AM
0 2 * * * curl -X POST http://localhost:8000/api/v1/admin/cleanup
```

---

### Verify Results

**Check database**:
```sql
SELECT audio_deleted FROM calls WHERE id = 'expired_call';
-- Expected: 1
```

**Check filesystem**:
```bash
ls data/audio/user_abc123/old.wav
# Expected: file not found
```

**Validation**:
- [ ] Audio file deleted from disk
- [ ] Database record preserved with `audio_deleted = 1`
- [ ] Can still view call details and transcript
- [ ] Other (non-expired) files untouched

---

## Troubleshooting

### Issue: Models not loading

**Check**:
```bash
ls models/vosk/
# Should see: vosk-model-small-ru-0.22/, vosk-model-small-en-us-0.15/
```

**Fix**:
```bash
cd backend
python scripts/download_models.py
```

---

### Issue: Audio upload fails

**Check file size**:
```bash
ls -lh test_call.wav
# Max: 100MB
```

**Check format**:
```bash
ffmpeg -i test_call.wav
# Must be: 16kHz, mono, PCM or MP3
```

---

### Issue: No emotion scores

**Likely**: Speaker identified as "seller" (only clients get emotions)

**Check**:
```sql
SELECT speaker, transcript FROM segments WHERE call_id = 'call_abc456';
```

**Debug GMM**:
```python
# Test speaker identification
from app.ml.speaker_id import identify_speaker
result = identify_speaker(audio_segment, user_model)
print(f"Speaker: {result}, Log-likelihood: {user_model['gmm'].score(mfcc)}")
```

---

## Success Criteria

**All scenarios passing** = Ready for production

- [x] User onboarding complete
- [x] Voice training calibrates threshold
- [x] Simple call analysis works end-to-end
- [x] Feedback collection stores data
- [x] Long calls process efficiently
- [x] Concurrent uploads handle 5+ users
- [x] Settings update and apply correctly
- [x] Background cleanup deletes expired audio

---

**Quickstart Status**: ✅ Ready for testing  
**Last Updated**: 2025-01-05
