"""
Test language detection logic
ML test - must fail until language detection module is implemented
"""
import pytest
import numpy as np
from app.ml.language_detection import (
    detect_language,
    detect_language_from_confidence
)


def generate_test_audio(duration_sec=10, sample_rate=16000):
    """Generate test audio data"""
    n_samples = int(duration_sec * sample_rate)
    t = np.linspace(0, duration_sec, n_samples)
    audio = np.sin(2 * np.pi * 440 * t).astype(np.int16)
    return audio.tobytes()


def test_detect_language_returns_valid_language():
    """Test that language detection returns ru or en"""
    audio = generate_test_audio(duration_sec=10)
    
    language = detect_language(audio, sample_rate=16000)
    
    assert language in ['ru', 'en']


def test_detect_language_from_confidence_russian():
    """Test language selection based on confidence scores"""
    # Simulate Russian having higher confidence
    russian_result = {'text': 'текст', 'confidence': 0.85}
    english_result = {'text': 'text', 'confidence': 0.45}
    
    language = detect_language_from_confidence(russian_result, english_result)
    
    assert language == 'ru'


def test_detect_language_from_confidence_english():
    """Test language selection when English has higher confidence"""
    russian_result = {'text': 'текст', 'confidence': 0.35}
    english_result = {'text': 'hello world', 'confidence': 0.92}
    
    language = detect_language_from_confidence(russian_result, english_result)
    
    assert language == 'en'


def test_detect_language_from_confidence_equal():
    """Test tie-breaking when confidences are equal"""
    russian_result = {'text': 'текст', 'confidence': 0.75}
    english_result = {'text': 'text', 'confidence': 0.75}
    
    language = detect_language_from_confidence(russian_result, english_result)
    
    # Should return either language (implementation choice)
    assert language in ['ru', 'en']


def test_detect_language_short_audio():
    """Test language detection on short audio (edge case)"""
    audio = generate_test_audio(duration_sec=2)  # Only 2 seconds
    
    language = detect_language(audio, sample_rate=16000)
    
    # Should still return valid language even with short audio
    assert language in ['ru', 'en']


def test_detect_language_with_custom_window():
    """Test language detection with custom window size"""
    audio = generate_test_audio(duration_sec=30)
    
    # Detect language using first 15 seconds
    language = detect_language(audio, sample_rate=16000, window_sec=15)
    
    assert language in ['ru', 'en']


def test_detect_language_silent_audio():
    """Test language detection on silent audio"""
    silent_audio = np.zeros(16000 * 10, dtype=np.int16).tobytes()
    
    # Should handle silence gracefully and return default or low-confidence result
    language = detect_language(silent_audio, sample_rate=16000)
    
    assert language in ['ru', 'en', None]  # None is acceptable for ambiguous


@pytest.mark.parametrize("duration", [5, 10, 20, 30])
def test_detect_language_various_durations(duration):
    """Test language detection with various audio durations"""
    audio = generate_test_audio(duration_sec=duration)
    
    language = detect_language(audio, sample_rate=16000)
    
    assert language in ['ru', 'en']
