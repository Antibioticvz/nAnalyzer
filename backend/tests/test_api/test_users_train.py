"""
Test POST /api/v1/users/{id}/train-voice endpoint
Contract test - must fail until endpoint is implemented
"""
import pytest
import base64


@pytest.fixture
def sample_audio_generator():
    """Generate unique sample audio data for each call"""
    import numpy as np
    import io
    from scipy.io import wavfile
    
    def generate(seed=None):
        if seed is not None:
            np.random.seed(seed)
        
        # Create 1 second of audio at 16kHz sample rate
        sample_rate = 16000
        duration = 1.0
        samples = int(sample_rate * duration)
        
        # Generate different audio each time (mix of sine waves at different frequencies)
        t = np.linspace(0, duration, samples)
        # Use random frequency between 300-600 Hz to create variation
        freq = 300 + np.random.random() * 300
        audio_data = np.sin(2 * np.pi * freq * t)
        # Add some noise for variation
        audio_data += np.random.randn(samples) * 0.05
        # Normalize and convert to int16
        audio_data = audio_data / np.max(np.abs(audio_data)) * 0.9
        audio_data = (audio_data * 32767).astype(np.int16)
        
        # Write to WAV format in memory
        buffer = io.BytesIO()
        wavfile.write(buffer, sample_rate, audio_data)
        wav_data = buffer.getvalue()
        
        return base64.b64encode(wav_data).decode()
    
    return generate


@pytest.mark.asyncio
async def test_train_voice_success(client, sample_audio_generator):
    """Test successful voice training with 8 samples"""
    # First create a user
    reg_response = await client.post(
    "/api/v1/users/register",
    json={"name": "Test User", "email": "train@test.com"}
    )
    user_id = reg_response.json()["user_id"]

    # Train voice with 8 unique samples
    response = await client.post(
    f"/api/v1/users/{user_id}/train-voice",
    headers={"X-User-ID": user_id},
    json={
    "audio_samples": [
        {
            "phrase_number": i,
            "audio_base64": sample_audio_generator(seed=i),  # Unique audio for each sample
            "duration": 1.0
        }
        for i in range(1, 9)
    ]
    }
    )

    assert response.status_code == 200
    data = response.json()
    assert data["user_id"] == user_id
    assert data["voice_trained"] is True
    assert data["samples_count"] == 8
    assert "model_accuracy" in data
    assert "model_size_kb" in data
    assert "calibrated_threshold" in data
    assert isinstance(data["calibrated_threshold"], float)


@pytest.mark.asyncio
async def test_train_voice_insufficient_samples(client, sample_audio_generator):
    """Test voice training with too few samples (< 5)"""
    reg_response = await client.post(
    "/api/v1/users/register",
    json={"name": "Test User", "email": "train2@test.com"}
    )
    user_id = reg_response.json()["user_id"]

    response = await client.post(
    f"/api/v1/users/{user_id}/train-voice",
    headers={"X-User-ID": user_id},
    json={
    "audio_samples": [
        {
            "phrase_number": i,
            "audio_base64": sample_audio_generator(seed=i),
            "duration": 1.0
        }
        for i in range(1, 4)  # Only 3 samples
    ]
    }
    )

    # FastAPI Pydantic validation returns 422 for constraint violations
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_train_voice_invalid_audio(client):
    """Test voice training with invalid audio data"""
    reg_response = await client.post(
    "/api/v1/users/register",
    json={"name": "Test User", "email": "train3@test.com"}
    )
    user_id = reg_response.json()["user_id"]
    
    response = await client.post(
    f"/api/v1/users/{user_id}/train-voice",
    headers={"X-User-ID": user_id},
    json={
        "audio_samples": [
            {
                "phrase_number": i,
                "audio_base64": "invalid-base64",
                "duration": 10.0
            }
            for i in range(1, 9)
        ]
    }
    )
    
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_train_voice_user_not_found(client, sample_audio_generator):
    """Test voice training for non-existent user"""
    response = await client.post(
    "/api/v1/users/nonexistent_user/train-voice",
    headers={"X-User-ID": "nonexistent_user"},
    json={
    "audio_samples": [
        {
            "phrase_number": i,
            "audio_base64": sample_audio_generator(seed=i),
            "duration": 1.0
        }
        for i in range(1, 9)
    ]
    }
    )

    assert response.status_code == 404
