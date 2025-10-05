"""
Test Vosk transcription wrapper
ML test - must fail until transcription module is implemented
"""
import pytest
import numpy as np
from app.ml.transcription import (
    VoskTranscriber,
    transcribe_audio,
    load_vosk_model
)


@pytest.fixture
def sample_audio():
    """Generate sample audio for testing"""
    # 1 second of audio at 16kHz
    sample_rate = 16000
    duration = 1.0
    t = np.linspace(0, duration, int(sample_rate * duration))
    # Simple sine wave
    audio = np.sin(2 * np.pi * 440 * t).astype(np.int16)
    return audio.tobytes()


def test_load_vosk_model_russian():
    """Test loading Russian Vosk model"""
    model = load_vosk_model(language='ru')
    assert model is not None


def test_load_vosk_model_english():
    """Test loading English Vosk model"""
    model = load_vosk_model(language='en')
    assert model is not None


def test_load_vosk_model_invalid_language():
    """Test loading model with invalid language"""
    with pytest.raises(ValueError):
        load_vosk_model(language='invalid')


def test_vosk_transcriber_init():
    """Test VoskTranscriber initialization"""
    transcriber = VoskTranscriber(language='ru')
    assert transcriber is not None
    assert transcriber.language == 'ru'


def test_transcribe_audio_returns_dict(sample_audio):
    """Test that transcription returns expected structure"""
    result = transcribe_audio(sample_audio, language='ru', sample_rate=16000)
    
    assert isinstance(result, dict)
    assert 'text' in result
    assert 'confidence' in result
    assert isinstance(result['text'], str)
    assert isinstance(result['confidence'], (int, float))
    assert 0 <= result['confidence'] <= 1


def test_transcribe_empty_audio():
    """Test transcribing empty/silent audio"""
    silent_audio = np.zeros(16000, dtype=np.int16).tobytes()
    
    result = transcribe_audio(silent_audio, language='ru', sample_rate=16000)
    
    # Should return empty or low-confidence result
    assert result['text'] == "" or result['confidence'] < 0.5


def test_transcriber_multiple_calls(sample_audio):
    """Test using transcriber multiple times"""
    transcriber = VoskTranscriber(language='en')
    
    result1 = transcriber.transcribe(sample_audio, sample_rate=16000)
    result2 = transcriber.transcribe(sample_audio, sample_rate=16000)
    
    assert isinstance(result1, dict)
    assert isinstance(result2, dict)


def test_transcribe_different_sample_rates():
    """Test transcription with different sample rates"""
    for sr in [8000, 16000]:
        audio = np.zeros(sr, dtype=np.int16).tobytes()
        result = transcribe_audio(audio, language='en', sample_rate=sr)
        assert 'text' in result


@pytest.mark.parametrize("language", ['ru', 'en'])
def test_transcribe_both_languages(language, sample_audio):
    """Test transcription works for both supported languages"""
    result = transcribe_audio(sample_audio, language=language, sample_rate=16000)
    assert isinstance(result, dict)
    assert 'text' in result
    assert 'confidence' in result
