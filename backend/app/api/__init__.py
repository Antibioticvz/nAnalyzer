"""
API router configuration
"""
from fastapi import APIRouter
from app.api import calls, analysis, config, upload

router = APIRouter()

# Include sub-routers
router.include_router(calls.router, prefix="/calls", tags=["calls"])
router.include_router(analysis.router, prefix="/analysis", tags=["analysis"])
router.include_router(config.router, prefix="/config", tags=["config"])
router.include_router(upload.router, prefix="/upload", tags=["upload"])
