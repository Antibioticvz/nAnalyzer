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
    n_components: int = 8,  # Reduced from 16 to handle small/similar samples
    covariance_type: str = 'diag'
) -> GaussianMixture:
    """
    Train GMM model on user's voice samples
    
    Args:
        audio_samples: List of MFCC features from training phrases
        n_components: Number of GMM components (8 default, 16 per spec for real data)
        covariance_type: Covariance type ('diag' per spec)
    
    Returns:
        Trained GaussianMixture model
    
    Raises:
        ValueError: If insufficient samples (< 5) or invalid data
    """
    if len(audio_samples) < 5:
        raise ValueError(f"Insufficient training samples. Need at least 5, got {len(audio_samples)}")
    
    # Concatenate all MFCC features
    all_features = np.vstack(audio_samples)
    
    # Check for NaN or Inf values and handle them
    if not np.isfinite(all_features).all():
        # Replace NaN/Inf with small random values
        mask = ~np.isfinite(all_features)
        all_features[mask] = np.random.randn(np.sum(mask)) * 0.01
    
    # Adaptively choose n_components based on data size
    max_components = min(n_components, len(all_features) // 10)  # At least 10 samples per component
    if max_components < n_components:
        n_components = max(1, max_components)
    
    # Train GMM with regularization to handle near-singular covariance
    gmm = GaussianMixture(
        n_components=n_components,
        covariance_type=covariance_type,
        max_iter=100,
        random_state=42,
        reg_covar=1e-5  # Add regularization to prevent singular covariance
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
        audio_samples: List of raw audio bytes (WAV format)
        sample_rate: Audio sample rate
    
    Returns:
        Complete user model dictionary
    """
    import io
    from scipy.io import wavfile
    
    # Extract MFCC features from all samples
    mfcc_features = []
    
    for audio_bytes in audio_samples:
        # Parse WAV file from bytes
        buffer = io.BytesIO(audio_bytes)
        sr, audio = wavfile.read(buffer)
        
        # Convert to float32 and normalize
        if audio.dtype == np.int16:
            audio = audio.astype(np.float32) / 32768.0
        elif audio.dtype == np.int32:
            audio = audio.astype(np.float32) / 2147483648.0
        else:
            audio = audio.astype(np.float32)
        
        # Extract MFCC
        mfcc = extract_mfcc(audio, sr)
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
