"""
Test GET /api/v1/users/{id} endpoint
Contract test - must fail until endpoint is implemented
"""
import pytest
from httpx import AsyncClient
from app.main import app


@pytest.mark.asyncio
async def test_get_user_success():
    """Test retrieving existing user"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Create user
        reg_response = await client.post(
            "/api/v1/users/register",
            json={"name": "Get Test User", "email": "gettest@test.com"}
        )
        user_id = reg_response.json()["user_id"]
        
        # Get user
        response = await client.get(
            f"/api/v1/users/{user_id}",
            headers={"X-User-ID": user_id}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["user_id"] == user_id
        assert data["name"] == "Get Test User"
        assert data["email"] == "gettest@test.com"
        assert "voice_trained" in data
        assert "audio_retention_days" in data
        assert "created_at" in data


@pytest.mark.asyncio
async def test_get_user_not_found():
    """Test retrieving non-existent user"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get(
            "/api/v1/users/nonexistent_id",
            headers={"X-User-ID": "nonexistent_id"}
        )
        
        assert response.status_code == 404
        data = response.json()
        assert "error" in data


@pytest.mark.asyncio
async def test_get_user_missing_auth_header():
    """Test retrieving user without authentication header"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/api/v1/users/some_id")
        
        assert response.status_code == 401
