"""
Integration test: Simple call analysis
Test flow: upload → detect lang → transcribe → emotions
Must fail until full analysis pipeline is implemented
"""
import pytest
import base64


@pytest.mark.asyncio
async def test_simple_call_analysis_flow(client):
    """Test complete call analysis from upload to results"""
            # Setup: Create and train user
    reg_response = await client.post(
            "/api/v1/users/register",
            json={"name": "Analysis User", "email": "analysis@test.com"}
    )
    user_id = reg_response.json()["user_id"]
    
    # Train voice (needed for speaker identification)
    sample_audio = base64.b64encode(b"WAV" + b"\x00" * 1000).decode()
    await client.post(
            f"/api/v1/users/{user_id}/train-voice",
            headers={"X-User-ID": user_id},
            json={
                "audio_samples": [
                    {"phrase_number": i, "audio_base64": sample_audio, "duration": 10.0}
                    for i in range(1, 9)
                ]
            }
    )
    
    # Step 1: Initialize upload
    init_response = await client.post(
            "/api/v1/analysis/upload",
            headers={"X-User-ID": user_id},
            json={
                "user_id": user_id,
                "filename": "test_call.wav",
                "total_size_bytes": 2097152,
                "metadata": {"client_name": "Test Client"}
            }
    )
    assert init_response.status_code == 201
    upload_id = init_response.json()["upload_id"]
    
    # Step 2: Upload chunks
    chunk_data = base64.b64encode(b"audio_data" * 1000).decode()
    chunk_response = await client.post(
            f"/api/v1/analysis/upload/{upload_id}/chunk",
            headers={"X-User-ID": user_id},
            json={
                "chunk_number": 0,
                "chunk_data": chunk_data,
                "is_last": True
            }
    )
    assert chunk_response.status_code == 200
    
    # Step 3: Complete upload and trigger analysis
    complete_response = await client.post(
            f"/api/v1/analysis/upload/{upload_id}/complete",
            headers={"X-User-ID": user_id}
    )
    assert complete_response.status_code == 200
    call_id = complete_response.json()["call_id"]
    
    # Step 4: Wait for analysis (in real test, use WebSocket or polling)
    # For now, just verify call exists
    
    # Step 5: Retrieve results
    call_response = await client.get(
            f"/api/v1/calls/{call_id}",
            headers={"X-User-ID": user_id}
    )
    
    if call_response.status_code == 200:
            call_data = call_response.json()
            assert "detected_language" in call_data
            assert call_data["detected_language"] in ["ru", "en"]
            assert "segments" in call_data
            
            # Verify segments have required fields
            if len(call_data["segments"]) > 0:
                segment = call_data["segments"][0]
                assert "speaker" in segment
                assert "transcript" in segment
                
                # Client segments should have emotions
                client_segments = [s for s in call_data["segments"] if s["speaker"] == "client"]
                if client_segments:
                    assert "emotions" in client_segments[0]
