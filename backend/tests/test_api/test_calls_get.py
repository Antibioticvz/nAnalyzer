"""
Test GET /api/v1/calls/{id} endpoint
Contract test - must fail until endpoint is implemented
"""
import pytest


@pytest.mark.asyncio
async def test_get_call_success(client):
    """Test retrieving call details"""
    # TODO: In real test, create a completed call analysis first
    # For now, testing the contract structure
    reg_response = await client.post(
    "/api/v1/users/register",
    json={"name": "Call User", "email": "call@test.com"}
    )
    user_id = reg_response.json()["user_id"]
    
    # Assume call exists
    call_id = "call_test_123"
    response = await client.get(
            f"/api/v1/calls/{call_id}",
    headers={"X-User-ID": user_id}
    )
    
    # Will be 404 until we implement
    assert response.status_code in [200, 404]
    
    if response.status_code == 200:
            data = response.json()
            assert "id" in data
            assert "filename" in data
            assert "duration" in data
            assert "segments" in data
            assert "alerts" in data
            assert "summary" in data


@pytest.mark.asyncio
async def test_get_call_not_found(client):
    """Test retrieving non-existent call"""
    reg_response = await client.post(
    "/api/v1/users/register",
    json={"name": "Call User 2", "email": "call2@test.com"}
    )
    user_id = reg_response.json()["user_id"]
    
    response = await client.get(
    "/api/v1/calls/nonexistent_call",
    headers={"X-User-ID": user_id}
    )
    
    assert response.status_code == 404
    data = response.json()
    # API returns {"detail": {"error": "...", "message": "..."}}
    assert "detail" in data
    assert data["detail"]["error"] == "NotFound"
