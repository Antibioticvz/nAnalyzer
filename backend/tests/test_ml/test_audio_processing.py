"""
Test audio feature extraction (MFCC, pitch, jitter)
ML test - must fail until ML module is implemented
"""
import pytest
import numpy as np
from app.ml.audio_processing import (
    extract_mfcc,
    extract_pitch,
    calculate_jitter,
    extract_energy,
    extract_all_features
)


def test_extract_mfcc():
    """Test MFCC extraction from audio"""
    # Generate sample audio (1 second of sine wave at 16kHz)
    sample_rate = 16000
    duration = 1.0
    frequency = 440  # A4 note
    t = np.linspace(0, duration, int(sample_rate * duration))
    audio = np.sin(2 * np.pi * frequency * t).astype(np.float32)
    
    mfcc = extract_mfcc(audio, sample_rate)
    
    # Should return 13 MFCC coefficients per frame
    assert mfcc.shape[0] == 13
    assert mfcc.shape[1] > 0  # Should have multiple frames
    assert np.isfinite(mfcc).all()


def test_extract_pitch():
    """Test pitch extraction"""
    sample_rate = 16000
    duration = 1.0
    frequency = 440
    t = np.linspace(0, duration, int(sample_rate * duration))
    audio = np.sin(2 * np.pi * frequency * t).astype(np.float32)
    
    pitch = extract_pitch(audio, sample_rate)
    
    assert len(pitch) > 0
    # Pitch should be close to 440Hz (within tolerance for algorithm)
    pitch_mean = np.mean(pitch[pitch > 0])
    assert 400 < pitch_mean < 480


def test_calculate_jitter():
    """Test jitter (pitch perturbation) calculation"""
    sample_rate = 16000
    # Create audio with slight pitch variations (jitter)
    duration = 1.0
    t = np.linspace(0, duration, int(sample_rate * duration))
    frequency = 440 + 5 * np.sin(2 * np.pi * 5 * t)  # Modulated frequency
    audio = np.sin(2 * np.pi * frequency * t).astype(np.float32)
    
    pitch = extract_pitch(audio, sample_rate)
    jitter = calculate_jitter(pitch)
    
    assert isinstance(jitter, float)
    assert jitter >= 0  # Jitter should be non-negative
    assert jitter < 100  # Should be reasonable percentage


def test_extract_energy():
    """Test energy/RMS extraction"""
    sample_rate = 16000
    duration = 1.0
    
    # Loud audio
    t = np.linspace(0, duration, int(sample_rate * duration))
    loud_audio = 0.8 * np.sin(2 * np.pi * 440 * t).astype(np.float32)
    
    # Quiet audio
    quiet_audio = 0.1 * np.sin(2 * np.pi * 440 * t).astype(np.float32)
    
    loud_energy = extract_energy(loud_audio, sample_rate)
    quiet_energy = extract_energy(quiet_audio, sample_rate)
    
    # Loud audio should have higher energy
    assert loud_energy['energy_mean'] > quiet_energy['energy_mean']
    assert loud_energy['energy_std'] >= 0
    assert quiet_energy['energy_std'] >= 0


def test_extract_all_features():
    """Test extracting complete feature set"""
    sample_rate = 16000
    duration = 2.0
    t = np.linspace(0, duration, int(sample_rate * duration))
    audio = np.sin(2 * np.pi * 440 * t).astype(np.float32)
    
    features = extract_all_features(audio, sample_rate)
    
    # Should contain all feature types
    assert 'mfcc' in features
    assert 'pitch_mean' in features
    assert 'pitch_std' in features
    assert 'pitch_range' in features
    assert 'energy_mean' in features
    assert 'energy_std' in features
    assert 'jitter' in features
    
    # All features should be valid numbers
    for key, value in features.items():
        if key != 'mfcc':
            assert isinstance(value, (int, float))
            assert np.isfinite(value)


def test_extract_features_silence():
    """Test feature extraction on silence (edge case)"""
    sample_rate = 16000
    duration = 1.0
    audio = np.zeros(int(sample_rate * duration), dtype=np.float32)
    
    features = extract_all_features(audio, sample_rate)
    
    # Should handle silence gracefully
    assert features['energy_mean'] == pytest.approx(0, abs=1e-6)
    # Pitch might be nan or 0 for silence - that's acceptable
    assert 'pitch_mean' in features


def test_extract_features_different_sample_rates():
    """Test that code handles different sample rates"""
    for sr in [8000, 16000, 44100]:
        duration = 0.5
        t = np.linspace(0, duration, int(sr * duration))
        audio = np.sin(2 * np.pi * 440 * t).astype(np.float32)
        
        features = extract_all_features(audio, sr)
        assert features is not None
        assert 'mfcc' in features
