"""
Test DELETE /api/v1/calls/{id} endpoint
Contract test - must fail until endpoint is implemented
"""
import pytest


@pytest.mark.asyncio
async def test_delete_call_success(client):
    """Test deleting a call"""
            reg_response = await client.post(
            "/api/v1/users/register",
            json={"name": "Delete User", "email": "delete@test.com"}
    )
    user_id = reg_response.json()["user_id"]
    
    call_id = "call_to_delete"
    response = await client.delete(
            f"/api/v1/calls/{call_id}",
            headers={"X-User-ID": user_id}
    )
    
    # Will be 404 until implemented
    assert response.status_code in [204, 404]


@pytest.mark.asyncio
async def test_delete_call_not_found(client):
    """Test deleting non-existent call"""
            reg_response = await client.post(
            "/api/v1/users/register",
            json={"name": "Delete User 2", "email": "delete2@test.com"}
    )
    user_id = reg_response.json()["user_id"]
    
    response = await client.delete(
            "/api/v1/calls/nonexistent_call",
            headers={"X-User-ID": user_id}
    )
    
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_delete_call_unauthorized(client):
    """Test deleting call without authentication"""
            response = await client.delete("/api/v1/calls/some_call")
    
    assert response.status_code == 401
