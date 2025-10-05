"""
Basic tests for audio capture module
"""
import pytest
from app.modules.audio import AudioCaptureModule, AudioSource


@pytest.mark.asyncio
async def test_audio_capture_start():
    """Test starting audio capture"""
    module = AudioCaptureModule()
    source = AudioSource(type="microphone")
    
    stream_id = await module.start_capture(source)
    
    assert stream_id is not None
    assert stream_id in module.active_streams
    assert module.active_streams[stream_id] is True


@pytest.mark.asyncio
async def test_audio_capture_stop():
    """Test stopping audio capture"""
    module = AudioCaptureModule()
    source = AudioSource(type="microphone")
    
    stream_id = await module.start_capture(source)
    await module.stop_capture(stream_id)
    
    assert module.active_streams[stream_id] is False


@pytest.mark.asyncio
async def test_audio_stream_generation():
    """Test audio stream generation"""
    module = AudioCaptureModule()
    source = AudioSource(type="microphone")
    
    stream_id = await module.start_capture(source)
    
    chunk_count = 0
    async for chunk in module.get_audio_stream(stream_id):
        chunk_count += 1
        assert chunk.data is not None
        assert chunk.sample_rate == 16000
        
        if chunk_count >= 3:  # Test a few chunks
            await module.stop_capture(stream_id)
            break
    
    assert chunk_count >= 3
