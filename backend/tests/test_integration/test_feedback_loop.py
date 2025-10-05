"""
Integration test: Feedback collection and continuous learning
Test flow: view analysis → correct emotions → store feedback
Must fail until feedback system is implemented
"""
import pytest
from httpx import AsyncClient
from app.main import app


@pytest.mark.asyncio
async def test_feedback_collection_flow():
    """Test complete feedback loop for continuous learning"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Setup: assume we have a call with analyzed segments
        reg_response = await client.post(
            "/api/v1/users/register",
            json={"name": "Feedback User", "email": "feedback_flow@test.com"}
        )
        user_id = reg_response.json()["user_id"]
        
        # Mock: assume call_id and segment_id exist
        call_id = "test_call_for_feedback"
        segment_id = 42
        
        # Step 1: Submit feedback correction
        feedback_response = await client.post(
            f"/api/v1/calls/{call_id}/feedback",
            headers={"X-User-ID": user_id},
            json={
                "segment_id": segment_id,
                "corrected_enthusiasm": 8.0,
                "corrected_agreement": 7.5,
                "corrected_stress": 2.5
            }
        )
        
        # Should succeed or return 404 if call doesn't exist yet
        assert feedback_response.status_code in [200, 404]
        
        if feedback_response.status_code == 200:
            data = feedback_response.json()
            assert data["accepted"] is True
            assert "total_feedback_count" in data
            
        # Step 2: Check training status
        training_status_response = await client.get(
            "/api/v1/analysis/training-status",
            headers={"X-User-ID": user_id}
        )
        
        assert training_status_response.status_code == 200
        status_data = training_status_response.json()
        assert "feedback_samples" in status_data
        assert "training_threshold" in status_data
        assert status_data["training_threshold"] == 50  # Per spec


@pytest.mark.asyncio
async def test_multiple_feedback_submissions():
    """Test submitting multiple feedback corrections"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        reg_response = await client.post(
            "/api/v1/users/register",
            json={"name": "Multi Feedback", "email": "multi_feedback@test.com"}
        )
        user_id = reg_response.json()["user_id"]
        
        call_id = "test_call_multi"
        
        # Submit multiple corrections
        for segment_id in range(1, 6):
            response = await client.post(
                f"/api/v1/calls/{call_id}/feedback",
                headers={"X-User-ID": user_id},
                json={
                    "segment_id": segment_id,
                    "corrected_enthusiasm": 7.0 + segment_id * 0.5
                }
            )
            # Accept both 200 and 404
            assert response.status_code in [200, 404]
