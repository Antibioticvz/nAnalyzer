"""
Vosk transcription wrapper
Per spec: Dual-language support (Russian + English) with Vosk
"""
import json
from vosk import Model, KaldiRecognizer
from typing import Dict, Any
from pathlib import Path
from app.core.config import settings


# Cache loaded models to avoid reloading
_models_cache: Dict[str, Model] = {}


def load_vosk_model(language: str) -> Model:
    """
    Load Vosk model for specified language
    
    Args:
        language: 'ru' or 'en'
    
    Returns:
        Loaded Vosk Model
    
    Raises:
        ValueError: If invalid language
        FileNotFoundError: If model not found
    """
    if language not in ['ru', 'en']:
        raise ValueError(f"Invalid language: {language}. Must be 'ru' or 'en'")
    
    # Check cache
    if language in _models_cache:
        return _models_cache[language]
    
    # Get model path
    if language == 'ru':
        model_path = settings.VOSK_MODEL_RU
    else:
        model_path = settings.VOSK_MODEL_EN
    
    # Check if model exists
    if not Path(model_path).exists():
        raise FileNotFoundError(
            f"Vosk model not found at {model_path}. "
            f"Run: python scripts/download_models.py"
        )
    
    # Load model
    model = Model(model_path)
    
    # Cache it
    _models_cache[language] = model
    
    return model


class VoskTranscriber:
    """Vosk-based speech-to-text transcriber"""
    
    def __init__(self, language: str):
        """
        Initialize transcriber
        
        Args:
            language: 'ru' or 'en'
        """
        self.language = language
        self.model = load_vosk_model(language)
    
    def transcribe(self, audio_bytes: bytes, sample_rate: int = 16000) -> Dict[str, Any]:
        """
        Transcribe audio to text
        
        Args:
            audio_bytes: Raw audio bytes
            sample_rate: Audio sample rate (16kHz default)
        
        Returns:
            Dictionary with 'text' and 'confidence'
        """
        # Create recognizer
        recognizer = KaldiRecognizer(self.model, sample_rate)
        recognizer.SetWords(True)
        
        # Process audio
        recognizer.AcceptWaveform(audio_bytes)
        
        # Get result
        result = json.loads(recognizer.FinalResult())
        
        return {
            'text': result.get('text', ''),
            'confidence': result.get('confidence', 0.0) if 'confidence' in result else 0.5
        }


def transcribe_audio(
    audio_bytes: bytes,
    language: str,
    sample_rate: int = 16000
) -> Dict[str, Any]:
    """
    Convenience function for one-off transcription
    
    Args:
        audio_bytes: Raw audio bytes
        language: 'ru' or 'en'
        sample_rate: Audio sample rate
    
    Returns:
        Dictionary with 'text' and 'confidence'
    """
    transcriber = VoskTranscriber(language)
    return transcriber.transcribe(audio_bytes, sample_rate)
