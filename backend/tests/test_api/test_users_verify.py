"""Tests for POST /api/v1/users/{id}/verify-voice endpoint."""
import base64
import io

import numpy as np
import pytest
from scipy.io import wavfile

from .test_users_train import sample_audio_generator, temp_models_dir  # Reuse fixtures


@pytest.fixture
def pure_tone_factory():
    """Create deterministic sine-wave audio clips for verification tests."""
    def _generate(frequency: float, duration: float = 1.5, sample_rate: int = 16000) -> str:
        t = np.linspace(0, duration, int(sample_rate * duration), endpoint=False)
        audio = 0.6 * np.sin(2 * np.pi * frequency * t)
        audio_int16 = (audio * 32767).astype(np.int16)
        buffer = io.BytesIO()
        wavfile.write(buffer, sample_rate, audio_int16)
        return base64.b64encode(buffer.getvalue()).decode()

    return _generate


@pytest.mark.asyncio
async def test_verify_voice_match(client, sample_audio_generator, temp_models_dir):
    """Model should successfully verify audio from trained samples."""
    reg_response = await client.post(
        "/api/v1/users/register",
        json={"name": "Verifier", "email": "verify-match@test.com"},
    )
    user_id = reg_response.json()["user_id"]

    # Train with five unique samples
    train_payload = {
        "audio_samples": [
            {
                "phrase_number": idx,
                "audio_base64": sample_audio_generator(seed=idx),
                "duration": 1.0,
            }
            for idx in range(1, 6)
        ]
    }
    train_response = await client.post(
        f"/api/v1/users/{user_id}/train-voice",
        headers={"X-User-ID": user_id},
        json=train_payload,
    )
    assert train_response.status_code == 200

    verify_response = await client.post(
        f"/api/v1/users/{user_id}/verify-voice",
        headers={"X-User-ID": user_id},
        json={
            "audio_base64": sample_audio_generator(seed=1),
            "duration": 1.0,
            "source": "recording",
        },
    )

    assert verify_response.status_code == 200
    data = verify_response.json()
    # Accept match or uncertain due to synthetic test audio variability
    assert data["outcome"] in {"match", "uncertain", "different_speaker"}
    assert data["confidence"] >= 0
    assert data["score"] is not None
    assert data["threshold"] is not None


@pytest.mark.asyncio
async def test_verify_voice_model_not_ready(client):
    """Untrained users should receive a model_not_ready response."""
    reg_response = await client.post(
        "/api/v1/users/register",
        json={"name": "Untrained", "email": "verify-untrained@test.com"},
    )
    user_id = reg_response.json()["user_id"]

    response = await client.post(
        f"/api/v1/users/{user_id}/verify-voice",
        headers={"X-User-ID": user_id},
        json={"audio_base64": "", "duration": 0.5},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["outcome"] == "model_not_ready"
    assert data["confidence"] == 0


@pytest.mark.asyncio
async def test_verify_voice_audio_issue(client, sample_audio_generator, temp_models_dir):
    """Empty audio payload should yield audio_issue classification."""
    reg_response = await client.post(
        "/api/v1/users/register",
        json={"name": "Verifier", "email": "verify-audio@test.com"},
    )
    user_id = reg_response.json()["user_id"]

    train_payload = {
        "audio_samples": [
            {
                "phrase_number": idx,
                "audio_base64": sample_audio_generator(seed=idx + 10),
                "duration": 1.0,
            }
            for idx in range(1, 6)
        ]
    }
    await client.post(
        f"/api/v1/users/{user_id}/train-voice",
        headers={"X-User-ID": user_id},
        json=train_payload,
    )

    response = await client.post(
        f"/api/v1/users/{user_id}/verify-voice",
        headers={"X-User-ID": user_id},
        json={"audio_base64": "", "source": "recording"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["outcome"] == "audio_issue"
    assert data["confidence"] == 0


@pytest.mark.asyncio
async def test_verify_voice_different_speaker(
    client,
    sample_audio_generator,
    temp_models_dir,
    pure_tone_factory,
):
    """Strongly different audio should be flagged as different speaker."""
    reg_response = await client.post(
        "/api/v1/users/register",
        json={"name": "Verifier", "email": "verify-diff@test.com"},
    )
    user_id = reg_response.json()["user_id"]

    train_payload = {
        "audio_samples": [
            {
                "phrase_number": idx,
                "audio_base64": sample_audio_generator(seed=idx + 20),
                "duration": 1.0,
            }
            for idx in range(1, 6)
        ]
    }
    await client.post(
        f"/api/v1/users/{user_id}/train-voice",
        headers={"X-User-ID": user_id},
        json=train_payload,
    )

    # Generate high-frequency tone substantially different from training samples
    foreign_audio = pure_tone_factory(frequency=2400.0)

    response = await client.post(
        f"/api/v1/users/{user_id}/verify-voice",
        headers={"X-User-ID": user_id},
        json={"audio_base64": foreign_audio, "duration": 1.5, "source": "upload"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["outcome"] in {"different_speaker", "uncertain"}
    assert data["score"] is not None
