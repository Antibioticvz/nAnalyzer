"""
Application configuration using Pydantic settings
"""
from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    """Application settings"""
    
    # Application
    APP_ENV: str = "development"
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"
    
    # Model Settings
    STT_MODEL: str = "whisper-base"
    SENTIMENT_MODEL: str = "distilbert-base-uncased-finetuned-sst-2-english"
    MAX_MODEL_MEMORY_MB: int = 2048
    MODEL_CACHE_DIR: str = "./models"
    
    # Performance Settings
    AUDIO_CHUNK_SIZE_MS: int = 200
    TRANSCRIPTION_BUFFER_SIZE: int = 5
    MAX_CONCURRENT_CALLS: int = 10
    
    # Privacy Settings
    AUTO_DELETE_AUDIO_DAYS: int = 7
    ENABLE_PII_REDACTION: bool = True
    REDACTION_PATTERNS: str = "phone,ssn,credit_card"
    
    # Storage Settings
    DATABASE_URL: str = "sqlite:///./data/nanalyzer.db"
    AUDIO_STORAGE_PATH: str = "./data/audio"
    BACKUP_ENABLED: bool = False
    
    # API Settings
    FRONTEND_URL: str = "http://localhost:3000"
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:3001"]
    WEBSOCKET_PING_INTERVAL: int = 30
    API_RATE_LIMIT: int = 100  # requests per minute
    
    # Security
    JWT_SECRET_KEY: str = "change-this-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()
