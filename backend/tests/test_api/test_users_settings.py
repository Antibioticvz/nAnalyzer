"""
Test PUT /api/v1/users/{id}/settings endpoint
Contract test - must fail until endpoint is implemented
"""
import pytest


@pytest.mark.asyncio
async def test_update_settings_success(client):
    """Test updating user settings"""
    # Create user
    reg_response = await client.post(
    "/api/v1/users/register",
    json={"name": "Settings User", "email": "settings@test.com"}
    )
    user_id = reg_response.json()["user_id"]
    
    # Update retention period
    response = await client.put(
            f"/api/v1/users/{user_id}/settings",
    headers={"X-User-ID": user_id},
    json={"audio_retention_days": 30}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["user_id"] == user_id
    assert data["audio_retention_days"] == 30
    assert "updated_at" in data


@pytest.mark.asyncio
async def test_update_settings_invalid_retention(client):
    """Test updating with invalid retention period (> 90)"""
    reg_response = await client.post(
    "/api/v1/users/register",
    json={"name": "Settings User 2", "email": "settings2@test.com"}
    )
    user_id = reg_response.json()["user_id"]
    
    response = await client.put(
            f"/api/v1/users/{user_id}/settings",
    headers={"X-User-ID": user_id},
    json={"audio_retention_days": 100}
    )
    
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_update_settings_min_retention(client):
    """Test updating with minimum retention (1 day)"""
    reg_response = await client.post(
    "/api/v1/users/register",
    json={"name": "Settings User 3", "email": "settings3@test.com"}
    )
    user_id = reg_response.json()["user_id"]
    
    response = await client.put(
            f"/api/v1/users/{user_id}/settings",
    headers={"X-User-ID": user_id},
    json={"audio_retention_days": 1}
    )
    
    assert response.status_code == 200
    assert response.json()["audio_retention_days"] == 1


@pytest.mark.asyncio
async def test_update_settings_max_retention(client):
    """Test updating with maximum retention (90 days)"""
    reg_response = await client.post(
    "/api/v1/users/register",
    json={"name": "Settings User 4", "email": "settings4@test.com"}
    )
    user_id = reg_response.json()["user_id"]
    
    response = await client.put(
            f"/api/v1/users/{user_id}/settings",
    headers={"X-User-ID": user_id},
    json={"audio_retention_days": 90}
    )
    
    assert response.status_code == 200
    assert response.json()["audio_retention_days"] == 90
