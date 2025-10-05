"""
Test GET /api/v1/calls endpoint
Contract test - must fail until endpoint is implemented
"""
import pytest


@pytest.mark.asyncio
async def test_list_calls_success(client):
    """Test listing user's calls"""
            # Create user
    reg_response = await client.post(
            "/api/v1/users/register",
            json={"name": "List User", "email": "list@test.com"}
    )
    user_id = reg_response.json()["user_id"]
    
    # Get calls list
    response = await client.get(
            "/api/v1/calls",
            headers={"X-User-ID": user_id}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "data" in data
    assert "pagination" in data
    assert isinstance(data["data"], list)
    assert "next_cursor" in data["pagination"]
    assert "has_more" in data["pagination"]
    assert "total" in data["pagination"]


@pytest.mark.asyncio
async def test_list_calls_with_pagination(client):
    """Test listing calls with pagination parameters"""
            reg_response = await client.post(
            "/api/v1/users/register",
            json={"name": "List User 2", "email": "list2@test.com"}
    )
    user_id = reg_response.json()["user_id"]
    
    response = await client.get(
            "/api/v1/calls?limit=10&cursor=some_cursor",
            headers={"X-User-ID": user_id}
    )
    
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_list_calls_unauthorized(client):
    """Test listing calls without authentication"""
            response = await client.get("/api/v1/calls")
    
    assert response.status_code == 401
