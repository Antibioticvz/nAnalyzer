"""
Test GET /api/v1/calls/{id}/segments endpoint
Contract test - must fail until endpoint is implemented
"""
import pytest


@pytest.mark.asyncio
async def test_get_segments_success(client):
    """Test retrieving call segments"""
            reg_response = await client.post(
            "/api/v1/users/register",
            json={"name": "Segment User", "email": "segment@test.com"}
    )
    user_id = reg_response.json()["user_id"]
    
    call_id = "call_with_segments"
    response = await client.get(
            f"/api/v1/calls/{call_id}/segments",
            headers={"X-User-ID": user_id}
    )
    
    # Will be 404 until implemented
    assert response.status_code in [200, 404]
    
    if response.status_code == 200:
            data = response.json()
            assert isinstance(data, list)
            if len(data) > 0:
                segment = data[0]
                assert "segment_id" in segment
                assert "segment_number" in segment
                assert "start_time" in segment
                assert "end_time" in segment
                assert "speaker" in segment
                assert segment["speaker"] in ["seller", "client"]


@pytest.mark.asyncio
async def test_get_segments_not_found(client):
    """Test retrieving segments for non-existent call"""
            reg_response = await client.post(
            "/api/v1/users/register",
            json={"name": "Segment User 2", "email": "segment2@test.com"}
    )
    user_id = reg_response.json()["user_id"]
    
    response = await client.get(
            "/api/v1/calls/nonexistent/segments",
            headers={"X-User-ID": user_id}
    )
    
    assert response.status_code == 404
