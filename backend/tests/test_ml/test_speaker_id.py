"""
Test GMM training and speaker identification
ML test - must fail until GMM module is implemented
"""
import pytest
import numpy as np
from app.ml.speaker_id import (
    train_gmm_model,
    calibrate_threshold,
    identify_speaker,
    save_model,
    load_model
)


def generate_sample_features(n_samples=10, n_features=13):
    """Generate sample MFCC features for testing"""
    return np.random.randn(n_samples, n_features).astype(np.float32)


def test_train_gmm_model():
    """Test GMM model training"""
    # Generate training samples (5-10 samples of MFCC features)
    samples = [generate_sample_features(100) for _ in range(8)]
    
    model = train_gmm_model(samples, n_components=16)
    
    assert model is not None
    assert hasattr(model, 'score')  # GMM should have score method
    assert hasattr(model, 'predict')
    assert model.n_components == 16


def test_calibrate_threshold():
    """Test per-user threshold calibration"""
    samples = [generate_sample_features(100) for _ in range(8)]
    model = train_gmm_model(samples, n_components=16)
    
    threshold = calibrate_threshold(model, samples)
    
    assert isinstance(threshold, float)
    assert np.isfinite(threshold)
    # Threshold should be negative (log-likelihood)
    assert threshold < 0


def test_identify_speaker_seller():
    """Test identifying seller (user's voice)"""
    # Train model on seller's voice
    seller_samples = [generate_sample_features(100) for _ in range(8)]
    model = train_gmm_model(seller_samples, n_components=16)
    threshold = calibrate_threshold(model, seller_samples)
    
    # Create user model dict
    user_model = {
        'gmm': model,
        'threshold': threshold,
        'n_samples': 8
    }
    
    # Test with similar features (should be seller)
    test_audio = generate_sample_features(50)
    speaker = identify_speaker(test_audio, user_model)
    
    assert speaker in ['seller', 'client']


def test_identify_speaker_client():
    """Test identifying client (different voice)"""
    # Train model on one voice
    voice1_samples = [generate_sample_features(100, seed=42) for _ in range(8)]
    model = train_gmm_model(voice1_samples, n_components=16)
    threshold = calibrate_threshold(model, voice1_samples)
    
    user_model = {
        'gmm': model,
        'threshold': threshold,
        'n_samples': 8
    }
    
    # Test with very different features (should be client)
    test_audio = generate_sample_features(50, seed=999) * 10  # Different distribution
    speaker = identify_speaker(test_audio, user_model)
    
    assert speaker in ['seller', 'client']


def test_train_gmm_insufficient_samples():
    """Test that training fails with too few samples"""
    samples = [generate_sample_features(100) for _ in range(3)]  # Only 3 samples
    
    with pytest.raises(ValueError):
        train_gmm_model(samples, n_components=16)


def test_save_and_load_model(tmp_path):
    """Test model serialization"""
    samples = [generate_sample_features(100) for _ in range(8)]
    model = train_gmm_model(samples, n_components=16)
    threshold = calibrate_threshold(model, samples)
    
    user_model = {
        'gmm': model,
        'threshold': threshold,
        'n_samples': 8,
        'trained_at': '2025-01-05T10:00:00Z'
    }
    
    # Save model
    model_path = tmp_path / "test_user.pkl"
    save_model(user_model, str(model_path))
    
    assert model_path.exists()
    
    # Load model
    loaded_model = load_model(str(model_path))
    
    assert loaded_model['threshold'] == threshold
    assert loaded_model['n_samples'] == 8
    assert hasattr(loaded_model['gmm'], 'score')


def test_gmm_consistency():
    """Test that GMM produces consistent scores for same input"""
    samples = [generate_sample_features(100, seed=42) for _ in range(8)]
    model = train_gmm_model(samples, n_components=16)
    
    test_audio = generate_sample_features(50, seed=42)
    
    # Score should be consistent
    score1 = model.score(test_audio)
    score2 = model.score(test_audio)
    
    assert score1 == score2


def generate_sample_features(n_samples, n_features=13, seed=None):
    """Helper to generate consistent test data"""
    if seed is not None:
        np.random.seed(seed)
    return np.random.randn(n_samples, n_features).astype(np.float32)
