"""
Audio processing module - MFCC, pitch, energy, jitter extraction
Per spec: librosa for audio processing and feature extraction
"""
import numpy as np
import librosa
from typing import Dict, Any


def extract_mfcc(audio: np.ndarray, sample_rate: int, n_mfcc: int = 13) -> np.ndarray:
    """
    Extract MFCC features from audio
    
    Args:
        audio: Audio signal as numpy array
        sample_rate: Sample rate (default 16kHz per spec)
        n_mfcc: Number of MFCC coefficients (13 per spec)
    
    Returns:
        MFCC features of shape (n_mfcc, n_frames)
    """
    mfcc = librosa.feature.mfcc(
        y=audio,
        sr=sample_rate,
        n_mfcc=n_mfcc,
        hop_length=512,
        n_fft=2048
    )
    return mfcc


def extract_pitch(audio: np.ndarray, sample_rate: int) -> np.ndarray:
    """
    Extract pitch (fundamental frequency) using librosa's yin algorithm
    
    Args:
        audio: Audio signal
        sample_rate: Sample rate
    
    Returns:
        Pitch contour in Hz
    """
    # Use librosa's pyin for pitch tracking
    f0, voiced_flag, voiced_probs = librosa.pyin(
        audio,
        fmin=librosa.note_to_hz('C2'),  # ~65 Hz
        fmax=librosa.note_to_hz('C7'),  # ~2093 Hz
        sr=sample_rate
    )
    
    # Remove NaN values
    f0 = f0[~np.isnan(f0)]
    return f0


def calculate_jitter(pitch: np.ndarray) -> float:
    """
    Calculate jitter (pitch perturbation) - local variation in pitch
    
    Args:
        pitch: Pitch contour in Hz
    
    Returns:
        Jitter as percentage
    """
    if len(pitch) < 2:
        return 0.0
    
    # Filter out zero/invalid values
    valid_pitch = pitch[pitch > 0]
    
    if len(valid_pitch) < 2:
        return 0.0
    
    # Convert to periods (1/frequency)
    periods = 1.0 / valid_pitch
    
    # Calculate average absolute difference between consecutive periods
    period_diffs = np.abs(np.diff(periods))
    jitter = np.mean(period_diffs) / np.mean(periods) * 100
    
    return float(jitter)


def extract_energy(audio: np.ndarray, sample_rate: int) -> Dict[str, float]:
    """
    Extract energy/RMS features
    
    Args:
        audio: Audio signal
        sample_rate: Sample rate
    
    Returns:
        Dictionary with energy statistics
    """
    rms = librosa.feature.rms(y=audio)[0]
    
    return {
        'energy_mean': float(np.mean(rms)),
        'energy_std': float(np.std(rms)),
        'energy_max': float(np.max(rms)),
        'energy_min': float(np.min(rms))
    }


def extract_tempo(audio: np.ndarray, sample_rate: int) -> float:
    """
    Extract tempo (beats per minute)
    
    Args:
        audio: Audio signal
        sample_rate: Sample rate
    
    Returns:
        Tempo in BPM
    """
    onset_env = librosa.onset.onset_strength(y=audio, sr=sample_rate)
    tempo, _ = librosa.beat.beat_track(onset_envelope=onset_env, sr=sample_rate)
    
    return float(tempo)


def extract_all_features(audio: np.ndarray, sample_rate: int) -> Dict[str, Any]:
    """
    Extract complete feature set for emotion analysis
    
    Args:
        audio: Audio signal
        sample_rate: Sample rate
    
    Returns:
        Dictionary with all extracted features
    """
    features = {}
    
    # MFCC features
    mfcc = extract_mfcc(audio, sample_rate)
    features['mfcc'] = mfcc
    features['mfcc_mean'] = np.mean(mfcc, axis=1)
    features['mfcc_std'] = np.std(mfcc, axis=1)
    
    # Pitch features
    pitch = extract_pitch(audio, sample_rate)
    if len(pitch) > 0:
        features['pitch_mean'] = float(np.mean(pitch))
        features['pitch_std'] = float(np.std(pitch))
        features['pitch_range'] = float(np.max(pitch) - np.min(pitch))
        features['jitter'] = calculate_jitter(pitch)
    else:
        features['pitch_mean'] = 0.0
        features['pitch_std'] = 0.0
        features['pitch_range'] = 0.0
        features['jitter'] = 0.0
    
    # Energy features
    energy_features = extract_energy(audio, sample_rate)
    features.update(energy_features)
    
    # Tempo
    try:
        features['tempo'] = extract_tempo(audio, sample_rate)
    except Exception:
        features['tempo'] = 120.0  # Default
    
    return features
