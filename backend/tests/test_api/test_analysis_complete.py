"""
Test POST /api/v1/analysis/upload/{id}/complete endpoint
Contract test - must fail until endpoint is implemented
"""
import pytest
import base64


@pytest.mark.asyncio
async def test_complete_upload_success(client):
    """Test completing upload and triggering analysis"""
    # Setup: create user, initialize upload, upload chunk
    reg_response = await client.post(
    "/api/v1/users/register",
    json={"name": "Complete User", "email": "complete@test.com"}
    )
    user_id = reg_response.json()["user_id"]
    
    init_response = await client.post(
    "/api/v1/analysis/upload",
    headers={"X-User-ID": user_id},
    json={
        "user_id": user_id,
        "filename": "call.wav",
        "total_size_bytes": 1048576
            }
    )
    upload_id = init_response.json()["upload_id"]
    
    # Upload chunk
    chunk_data = base64.b64encode(b"audio" * 1000).decode()
    await client.post(
            f"/api/v1/analysis/upload/{upload_id}/chunk",
    headers={"X-User-ID": user_id},
    json={
        "chunk_number": 0,
        "chunk_data": chunk_data,
        "is_last": True
            }
    )
    
    # Complete upload
    response = await client.post(
            f"/api/v1/analysis/upload/{upload_id}/complete",
    headers={"X-User-ID": user_id}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "call_id" in data
    assert data["status"] in ["processing", "queued"]
    assert "estimated_completion_seconds" in data


@pytest.mark.asyncio
async def test_complete_upload_not_found(client):
    """Test completing non-existent upload"""
    reg_response = await client.post(
    "/api/v1/users/register",
    json={"name": "Complete User 2", "email": "complete2@test.com"}
    )
    user_id = reg_response.json()["user_id"]
    
    response = await client.post(
    "/api/v1/analysis/upload/invalid_upload_id/complete",
    headers={"X-User-ID": user_id}
    )
    
    assert response.status_code == 404
