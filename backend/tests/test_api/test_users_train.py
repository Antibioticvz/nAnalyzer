"""
Test POST /api/v1/users/{id}/train-voice endpoint
Contract test - must fail until endpoint is implemented
"""
import pytest
import base64


@pytest.fixture
def sample_audio_base64():
    """Generate sample audio data (mock WAV format)"""
    # Simple WAV header + silence
    wav_data = b"RIFF" + b"\x00" * 100
    return base64.b64encode(wav_data).decode()


@pytest.mark.asyncio
async def test_train_voice_success(sample_audio_base64):
    """Test successful voice training with 8 samples"""
    async with AsyncClient(app=app, base_url="http://test") as client:
    # First create a user
    reg_response = await client.post(
            "/api/v1/users/register",
            json={"name": "Test User", "email": "train@test.com"}
    )
    user_id = reg_response.json()["user_id"]
    
    # Train voice with 8 samples
    response = await client.post(
            f"/api/v1/users/{user_id}/train-voice",
            headers={"X-User-ID": user_id},
            json={
                "audio_samples": [
                    {
                        "phrase_number": i,
                        "audio_base64": sample_audio_base64,
                        "duration": 12.5
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
async def test_train_voice_insufficient_samples(sample_audio_base64):
    """Test voice training with too few samples (< 5)"""
    async with AsyncClient(app=app, base_url="http://test") as client:
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
                        "audio_base64": sample_audio_base64,
                        "duration": 10.0
                    }
                    for i in range(1, 4)  # Only 3 samples
                ]
            }
    )
    
    assert response.status_code == 400
    data = response.json()
    assert "error" in data


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
async def test_train_voice_user_not_found(sample_audio_base64):
    """Test voice training for non-existent user"""
    async with AsyncClient(app=app, base_url="http://test") as client:
    response = await client.post(
            "/api/v1/users/nonexistent_user/train-voice",
            headers={"X-User-ID": "nonexistent_user"},
            json={
                "audio_samples": [
                    {
                        "phrase_number": i,
                        "audio_base64": sample_audio_base64,
                        "duration": 10.0
                    }
                    for i in range(1, 9)
                ]
            }
    )
    
    assert response.status_code == 404
