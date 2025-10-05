"""
Test PUT /api/v1/users/{id}/settings endpoint
Contract test - must fail until endpoint is implemented
"""
import pytest
from httpx import AsyncClient
from app.main import app


@pytest.mark.asyncio
async def test_update_settings_success():
    """Test updating user settings"""
    async with AsyncClient(app=app, base_url="http://test") as client:
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
async def test_update_settings_invalid_retention():
    """Test updating with invalid retention period (> 90)"""
    async with AsyncClient(app=app, base_url="http://test") as client:
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
async def test_update_settings_min_retention():
    """Test updating with minimum retention (1 day)"""
    async with AsyncClient(app=app, base_url="http://test") as client:
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
async def test_update_settings_max_retention():
    """Test updating with maximum retention (90 days)"""
    async with AsyncClient(app=app, base_url="http://test") as client:
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
