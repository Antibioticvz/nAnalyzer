"""
Emotion analysis module
Per spec: Rule-based initially, RandomForest after 50+ feedback samples
"""
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from typing import Dict, Any, Optional
import pickle
from pathlib import Path


# Russian keywords per spec
AGREEMENT_KEYWORDS_RU = [
    "да", "согласен", "согласна", "хорошо", "отлично",
    "понятно", "правильно", "верно", "подходит", "устраивает"
]

DISAGREEMENT_KEYWORDS_RU = [
    "нет", "не согласен", "не подходит", "дорого",
    "не понятно", "сомневаюсь", "подумаю"
]

# English keywords per spec
AGREEMENT_KEYWORDS_EN = [
    "yes", "agree", "sounds good", "perfect", "absolutely",
    "understood", "correct", "right", "works for me", "fine"
]

DISAGREEMENT_KEYWORDS_EN = [
    "no", "disagree", "not sure", "expensive", "don't think",
    "confused", "doubt", "need time", "maybe later"
]


def normalize(value: float, min_val: float, max_val: float) -> float:
    """Normalize value to 0-10 scale"""
    if max_val == min_val:
        return 5.0
    normalized = ((value - min_val) / (max_val - min_val)) * 10
    return max(0.0, min(10.0, normalized))


def calculate_enthusiasm_score(features: Dict[str, float]) -> float:
    """
    Calculate enthusiasm using rule-based heuristics
    Per spec: High pitch variance + high energy + fast tempo = high enthusiasm
    
    Args:
        features: Dictionary of audio features
    
    Returns:
        Enthusiasm score (0-10)
    """
    # Pitch variance component (higher = more enthusiastic)
    pitch_score = normalize(features.get('pitch_std', 0), 0, 50)
    
    # Energy component (louder = more enthusiastic)
    energy_score = normalize(features.get('energy_mean', 0), 0, 0.1)
    
    # Tempo component (faster = more enthusiastic)
    tempo_score = normalize(features.get('tempo', 120), 60, 180)
    
    # Combine (weighted average)
    enthusiasm = (pitch_score * 0.4 + energy_score * 0.3 + tempo_score * 0.3)
    
    return max(0.0, min(10.0, enthusiasm))


def count_keywords(transcript: str, keywords: list) -> int:
    """Count occurrences of keywords in transcript"""
    transcript_lower = transcript.lower()
    count = sum(1 for keyword in keywords if keyword in transcript_lower)
    return count


def calculate_agreement_score(
    features: Dict[str, float],
    transcript: str,
    language: str
) -> float:
    """
    Calculate agreement using keyword matching
    Per spec: Positive keywords + steady tempo = high agreement
    
    Args:
        features: Audio features
        transcript: Transcribed text
        language: 'ru' or 'en'
    
    Returns:
        Agreement score (0-10)
    """
    # Select language-specific keywords
    if language == 'ru':
        agreement_kw = AGREEMENT_KEYWORDS_RU
        disagreement_kw = DISAGREEMENT_KEYWORDS_RU
    else:
        agreement_kw = AGREEMENT_KEYWORDS_EN
        disagreement_kw = DISAGREEMENT_KEYWORDS_EN
    
    # Count keywords
    agreement_count = count_keywords(transcript, agreement_kw)
    disagreement_count = count_keywords(transcript, disagreement_kw)
    
    # Calculate score based on keyword ratio
    total_keywords = agreement_count + disagreement_count
    
    if total_keywords == 0:
        # No keywords found, use neutral score
        return 5.0
    
    agreement_ratio = agreement_count / total_keywords
    score = agreement_ratio * 10
    
    return max(0.0, min(10.0, score))


def calculate_stress_score(features: Dict[str, float]) -> float:
    """
    Calculate stress using jitter and pauses
    Per spec: High jitter + long pauses = high stress
    
    Args:
        features: Audio features
    
    Returns:
        Stress score (0-10)
    """
    # Jitter component (higher jitter = more stress)
    jitter = features.get('jitter', 0)
    jitter_score = normalize(jitter, 0, 5)
    
    # Pause component (longer pauses might indicate stress or hesitation)
    # This would need pause detection in audio_processing
    # For now, use a placeholder
    pause_score = 5.0
    
    # Combine
    stress = (jitter_score * 0.7 + pause_score * 0.3)
    
    return max(0.0, min(10.0, stress))


def analyze_emotions(
    features: Dict[str, float],
    transcript: str,
    language: str
) -> Dict[str, float]:
    """
    Complete emotion analysis using rule-based approach
    
    Args:
        features: Audio features dictionary
        transcript: Transcribed text
        language: 'ru' or 'en'
    
    Returns:
        Dictionary with enthusiasm, agreement, stress scores
    """
    return {
        'enthusiasm': calculate_enthusiasm_score(features),
        'agreement': calculate_agreement_score(features, transcript, language),
        'stress': calculate_stress_score(features)
    }


def train_emotion_models(
    X: np.ndarray,
    y_enthusiasm: np.ndarray,
    y_agreement: np.ndarray,
    y_stress: np.ndarray
) -> Dict[str, RandomForestRegressor]:
    """
    Train RandomForest models from user feedback
    Per spec: Requires 50+ samples per emotion
    
    Args:
        X: Feature matrix (n_samples, n_features)
        y_enthusiasm: Target enthusiasm scores
        y_agreement: Target agreement scores
        y_stress: Target stress scores
    
    Returns:
        Dictionary with trained models
    
    Raises:
        ValueError: If insufficient samples (< 50)
    """
    if len(X) < 50:
        raise ValueError(f"Insufficient training data. Need 50+ samples, got {len(X)}")
    
    models = {}
    
    # Train enthusiasm model
    rf_enthusiasm = RandomForestRegressor(n_estimators=50, max_depth=10, random_state=42)
    rf_enthusiasm.fit(X, y_enthusiasm)
    models['enthusiasm'] = rf_enthusiasm
    
    # Train agreement model
    rf_agreement = RandomForestRegressor(n_estimators=50, max_depth=10, random_state=42)
    rf_agreement.fit(X, y_agreement)
    models['agreement'] = rf_agreement
    
    # Train stress model
    rf_stress = RandomForestRegressor(n_estimators=50, max_depth=10, random_state=42)
    rf_stress.fit(X, y_stress)
    models['stress'] = rf_stress
    
    return models


def predict_with_model(model: RandomForestRegressor, features: np.ndarray) -> float:
    """
    Predict emotion score with trained model
    
    Args:
        model: Trained RandomForest model
        features: Feature vector
    
    Returns:
        Predicted score (0-10)
    """
    prediction = model.predict(features.reshape(1, -1))[0]
    return max(0.0, min(10.0, float(prediction)))


def save_emotion_models(models: Dict[str, RandomForestRegressor], filepath: str) -> None:
    """Save trained emotion models"""
    Path(filepath).parent.mkdir(parents=True, exist_ok=True)
    with open(filepath, 'wb') as f:
        pickle.dump(models, f)


def load_emotion_models(filepath: str) -> Dict[str, RandomForestRegressor]:
    """Load trained emotion models"""
    with open(filepath, 'rb') as f:
        return pickle.load(f)
