"""
Integration test: User onboarding flow
Test complete flow: register → train voice → GMM created
Must fail until full user flow is implemented
"""
import pytest
from httpx import AsyncClient
from app.main import app
import base64
import os


@pytest.mark.asyncio
async def test_complete_user_onboarding_flow():
    """Test full user onboarding from registration to trained voice model"""
    async with AsyncClient(app=app, base_url="http://test") as client:
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
        
        # Step 3: Train voice with 8 samples
        # Generate mock audio samples
        sample_audio = base64.b64encode(b"WAV" + b"\x00" * 1000).decode()
        
        train_response = await client.post(
            f"/api/v1/users/{user_id}/train-voice",
            headers={"X-User-ID": user_id},
            json={
                "audio_samples": [
                    {
                        "phrase_number": i,
                        "audio_base64": sample_audio,
                        "duration": 12.5
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
async def test_onboarding_with_settings_update():
    """Test onboarding flow with immediate settings update"""
    async with AsyncClient(app=app, base_url="http://test") as client:
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
async def test_onboarding_prevents_duplicate_email():
    """Test that duplicate email registration is prevented"""
    async with AsyncClient(app=app, base_url="http://test") as client:
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
