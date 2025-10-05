"""
Application configuration using Pydantic Settings
"""
from pydantic_settings import BaseSettings
from pydantic import Field
from typing import Optional


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "nAnalyzer"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # Database
    DATABASE_URL: str = Field(
        default="sqlite+aiosqlite:///./data/nanalyzer.db",
        env="DATABASE_URL"
    )
    
    # File Storage
    UPLOAD_DIR: str = "./data/uploads"
    AUDIO_DIR: str = "./data/audio"
    MODELS_DIR: str = "./models"
    
    # ML Models
    VOSK_MODEL_RU: str = "./models/vosk/vosk-model-small-ru-0.22"
    VOSK_MODEL_EN: str = "./models/vosk/vosk-model-small-en-us-0.15"
    
    # Audio Processing
    SAMPLE_RATE: int = 16000
    CHUNK_SIZE_MB: int = 1
    MAX_AUDIO_SIZE_MB: int = 100
    
    # Performance
    MAX_CONCURRENT_UPLOADS: int = 5
    PROCESSING_TIMEOUT_SECONDS: int = 600
    
    # Cleanup
    DEFAULT_RETENTION_DAYS: int = 7
    CLEANUP_SCHEDULE_HOUR: int = 2
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FILE: Optional[str] = "./logs/app.log"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
