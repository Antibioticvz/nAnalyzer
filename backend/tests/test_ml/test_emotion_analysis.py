"""
Test rule-based emotion analysis and RandomForest fallback
ML test - must fail until emotion analysis module is implemented
"""
import pytest
import numpy as np
from app.ml.emotion_analysis import (
    calculate_enthusiasm_score,
    calculate_agreement_score,
    calculate_stress_score,
    analyze_emotions,
    train_emotion_models,
    predict_with_model
)


def generate_feature_dict():
    """Generate sample audio features for testing"""
    return {
        'pitch_mean': 200.0,
        'pitch_std': 25.0,
        'pitch_range': 100.0,
        'energy_mean': 0.05,
        'energy_std': 0.02,
        'tempo': 120.0,
        'jitter': 1.5,
        'avg_pause': 0.5,
        'keyword_score': 5.0,
        'speech_rate': 150.0
    }


def test_calculate_enthusiasm_score_high():
    """Test enthusiasm calculation with high energy/pitch variance"""
    features = generate_feature_dict()
    features['pitch_std'] = 50.0  # High variance
    features['energy_mean'] = 0.1  # High energy
    features['tempo'] = 150.0  # Fast tempo
    
    score = calculate_enthusiasm_score(features)
    
    assert 0 <= score <= 10
    assert score > 6  # Should be high enthusiasm


def test_calculate_enthusiasm_score_low():
    """Test enthusiasm calculation with low energy/pitch variance"""
    features = generate_feature_dict()
    features['pitch_std'] = 5.0  # Low variance
    features['energy_mean'] = 0.01  # Low energy
    features['tempo'] = 60.0  # Slow tempo
    
    score = calculate_enthusiasm_score(features)
    
    assert 0 <= score <= 10
    assert score < 5  # Should be low enthusiasm


def test_calculate_agreement_score_high():
    """Test agreement with positive keywords"""
    features = generate_feature_dict()
    features['keyword_score'] = 10.0  # Many positive keywords
    
    transcript = "да согласен отлично хорошо правильно"
    
    score = calculate_agreement_score(features, transcript, language='ru')
    
    assert 0 <= score <= 10
    assert score > 6  # Should show high agreement


def test_calculate_agreement_score_low():
    """Test agreement with negative keywords"""
    features = generate_feature_dict()
    features['keyword_score'] = -5.0  # Negative keywords
    
    transcript = "нет не согласен сомневаюсь"
    
    score = calculate_agreement_score(features, transcript, language='ru')
    
    assert 0 <= score <= 10
    assert score < 5  # Should show low agreement


def test_calculate_stress_score_high():
    """Test stress calculation with high jitter and pauses"""
    features = generate_feature_dict()
    features['jitter'] = 5.0  # High jitter
    features['avg_pause'] = 2.0  # Long pauses
    
    score = calculate_stress_score(features)
    
    assert 0 <= score <= 10
    assert score > 6  # Should indicate high stress


def test_calculate_stress_score_low():
    """Test stress calculation with low jitter and pauses"""
    features = generate_feature_dict()
    features['jitter'] = 0.5  # Low jitter
    features['avg_pause'] = 0.2  # Short pauses
    
    score = calculate_stress_score(features)
    
    assert 0 <= score <= 10
    assert score < 4  # Should indicate low stress


def test_analyze_emotions_complete():
    """Test complete emotion analysis"""
    features = generate_feature_dict()
    transcript = "да согласен"
    
    emotions = analyze_emotions(features, transcript, language='ru')
    
    assert 'enthusiasm' in emotions
    assert 'agreement' in emotions
    assert 'stress' in emotions
    
    # All scores should be in valid range
    for score in emotions.values():
        assert 0 <= score <= 10
        assert isinstance(score, (int, float))


def test_train_emotion_models():
    """Test training RandomForest models from feedback"""
    # Generate sample training data (50+ samples per spec)
    n_samples = 60
    X = np.random.randn(n_samples, 10).astype(np.float32)  # 10 features
    y_enthusiasm = np.random.uniform(0, 10, n_samples)
    y_agreement = np.random.uniform(0, 10, n_samples)
    y_stress = np.random.uniform(0, 10, n_samples)
    
    models = train_emotion_models(X, y_enthusiasm, y_agreement, y_stress)
    
    assert 'enthusiasm' in models
    assert 'agreement' in models
    assert 'stress' in models
    
    # Each model should have predict method
    for model in models.values():
        assert hasattr(model, 'predict')


def test_train_emotion_models_insufficient_data():
    """Test that training fails with < 50 samples"""
    n_samples = 30  # Less than 50
    X = np.random.randn(n_samples, 10).astype(np.float32)
    y = np.random.uniform(0, 10, n_samples)
    
    with pytest.raises(ValueError):
        train_emotion_models(X, y, y, y)


def test_predict_with_model():
    """Test prediction with trained RandomForest"""
    # Train simple model
    n_samples = 60
    X_train = np.random.randn(n_samples, 10).astype(np.float32)
    y_train = np.random.uniform(0, 10, n_samples)
    
    models = train_emotion_models(X_train, y_train, y_train, y_train)
    
    # Predict on new data
    X_test = np.random.randn(1, 10).astype(np.float32)
    prediction = predict_with_model(models['enthusiasm'], X_test)
    
    assert isinstance(prediction, (int, float))
    assert 0 <= prediction <= 10


def test_emotion_scores_boundary():
    """Test that emotion scores are clamped to [0, 10]"""
    features = generate_feature_dict()
    # Extreme values that might produce out-of-range scores
    features['pitch_std'] = 1000.0
    features['energy_mean'] = 10.0
    
    emotions = analyze_emotions(features, "", language='ru')
    
    # Scores should be clamped
    assert all(0 <= score <= 10 for score in emotions.values())


@pytest.mark.parametrize("language", ['ru', 'en'])
def test_analyze_emotions_both_languages(language):
    """Test emotion analysis works for both languages"""
    features = generate_feature_dict()
    transcript = "test transcript"
    
    emotions = analyze_emotions(features, transcript, language=language)
    
    assert len(emotions) == 3
    assert all(0 <= score <= 10 for score in emotions.values())
