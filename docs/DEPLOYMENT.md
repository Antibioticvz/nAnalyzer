# Deployment Guide

This guide covers different deployment scenarios for nAnalyzer.

## Quick Start (Single User)

The simplest way to run nAnalyzer locally:

```bash
# Clone and setup
git clone https://github.com/yourusername/nAnalyzer.git
cd nAnalyzer

# Using Docker Compose (recommended)
docker-compose up -d

# Or run manually
cd backend && python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python scripts/download_models.py
uvicorn app.main:app --reload &

cd ../frontend && npm install && npm start
```

Access at: http://localhost:3000

## Docker Deployment

### Single Container (Development)

```bash
docker-compose up
```

### Production with Docker

```bash
# Build images
docker-compose -f docker-compose.prod.yml build

# Run with production settings
docker-compose -f docker-compose.prod.yml up -d
```

Create `docker-compose.prod.yml`:
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    volumes:
      - ./models:/app/models:ro
      - ./data:/app/data
    environment:
      - APP_ENV=production
      - DEBUG=false
    restart: unless-stopped

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend
    restart: unless-stopped
```

## Manual Deployment

### Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Download models
python scripts/download_models.py

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Run with production server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Build for production
npm run build

# Serve with a static server
npx serve -s build -l 3000
```

## Multi-User Deployment

For teams, use PostgreSQL instead of SQLite:

### 1. Setup PostgreSQL

```bash
# Using Docker
docker run -d \
  --name nanalyzer-db \
  -e POSTGRES_DB=nanalyzer \
  -e POSTGRES_USER=nanalyzer \
  -e POSTGRES_PASSWORD=secure_password \
  -p 5432:5432 \
  postgres:15
```

### 2. Update Backend Configuration

```env
DATABASE_URL=postgresql://nanalyzer:secure_password@localhost:5432/nanalyzer
```

### 3. Run Database Migrations

```bash
cd backend
alembic upgrade head
```

## Kubernetes Deployment

For enterprise/scale deployments:

```yaml
# nanalyzer-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nanalyzer-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nanalyzer-backend
  template:
    metadata:
      labels:
        app: nanalyzer-backend
    spec:
      containers:
      - name: backend
        image: nanalyzer/backend:latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: nanalyzer-secrets
              key: database-url
        volumeMounts:
        - name: models
          mountPath: /app/models
          readOnly: true
        - name: data
          mountPath: /app/data
      volumes:
      - name: models
        persistentVolumeClaim:
          claimName: nanalyzer-models-pvc
      - name: data
        persistentVolumeClaim:
          claimName: nanalyzer-data-pvc
```

Apply:
```bash
kubectl apply -f nanalyzer-deployment.yaml
kubectl apply -f nanalyzer-service.yaml
```

## System Requirements

### Minimum (Single User)

- CPU: 4 cores
- RAM: 8 GB
- Storage: 10 GB (models + data)
- OS: Linux, macOS, Windows

### Recommended (Multi-User)

- CPU: 8+ cores
- RAM: 16 GB
- Storage: 50 GB SSD
- OS: Linux (Ubuntu 20.04+)

### For GPU Acceleration (Optional)

- NVIDIA GPU with 4+ GB VRAM
- CUDA 11.8+
- cuDNN 8.6+

Enable GPU in Docker:
```bash
docker-compose up --gpus all
```

## Performance Tuning

### Backend Optimization

```env
# Adjust worker count based on CPU cores
# Formula: (2 x CPU cores) + 1
WORKERS=9

# Model optimization
MAX_MODEL_MEMORY_MB=4096
TRANSCRIPTION_BUFFER_SIZE=10

# Concurrency
MAX_CONCURRENT_CALLS=20
```

### Frontend Optimization

```bash
# Enable production build optimizations
npm run build -- --production

# Enable gzip compression in nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript;
```

## Monitoring

### Health Checks

```bash
# Backend health
curl http://localhost:8000/health

# Check models loaded
curl http://localhost:8000/api/v1/config/models
```

### Logs

```bash
# Docker logs
docker-compose logs -f backend

# Application logs
tail -f backend/logs/nanalyzer.log
```

### Metrics

Add Prometheus metrics (optional):
```bash
pip install prometheus-fastapi-instrumentator
```

## Backup & Restore

### Backup Data

```bash
# Backup database
sqlite3 data/nanalyzer.db ".backup backup-$(date +%Y%m%d).db"

# Or for PostgreSQL
pg_dump nanalyzer > backup-$(date +%Y%m%d).sql

# Backup audio files
tar -czf audio-backup-$(date +%Y%m%d).tar.gz data/audio/
```

### Restore Data

```bash
# Restore SQLite
cp backup-20250105.db data/nanalyzer.db

# Restore PostgreSQL
psql nanalyzer < backup-20250105.sql

# Restore audio
tar -xzf audio-backup-20250105.tar.gz -C data/
```

## Security Hardening

### 1. Use HTTPS

```bash
# Generate SSL certificate
certbot certonly --standalone -d nanalyzer.yourdomain.com
```

### 2. Configure Firewall

```bash
# Allow only necessary ports
ufw allow 443/tcp  # HTTPS
ufw allow 8000/tcp # Backend API (if not behind nginx)
ufw enable
```

### 3. Enable Authentication

```env
# In backend/.env
JWT_SECRET_KEY=your-very-long-random-secret-key-here
```

### 4. Regular Updates

```bash
# Update dependencies
pip install -U -r requirements.txt
npm update

# Update base images
docker-compose pull
```

## Troubleshooting

### Model Loading Issues

```bash
# Re-download models
cd backend
python scripts/download_models.py

# Check model files
ls -lh models/
```

### Database Connection Issues

```bash
# Check database
sqlite3 data/nanalyzer.db ".tables"

# Reset database (WARNING: deletes all data)
rm data/nanalyzer.db
alembic upgrade head
```

### Port Conflicts

```bash
# Check port usage
lsof -i :8000
lsof -i :3000

# Use different ports
uvicorn app.main:app --port 8080
```

## Support

For deployment help:
- Documentation: https://docs.nanalyzer.dev
- Issues: https://github.com/yourusername/nAnalyzer/issues
- Discord: https://discord.gg/nanalyzer
- Email: support@nanalyzer.dev
