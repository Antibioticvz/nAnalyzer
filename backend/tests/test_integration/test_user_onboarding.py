"""
Integration test: User onboarding flow
Test complete flow: register → train voice → GMM created
Must fail until full user flow is implemented
"""
import pytest
import base64
import os
import numpy as np
import io
from scipy.io import wavfile


@pytest.fixture
def valid_audio_generator():
    """Generate unique valid audio data for ML processing"""
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
        
        # Generate different audio each time
        t = np.linspace(0, duration, samples)
        freq = 300 + np.random.random() * 300
        audio_data = np.sin(2 * np.pi * freq * t)
        audio_data += np.random.randn(samples) * 0.05
        audio_data = audio_data / np.max(np.abs(audio_data)) * 0.9
        audio_data = (audio_data * 32767).astype(np.int16)
        
        buffer = io.BytesIO()
        wavfile.write(buffer, sample_rate, audio_data)
        wav_data = buffer.getvalue()
        
        return base64.b64encode(wav_data).decode()
    
    return generate


@pytest.mark.asyncio
async def test_complete_user_onboarding_flow(client, valid_audio_generator):
    """Test full user onboarding from registration to trained voice model"""
    # Step 1: Register user
    reg_response = await client.post(
    "/api/v1/users/register",
    json={
        "name": "Integration Test User",
        "email": "integration@test.com",
        "role": "seller"
    }
    )
    
    assert reg_response.status_code == 201
    user_id = reg_response.json()["user_id"]
    assert user_id is not None
    
    # Step 2: Verify user exists and is not voice trained
    user_response = await client.get(
    f"/api/v1/users/{user_id}",
    headers={"X-User-ID": user_id}
    )
    
    assert user_response.status_code == 200
    user_data = user_response.json()
    assert user_data["voice_trained"] is False
    assert user_data["gmm_threshold"] is None
    
    # Step 3: Train voice with 8 unique samples
    train_response = await client.post(
    f"/api/v1/users/{user_id}/train-voice",
    headers={"X-User-ID": user_id},
    json={
        "audio_samples": [
            {
                "phrase_number": i,
                "audio_base64": valid_audio_generator(seed=i),
                "duration": 1.0
            }
            for i in range(1, 9)
        ]
    }
    )
    
    assert train_response.status_code == 200
    train_data = train_response.json()
    assert train_data["voice_trained"] is True
    assert train_data["samples_count"] == 8
    assert train_data["calibrated_threshold"] is not None
    assert isinstance(train_data["calibrated_threshold"], float)
    
    # Step 4: Verify user is now voice trained
    final_user_response = await client.get(
    f"/api/v1/users/{user_id}",
    headers={"X-User-ID": user_id}
    )
    
    assert final_user_response.status_code == 200
    final_user_data = final_user_response.json()
    assert final_user_data["voice_trained"] is True
    assert final_user_data["gmm_threshold"] is not None
    assert final_user_data["model_path"] is not None
    
    # Step 5: Verify GMM model file exists
    if final_user_data["model_path"]:
        # Model should be saved to filesystem
        # In real implementation, check file exists
        pass


@pytest.mark.asyncio
async def test_onboarding_with_settings_update(client):
    """Test onboarding flow with immediate settings update"""
    # Register
    reg_response = await client.post(
    "/api/v1/users/register",
    json={"name": "Settings User", "email": "settings_onboard@test.com"}
    )
    user_id = reg_response.json()["user_id"]
    
    # Update retention settings immediately
    settings_response = await client.put(
    f"/api/v1/users/{user_id}/settings",
    headers={"X-User-ID": user_id},
    json={"audio_retention_days": 30}
    )
    
    assert settings_response.status_code == 200
    
    # Verify settings persisted
    user_response = await client.get(
    f"/api/v1/users/{user_id}",
    headers={"X-User-ID": user_id}
    )
    
    assert user_response.json()["audio_retention_days"] == 30


@pytest.mark.asyncio
async def test_onboarding_prevents_duplicate_email(client):
    """Test that duplicate email registration is prevented"""
    email = "duplicate_onboard@test.com"
    
    # First registration
    first_response = await client.post(
    "/api/v1/users/register",
    json={"name": "First User", "email": email}
    )
    assert first_response.status_code == 201
    
    # Attempt duplicate registration
    second_response = await client.post(
    "/api/v1/users/register",
    json={"name": "Second User", "email": email}
    )
    assert second_response.status_code == 409
