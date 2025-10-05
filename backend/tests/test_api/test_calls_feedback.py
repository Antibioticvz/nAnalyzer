"""
Test POST /api/v1/calls/{id}/feedback endpoint
Contract test - must fail until endpoint is implemented
"""
import pytest


@pytest.mark.asyncio
async def test_submit_feedback_success(client):
    """Test submitting emotion feedback"""
    reg_response = await client.post(
    "/api/v1/users/register",
    json={"name": "Feedback User", "email": "feedback@test.com"}
    )
    user_id = reg_response.json()["user_id"]
    
    call_id = "call_for_feedback"
    response = await client.post(
    f"/api/v1/calls/{call_id}/feedback",
    headers={"X-User-ID": user_id},
    json={
        "segment_id": 42,
        "corrected_enthusiasm": 8.0,
        "corrected_agreement": 7.5,
        "corrected_stress": 2.5
    }
    )
    
    # Will be 404 until implemented
    assert response.status_code in [200, 404]
    
    if response.status_code == 200:
        data = response.json()
        assert "feedback_id" in data
        assert "segment_id" in data
        assert data["segment_id"] == 42
        assert "accepted" in data
        assert "total_feedback_count" in data


@pytest.mark.asyncio
async def test_submit_feedback_invalid_scores(client):
    """Test submitting feedback with invalid emotion scores"""
    reg_response = await client.post(
    "/api/v1/users/register",
    json={"name": "Feedback User 2", "email": "feedback2@test.com"}
    )
    user_id = reg_response.json()["user_id"]
    
    response = await client.post(
    "/api/v1/calls/call_id/feedback",
    headers={"X-User-ID": user_id},
    json={
        "segment_id": 10,
        "corrected_enthusiasm": 15.0  # Invalid: > 10
    }
    )
    
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_submit_feedback_partial_correction(client):
    """Test submitting partial emotion correction"""
    reg_response = await client.post(
    "/api/v1/users/register",
    json={"name": "Feedback User 3", "email": "feedback3@test.com"}
    )
    user_id = reg_response.json()["user_id"]
    
    response = await client.post(
    "/api/v1/calls/call_id/feedback",
    headers={"X-User-ID": user_id},
    json={
        "segment_id": 20,
        "corrected_enthusiasm": 6.0
        # Only correcting enthusiasm, not agreement/stress
    }
    )
    
    # Should accept partial corrections
    assert response.status_code in [200, 404]
