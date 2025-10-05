"""
Test POST /api/v1/analysis/upload endpoint
Contract test - must fail until endpoint is implemented
"""
import pytest


@pytest.mark.asyncio
async def test_initialize_upload_success(client):
    """Test initializing chunked upload"""
    # Create user first
    reg_response = await client.post(
    "/api/v1/users/register",
    json={"name": "Upload User", "email": "upload@test.com"}
    )
    user_id = reg_response.json()["user_id"]
    
    # Initialize upload
    response = await client.post(
    "/api/v1/analysis/upload",
    headers={"X-User-ID": user_id},
    json={
        "user_id": user_id,
        "filename": "test_call.wav",
        "total_size_bytes": 52428800,  # 50MB
        "metadata": {
                    "client_name": "Test Client",
                    "call_type": "demo"
        }
            }
    )
    
    assert response.status_code == 201
    data = response.json()
    assert "upload_id" in data
    assert "chunk_size" in data
    assert data["chunk_size"] == 1048576  # 1MB
    assert "call_id" in data


@pytest.mark.asyncio
async def test_initialize_upload_file_too_large(client):
    """Test initializing upload with file > 100MB"""
    reg_response = await client.post(
    "/api/v1/users/register",
    json={"name": "Upload User 2", "email": "upload2@test.com"}
    )
    user_id = reg_response.json()["user_id"]
    
    response = await client.post(
    "/api/v1/analysis/upload",
    headers={"X-User-ID": user_id},
    json={
        "user_id": user_id,
        "filename": "huge_call.wav",
        "total_size_bytes": 150000000  # 150MB
            }
    )
    
    assert response.status_code == 413  # Payload Too Large
    data = response.json()
    assert data["code"] == "AUDIO_TOO_LARGE"


@pytest.mark.asyncio
async def test_initialize_upload_missing_fields(client):
    """Test initializing upload with missing required fields"""
    reg_response = await client.post(
    "/api/v1/users/register",
    json={"name": "Upload User 3", "email": "upload3@test.com"}
    )
    user_id = reg_response.json()["user_id"]
    
    response = await client.post(
    "/api/v1/analysis/upload",
    headers={"X-User-ID": user_id},
    json={
        "user_id": user_id
                # Missing filename and total_size_bytes
            }
    )
    
    assert response.status_code == 400
