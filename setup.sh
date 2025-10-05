#!/bin/bash

# nAnalyzer Setup Script
# Quick setup for development environment

set -e

echo "🎙️  nAnalyzer Setup"
echo "=================="
echo ""

# Check prerequisites
echo "Checking prerequisites..."

if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Please install Python 3.9 or higher."
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 16 or higher."
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo "⚠️  Docker not found. Docker is recommended but optional."
fi

echo "✅ Prerequisites OK"
echo ""

# Backend setup
echo "Setting up backend..."
cd backend

if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

echo "Activating virtual environment..."
source venv/bin/activate

echo "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo "Creating environment file..."
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "✅ Created .env file (please review and update settings)"
fi

echo "Creating data directories..."
mkdir -p ../data/audio
mkdir -p ../models

echo "✅ Backend setup complete"
echo ""

# Frontend setup
echo "Setting up frontend..."
cd ../frontend

echo "Installing Node.js dependencies..."
npm install

echo "✅ Frontend setup complete"
echo ""

# Final instructions
cd ..
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Review backend/.env and update settings if needed"
echo "2. Download ML models (optional for testing):"
echo "   cd backend && python scripts/download_models.py"
echo ""
echo "To start the application:"
echo ""
echo "Option 1 - Docker (recommended):"
echo "  docker-compose up"
echo ""
echo "Option 2 - Manual:"
echo "  Terminal 1: cd backend && source venv/bin/activate && uvicorn app.main:app --reload"
echo "  Terminal 2: cd frontend && npm start"
echo ""
echo "Access the dashboard at: http://localhost:3000"
echo "API documentation at: http://localhost:8000/docs"
echo ""
echo "📚 See README.md for more information"
