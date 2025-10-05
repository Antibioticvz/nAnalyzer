# Data Model

## Overview

The nAnalyzer data model supports local, privacy-first sales call analysis with user voice training, streaming audio processing, emotion analysis, and continuous learning from user feedback.

## Entity Relationship Diagram

```
┌──────────┐
│   User   │
└─────┬────┘
      │ 1:N
      │
┌─────┴────────────┐
│      Call        │
└─────┬────────────┘
      │ 1:N
      ├───────────┐
      │           │
┌─────▼────┐  ┌──▼───────┐
│ Segment  │  │  Alert   │
└─────┬────┘  └──────────┘
      │ 1:N
      │
┌─────▼─────────────┐
│ EmotionFeedback   │
└───────────────────┘
```

---

## Tables

### users

Stores user registration, voice model metadata, and preferences.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID v4 |
| name | TEXT | NOT NULL | Full name |
| email | TEXT | UNIQUE, NOT NULL | Email address |
| role | TEXT | DEFAULT 'seller' | User role (seller, admin) |
| voice_trained | BOOLEAN | DEFAULT 0 | GMM training completed |
| model_path | TEXT | NULL | Path to pickled GMM model |
| gmm_threshold | REAL | NULL | Calibrated speaker ID threshold |
| audio_retention_days | INTEGER | DEFAULT 7 | Days to keep audio (1-90) |
| created_at | TIMESTAMP | DEFAULT NOW() | Registration timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes**:
- PRIMARY KEY(id)
- UNIQUE(email)

**Sample Data**:
```sql
INSERT INTO users (id, name, email, audio_retention_days, gmm_threshold) 
VALUES ('user_123', 'John Smith', 'john@company.com', 14, -12.5);
```

---

### calls

Stores uploaded call metadata, processing status, and deletion schedule.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID v4 |
| user_id | TEXT | FOREIGN KEY | Owner user |
| filename | TEXT | NOT NULL | Original filename |
| audio_path | TEXT | NULL | Path to audio file on disk |
| duration | REAL | NULL | Call duration in seconds |
| detected_language | TEXT | NULL | 'ru' or 'en' from auto-detection |
| uploaded_at | TIMESTAMP | DEFAULT NOW() | Upload start time |
| analyzed | BOOLEAN | DEFAULT 0 | Analysis completed flag |
| audio_deleted | BOOLEAN | DEFAULT 0 | Audio file deleted flag |
| auto_delete_at | TIMESTAMP | NULL | Scheduled deletion time |
| metadata | JSON | NULL | Custom metadata (client name, etc.) |

**Indexes**:
- PRIMARY KEY(id)
- FOREIGN KEY(user_id) REFERENCES users(id)
- INDEX(user_id, uploaded_at DESC)
- INDEX(auto_delete_at) WHERE audio_deleted = 0

**Sample Data**:
```sql
INSERT INTO calls (id, user_id, filename, duration, detected_language, auto_delete_at) 
VALUES ('call_456', 'user_123', 'sales_call_2025_01.wav', 180.5, 'ru', '2025-01-12 10:00:00');
```

---

### segments

Stores per-segment transcription, speaker identification, and emotion scores.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTO | Auto-increment ID |
| call_id | TEXT | FOREIGN KEY, NOT NULL | Parent call |
| segment_number | INTEGER | NOT NULL | Sequential number (0, 1, 2...) |
| start_time | REAL | NOT NULL | Start time in seconds |
| end_time | REAL | NOT NULL | End time in seconds |
| speaker | TEXT | NOT NULL | 'seller' or 'client' |
| transcript | TEXT | NULL | Vosk transcription text |
| enthusiasm | REAL | NULL | Emotion score 0-10 |
| agreement | REAL | NULL | Emotion score 0-10 |
| stress | REAL | NULL | Emotion score 0-10 |

**Indexes**:
- PRIMARY KEY(id)
- FOREIGN KEY(call_id) REFERENCES calls(id) ON DELETE CASCADE
- INDEX(call_id, segment_number)

**Sample Data**:
```sql
INSERT INTO segments (call_id, segment_number, start_time, end_time, speaker, transcript, enthusiasm, agreement, stress)
VALUES ('call_456', 0, 0.0, 5.2, 'seller', 'Здравствуйте, меня зовут Иван.', NULL, NULL, NULL);

INSERT INTO segments (call_id, segment_number, start_time, end_time, speaker, transcript, enthusiasm, agreement, stress)
VALUES ('call_456', 1, 5.2, 8.7, 'client', 'Да, слушаю вас.', 6.5, 7.2, 3.1);
```

---

### alerts

Stores generated recommendations and insights with timestamps.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTO | Auto-increment ID |
| call_id | TEXT | FOREIGN KEY, NOT NULL | Parent call |
| timestamp | REAL | NOT NULL | Time in seconds |
| alert_type | TEXT | NOT NULL | Type (high_stress, low_enthusiasm, etc.) |
| message | TEXT | NOT NULL | Alert message |
| recommendation | TEXT | NULL | Actionable recommendation |

**Indexes**:
- PRIMARY KEY(id)
- FOREIGN KEY(call_id) REFERENCES calls(id) ON DELETE CASCADE
- INDEX(call_id, timestamp)

**Alert Types**:
- `high_stress`: Client showing stress (>7.0)
- `low_enthusiasm`: Client enthusiasm dropping (<4.0)
- `high_enthusiasm`: Great engagement (>8.0)
- `low_agreement`: Client expressing doubts (<4.0)
- `high_agreement`: Ready to proceed (>8.0)
- `enthusiasm_dropping`: Losing interest (trend)

**Sample Data**:
```sql
INSERT INTO alerts (call_id, timestamp, alert_type, message, recommendation)
VALUES ('call_456', 45.3, 'high_stress', 'Клиент показывает признаки стресса', 'Попробуйте снизить темп разговора');
```

---

### emotion_feedback

Stores user corrections for continuous learning of emotion models.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTO | Auto-increment ID |
| segment_id | INTEGER | FOREIGN KEY, NOT NULL | Corrected segment |
| user_id | TEXT | FOREIGN KEY, NOT NULL | User who corrected |
| original_enthusiasm | REAL | NULL | System's original score |
| corrected_enthusiasm | REAL | NULL | User's correction |
| original_agreement | REAL | NULL | System's original score |
| corrected_agreement | REAL | NULL | User's correction |
| original_stress | REAL | NULL | System's original score |
| corrected_stress | REAL | NULL | User's correction |
| feedback_at | TIMESTAMP | DEFAULT NOW() | Feedback timestamp |
| used_for_training | BOOLEAN | DEFAULT 0 | Included in model retraining |

**Indexes**:
- PRIMARY KEY(id)
- FOREIGN KEY(segment_id) REFERENCES segments(id) ON DELETE CASCADE
- FOREIGN KEY(user_id) REFERENCES users(id)
- INDEX(used_for_training) WHERE used_for_training = 0

**Sample Data**:
```sql
INSERT INTO emotion_feedback (segment_id, user_id, original_enthusiasm, corrected_enthusiasm)
VALUES (42, 'user_123', 6.5, 8.0);
```

---

## Relationships

### User → Calls (1:N)
- One user can have many calls
- Cascade: When user deleted, calls retained (soft delete user only)

### Call → Segments (1:N)
- One call has many segments
- Cascade: When call deleted, segments deleted

### Call → Alerts (1:N)
- One call has many alerts
- Cascade: When call deleted, alerts deleted

### Segment → EmotionFeedback (1:N)
- One segment can have multiple corrections over time
- Cascade: When segment deleted, feedback deleted

---

## Filesystem Storage

### Audio Files

```
data/
└── audio/
    └── {user_id}/
        └── {call_id}.wav
```

**Management**:
- Store in user-specific subdirectories
- Calculate `auto_delete_at` on upload: `uploaded_at + audio_retention_days`
- Daily cron job deletes files where `auto_delete_at < NOW()`
- Set `audio_deleted = 1` after deletion
- Keep database record for history

---

### Model Files

```
models/
├── voice/
│   └── {user_id}.pkl
├── emotion/
│   ├── enthusiasm_rf.pkl
│   ├── agreement_rf.pkl
│   └── stress_rf.pkl
└── vosk/
    ├── vosk-model-small-ru-0.22/
    └── vosk-model-small-en-us-0.15/
```

**Voice Models** (`models/voice/{user_id}.pkl`):
```python
{
    'gmm': GaussianMixture,  # Trained model
    'threshold': float,       # Calibrated threshold
    'n_samples': int,         # Training sample count
    'trained_at': datetime
}
```

**Emotion Models** (`models/emotion/{type}_rf.pkl`):
- Initially: Rule-based functions (no file)
- After 50+ feedback samples: Pickled RandomForest classifier

---

## Migrations

### Initial Schema (Migration 001)

```sql
-- Create tables in dependency order
CREATE TABLE users (...);
CREATE TABLE calls (...);
CREATE TABLE segments (...);
CREATE TABLE alerts (...);
CREATE TABLE emotion_feedback (...);

-- Create indexes
CREATE INDEX idx_calls_user_uploaded ON calls(user_id, uploaded_at DESC);
CREATE INDEX idx_calls_auto_delete ON calls(auto_delete_at) WHERE audio_deleted = 0;
CREATE INDEX idx_segments_call ON segments(call_id, segment_number);
CREATE INDEX idx_alerts_call ON alerts(call_id, timestamp);
CREATE INDEX idx_feedback_unused ON emotion_feedback(used_for_training) WHERE used_for_training = 0;
```

### Future Migrations

**002_add_user_preferences.sql**: Additional user settings (language preference, theme)
**003_add_call_analytics.sql**: Aggregate stats table for performance
**004_add_team_support.sql**: Team/organization tables for multi-user

---

## Constraints & Validation

### Application-Level Constraints

- **audio_retention_days**: Must be between 1 and 90
- **emotion scores**: Must be between 0.0 and 10.0 (inclusive)
- **detected_language**: Must be 'ru' or 'en' or NULL
- **speaker**: Must be 'seller' or 'client'
- **alert_type**: Must be one of predefined types

### Database-Level Constraints

```sql
-- Add CHECK constraints
ALTER TABLE users ADD CONSTRAINT chk_retention 
  CHECK (audio_retention_days >= 1 AND audio_retention_days <= 90);

ALTER TABLE segments ADD CONSTRAINT chk_enthusiasm 
  CHECK (enthusiasm IS NULL OR (enthusiasm >= 0 AND enthusiasm <= 10));

ALTER TABLE segments ADD CONSTRAINT chk_agreement 
  CHECK (agreement IS NULL OR (agreement >= 0 AND agreement <= 10));

ALTER TABLE segments ADD CONSTRAINT chk_stress 
  CHECK (stress IS NULL OR (stress >= 0 AND stress <= 10));
```

---

## Query Patterns

### Common Queries

**Get user's recent calls**:
```sql
SELECT * FROM calls 
WHERE user_id = ? 
ORDER BY uploaded_at DESC 
LIMIT 50;
```

**Get call with all segments**:
```sql
SELECT c.*, s.* 
FROM calls c
JOIN segments s ON s.call_id = c.id
WHERE c.id = ?
ORDER BY s.segment_number;
```

**Get calls pending audio deletion**:
```sql
SELECT * FROM calls
WHERE audio_deleted = 0
  AND auto_delete_at < datetime('now');
```

**Get feedback for model retraining**:
```sql
SELECT ef.*, s.* 
FROM emotion_feedback ef
JOIN segments s ON s.id = ef.segment_id
WHERE ef.used_for_training = 0
LIMIT 100;
```

**Count feedback samples by emotion**:
```sql
SELECT 
  COUNT(CASE WHEN corrected_enthusiasm IS NOT NULL THEN 1 END) as enthusiasm_count,
  COUNT(CASE WHEN corrected_agreement IS NOT NULL THEN 1 END) as agreement_count,
  COUNT(CASE WHEN corrected_stress IS NOT NULL THEN 1 END) as stress_count
FROM emotion_feedback
WHERE used_for_training = 0;
```

---

## Performance Considerations

### Indexes

- All foreign keys indexed
- Composite index on `(user_id, uploaded_at)` for call listing
- Partial index on `auto_delete_at` for cleanup jobs
- Partial index on `used_for_training = 0` for model training queries

### Scaling

**Current Scope** (5-10 users):
- SQLite handles 50K+ segments easily
- File storage: 1GB per user (assuming 7-day retention, 30min calls daily)

**Future Scaling** (100+ users):
- Migrate to PostgreSQL for better concurrency
- Separate audio storage (S3-compatible)
- Partitioning by user_id or date

---

## Data Privacy & Security

### PII Handling

- **Stored**: Name, email (required for user management)
- **Not stored**: Phone numbers, addresses, payment info
- **Transcripts**: May contain PII - implement redaction in future

### Encryption

- Database: SQLite encryption extension (optional)
- Audio files: Filesystem-level encryption (OS-dependent)
- Backups: Always encrypted before export

### Retention

- Audio: User-configurable (1-90 days)
- Transcripts: Indefinite (disk space permitting)
- Feedback: Indefinite (required for learning)
- Deleted users: Anonymize data (set name/email to NULL), keep analysis history

---

## Testing Data

### Seed Data for Development

```sql
-- Test user
INSERT INTO users (id, name, email, voice_trained, gmm_threshold) 
VALUES ('test_user', 'Test Seller', 'test@example.com', 1, -12.0);

-- Test call
INSERT INTO calls (id, user_id, filename, duration, detected_language, analyzed)
VALUES ('test_call', 'test_user', 'test.wav', 120.0, 'en', 1);

-- Test segments
INSERT INTO segments VALUES 
(1, 'test_call', 0, 0.0, 5.0, 'seller', 'Hello, how are you today?', NULL, NULL, NULL),
(2, 'test_call', 1, 5.0, 10.0, 'client', 'I am good, thanks!', 7.5, 8.0, 2.5);

-- Test alert
INSERT INTO alerts (call_id, timestamp, alert_type, message, recommendation)
VALUES ('test_call', 10.0, 'high_enthusiasm', 'Client is very engaged', 'Good time to discuss pricing');
```

---

**Data Model Version**: 1.0  
**Last Updated**: 2025-01-05  
**Status**: ✅ Ready for implementation
