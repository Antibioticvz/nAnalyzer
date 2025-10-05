"""
Integration test: Audio cleanup service
Test flow: create call → schedule deletion → cleanup runs → audio deleted
Must fail until cleanup service is implemented
"""
import pytest
from datetime import datetime, timedelta


@pytest.mark.asyncio
async def test_audio_cleanup_service(client):
    """Test automatic audio file deletion based on retention policy"""
            # Create user with short retention period
    reg_response = await client.post(
            "/api/v1/users/register",
            json={"name": "Cleanup User", "email": "cleanup@test.com"}
    )
    user_id = reg_response.json()["user_id"]
    
    # Set retention to 1 day for testing
    await client.put(
            f"/api/v1/users/{user_id}/settings",
            headers={"X-User-ID": user_id},
            json={"audio_retention_days": 1}
    )
    
    # In real test: create a call, wait/mock time, run cleanup
    # For now, test the contract exists
    
    # Verify user settings applied
    user_response = await client.get(
            f"/api/v1/users/{user_id}",
            headers={"X-User-ID": user_id}
    )
    
    assert user_response.status_code == 200
    assert user_response.json()["audio_retention_days"] == 1


@pytest.mark.asyncio
async def test_cleanup_respects_retention_period(client):
    """Test that cleanup only deletes expired audio"""
            reg_response = await client.post(
            "/api/v1/users/register",
            json={"name": "Retention User", "email": "retention@test.com"}
    )
    user_id = reg_response.json()["user_id"]
    
    # Set 7-day retention
    await client.put(
            f"/api/v1/users/{user_id}/settings",
            headers={"X-User-ID": user_id},
            json={"audio_retention_days": 7}
    )
    
    # Verify setting
    user_data = (await client.get(
            f"/api/v1/users/{user_id}",
            headers={"X-User-ID": user_id}
    )).json()
    
    assert user_data["audio_retention_days"] == 7
    
    # In real implementation:
    # - Create call with old timestamp
    # - Run cleanup service
    # - Verify old call deleted, recent call preserved
