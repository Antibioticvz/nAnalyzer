"""
Language detection module
Per spec: Dual-model approach - try both, use higher confidence
"""
import numpy as np
from typing import Dict, Any, Optional
from app.ml.transcription import transcribe_audio


def detect_language_from_confidence(
    russian_result: Dict[str, Any],
    english_result: Dict[str, Any]
) -> str:
    """
    Determine language based on confidence scores
    
    Args:
        russian_result: Result from Russian Vosk model
        english_result: Result from English Vosk model
    
    Returns:
        'ru' or 'en' based on higher confidence
    """
    ru_confidence = russian_result.get('confidence', 0.0)
    en_confidence = english_result.get('confidence', 0.0)
    
    if ru_confidence > en_confidence:
        return 'ru'
    elif en_confidence > ru_confidence:
        return 'en'
    else:
        # Tie-breaker: check text length (longer usually means better recognition)
        ru_text_len = len(russian_result.get('text', ''))
        en_text_len = len(english_result.get('text', ''))
        
        return 'ru' if ru_text_len >= en_text_len else 'en'


def detect_language(
    audio_bytes: bytes,
    sample_rate: int = 16000,
    window_sec: Optional[float] = None
) -> str:
    """
    Detect language by trying both Vosk models
    
    Args:
        audio_bytes: Raw audio bytes
        sample_rate: Audio sample rate
        window_sec: Optional window size (use first N seconds)
    
    Returns:
        'ru' or 'en'
    """
    # If window specified, use only first N seconds
    if window_sec:
        bytes_per_sec = sample_rate * 2  # 16-bit audio = 2 bytes per sample
        max_bytes = int(window_sec * bytes_per_sec)
        audio_bytes = audio_bytes[:max_bytes]
    
    # Handle empty/very short audio
    if len(audio_bytes) < sample_rate * 2:  # Less than 1 second
        return 'ru'  # Default to Russian
    
    try:
        # Try Russian model
        russian_result = transcribe_audio(audio_bytes, language='ru', sample_rate=sample_rate)
    except Exception:
        russian_result = {'text': '', 'confidence': 0.0}
    
    try:
        # Try English model
        english_result = transcribe_audio(audio_bytes, language='en', sample_rate=sample_rate)
    except Exception:
        english_result = {'text': '', 'confidence': 0.0}
    
    # Determine language from confidence
    return detect_language_from_confidence(russian_result, english_result)
