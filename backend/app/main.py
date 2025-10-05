"""
FastAPI application entry point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.core.config import settings
from app.api import router as api_router

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    logger.info("Starting nAnalyzer backend...")
    logger.info(f"Debug mode: {settings.DEBUG}")
    
    # Initialize ML models (async loading)
    # Commented out for now - will be implemented when ML modules are ready
    # try:
    #     from app.modules.transcription import transcription_engine
    #     from app.modules.analysis import analysis_engine
    #     
    #     await transcription_engine.initialize()
    #     await analysis_engine.initialize()
    #     logger.info("ML models loaded successfully")
    # except Exception as e:
    #     logger.error(f"Failed to load ML models: {e}")
    #     raise
    
    yield
    
    # Cleanup
    logger.info("Shutting down nAnalyzer backend...")


app = FastAPI(
    title="nAnalyzer API",
    description="Privacy-focused real-time sales call analysis",
    version="0.1.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix="/api/v1")


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "service": "nAnalyzer",
        "version": "0.1.0",
        "status": "healthy"
    }


@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "components": {
            "api": "up",
            "transcription": "up",
            "analysis": "up",
            "storage": "up"
        }
    }
