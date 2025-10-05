"""
GMM-based speaker identification module
Per spec: scikit-learn GMM with per-user threshold calibration
"""
import numpy as np
import pickle
from pathlib import Path
from sklearn.mixture import GaussianMixture
from typing import List, Dict, Any
from app.ml.audio_processing import extract_mfcc


def train_gmm_model(
    audio_samples: List[np.ndarray],
    n_components: int = 16,
    covariance_type: str = 'diag'
) -> GaussianMixture:
    """
    Train GMM model on user's voice samples
    
    Args:
        audio_samples: List of MFCC features from training phrases
        n_components: Number of GMM components (16 per spec)
        covariance_type: Covariance type ('diag' per spec)
    
    Returns:
        Trained GaussianMixture model
    
    Raises:
        ValueError: If insufficient samples (< 5)
    """
    if len(audio_samples) < 5:
        raise ValueError(f"Insufficient training samples. Need at least 5, got {len(audio_samples)}")
    
    # Concatenate all MFCC features
    all_features = np.vstack(audio_samples)
    
    # Train GMM
    gmm = GaussianMixture(
        n_components=n_components,
        covariance_type=covariance_type,
        max_iter=100,
        random_state=42
    )
    
    gmm.fit(all_features)
    
    return gmm


def calibrate_threshold(
    model: GaussianMixture,
    training_samples: List[np.ndarray]
) -> float:
    """
    Calibrate per-user threshold for speaker identification
    Per spec: threshold = mean - 2*std of log-likelihoods on training data
    
    Args:
        model: Trained GMM model
        training_samples: Same samples used for training
    
    Returns:
        Calibrated threshold value
    """
    log_likelihoods = []
    
    for sample in training_samples:
        score = model.score(sample)
        log_likelihoods.append(score)
    
    mean_score = np.mean(log_likelihoods)
    std_score = np.std(log_likelihoods)
    
    # Threshold at mean - 2*std (captures ~95% of user's voice)
    threshold = mean_score - 2 * std_score
    
    return float(threshold)


def identify_speaker(
    audio_features: np.ndarray,
    user_model: Dict[str, Any]
) -> str:
    """
    Identify speaker as 'seller' (user) or 'client'
    
    Args:
        audio_features: MFCC features of audio segment
        user_model: Dictionary containing GMM and threshold
    
    Returns:
        'seller' if matches user's voice, 'client' otherwise
    """
    gmm = user_model['gmm']
    threshold = user_model['threshold']
    
    # Calculate log-likelihood
    log_likelihood = gmm.score(audio_features)
    
    # Compare against calibrated threshold
    if log_likelihood > threshold:
        return "seller"
    else:
        return "client"


def save_model(user_model: Dict[str, Any], filepath: str) -> None:
    """
    Save trained model to pickle file
    
    Args:
        user_model: Dictionary with GMM, threshold, metadata
        filepath: Path to save pickle file
    """
    Path(filepath).parent.mkdir(parents=True, exist_ok=True)
    
    with open(filepath, 'wb') as f:
        pickle.dump(user_model, f)


def load_model(filepath: str) -> Dict[str, Any]:
    """
    Load trained model from pickle file
    
    Args:
        filepath: Path to pickle file
    
    Returns:
        Dictionary with GMM, threshold, metadata
    """
    with open(filepath, 'rb') as f:
        user_model = pickle.load(f)
    
    return user_model


def train_user_voice_model(
    audio_samples: List[bytes],
    sample_rate: int = 16000
) -> Dict[str, Any]:
    """
    Complete pipeline: train GMM and calibrate threshold
    
    Args:
        audio_samples: List of raw audio bytes
        sample_rate: Audio sample rate
    
    Returns:
        Complete user model dictionary
    """
    # Extract MFCC features from all samples
    mfcc_features = []
    
    for audio_bytes in audio_samples:
        # Convert bytes to numpy array
        audio = np.frombuffer(audio_bytes, dtype=np.float32)
        
        # Extract MFCC
        mfcc = extract_mfcc(audio, sample_rate)
        mfcc_features.append(mfcc.T)  # Transpose to (n_frames, n_mfcc)
    
    # Train GMM
    gmm = train_gmm_model(mfcc_features)
    
    # Calibrate threshold
    threshold = calibrate_threshold(gmm, mfcc_features)
    
    # Create model dictionary
    user_model = {
        'gmm': gmm,
        'threshold': threshold,
        'n_samples': len(audio_samples),
        'sample_rate': sample_rate
    }
    
    return user_model
