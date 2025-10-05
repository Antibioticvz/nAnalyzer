#!/bin/bash
# Quickstart script for nAnalyzer
# One-command setup for development environment

set -e  # Exit on error

echo "🚀 nAnalyzer Quick Start Script"
echo "================================"
echo

# Check Python version
echo "Checking Python version..."
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.9 or higher."
    exit 1
fi

PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
REQUIRED_VERSION="3.9"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$PYTHON_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo "❌ Python $REQUIRED_VERSION or higher is required. Found: $PYTHON_VERSION"
    exit 1
fi

echo "✅ Python $PYTHON_VERSION found"
echo

# Check Node.js version
echo "Checking Node.js version..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16.x or higher."
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js 16 or higher is required. Found: v$NODE_VERSION"
    exit 1
fi

echo "✅ Node.js v$NODE_VERSION found"
echo

# Setup Backend
echo "📦 Setting up backend..."
cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip --quiet

# Install dependencies with precompiled wheels for problematic packages
echo "Installing backend dependencies..."
echo "  - Installing scipy and scikit-learn with precompiled wheels..."
pip install --only-binary :all: scipy scikit-learn --quiet

echo "  - Installing remaining dependencies..."
pip install fastapi uvicorn[standard] python-multipart websockets \
    pydantic pydantic-settings python-dotenv vosk soundfile \
    sqlalchemy aiosqlite alembic python-json-logger aiofiles httpx \
    pytest pytest-asyncio pytest-cov black mypy flake8 --quiet

pip install --only-binary :all: librosa --quiet

echo "✅ Backend dependencies installed"
echo

# Create necessary directories
echo "Creating data directories..."
mkdir -p data/uploads data/audio models/vosk logs

# Download Vosk models
echo "📥 Downloading Vosk models..."
if [ ! -d "models/vosk/vosk-model-small-ru-0.22" ] || [ ! -d "models/vosk/vosk-model-small-en-us-0.15" ]; then
    python scripts/download_models.py
    echo "✅ Vosk models downloaded"
else
    echo "✅ Vosk models already exist"
fi
echo

# Initialize database
echo "🗄️  Initializing database..."
if [ ! -f "data/nanalyzer.db" ]; then
    alembic upgrade head
    echo "✅ Database initialized"
else
    echo "✅ Database already exists"
fi
echo

cd ..

# Setup Frontend
echo "📦 Setting up frontend..."
cd frontend

if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install --legacy-peer-deps --quiet
    echo "✅ Frontend dependencies installed"
else
    echo "✅ Frontend dependencies already installed"
fi
echo

cd ..

# Create .env files if they don't exist
echo "⚙️  Setting up configuration..."
if [ ! -f "backend/.env" ]; then
    cp backend/.env.example backend/.env
    echo "✅ Created backend/.env from template"
else
    echo "✅ backend/.env already exists"
fi

if [ ! -f "frontend/.env" ]; then
    echo "REACT_APP_API_URL=http://localhost:8000" > frontend/.env
    echo "✅ Created frontend/.env"
else
    echo "✅ frontend/.env already exists"
fi
echo

# Success message
echo "✨ Setup complete!"
echo
echo "To start the application:"
echo
echo "1. Start the backend (in one terminal):"
echo "   cd backend"
echo "   source venv/bin/activate"
echo "   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
echo
echo "2. Start the frontend (in another terminal):"
echo "   cd frontend"
echo "   npm start"
echo
echo "3. Open your browser:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo
echo "📚 For more information, see README.md"
echo

# Ask if user wants to start servers
read -p "Would you like to start both servers now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Starting servers..."
    echo
    
    # Start backend in background
    cd backend
    source venv/bin/activate
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
    BACKEND_PID=$!
    cd ..
    
    # Wait a bit for backend to start
    sleep 3
    
    # Start frontend in background
    cd frontend
    npm start &
    FRONTEND_PID=$!
    cd ..
    
    echo
    echo "✅ Servers started!"
    echo "   Backend PID: $BACKEND_PID"
    echo "   Frontend PID: $FRONTEND_PID"
    echo
    echo "Press Ctrl+C to stop both servers"
    echo
    
    # Wait for Ctrl+C
    trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo; echo 'Servers stopped'; exit" INT
    wait
else
    echo "👍 You can start the servers manually using the commands above"
fi
