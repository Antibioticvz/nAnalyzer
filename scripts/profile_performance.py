#!/usr/bin/env python3
"""
Performance profiling script for nAnalyzer backend
Profiles memory usage and execution time for key operations
"""
import os
import sys
import time
import tracemalloc
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent.parent / 'backend'
sys.path.insert(0, str(backend_path))

from app.ml.audio_processing import extract_audio_features
from app.ml.speaker_id import train_gmm_model, identify_speaker
from app.ml.transcription import transcribe_audio
from app.ml.language_detection import detect_language
from app.ml.emotion_analysis import analyze_emotion
import numpy as np
import soundfile as sf

def create_test_audio(duration_seconds=60, sample_rate=16000):
    """Create test audio data"""
    samples = int(duration_seconds * sample_rate)
    # Generate sine wave
    t = np.linspace(0, duration_seconds, samples)
    audio = np.sin(2 * np.pi * 440 * t) * 0.3  # 440 Hz sine wave
    return audio, sample_rate

def profile_function(func, name, *args, **kwargs):
    """Profile a function's execution time and memory usage"""
    print(f"\n{'='*60}")
    print(f"Profiling: {name}")
    print(f"{'='*60}")
    
    # Start memory tracking
    tracemalloc.start()
    
    # Start timing
    start_time = time.time()
    start_memory = tracemalloc.get_traced_memory()[0]
    
    try:
        # Execute function
        result = func(*args, **kwargs)
        
        # End timing
        end_time = time.time()
        current_memory, peak_memory = tracemalloc.get_traced_memory()
        
        # Calculate metrics
        execution_time = end_time - start_time
        memory_used = (current_memory - start_memory) / (1024 * 1024)  # MB
        peak_memory_mb = peak_memory / (1024 * 1024)  # MB
        
        print(f"✅ Success")
        print(f"Execution time: {execution_time:.3f}s")
        print(f"Memory used: {memory_used:.2f} MB")
        print(f"Peak memory: {peak_memory_mb:.2f} MB")
        
        # Performance warnings
        if execution_time > 5.0:
            print(f"⚠️  WARNING: Execution time exceeds 5s threshold")
        if peak_memory_mb > 500:
            print(f"⚠️  WARNING: Peak memory exceeds 500MB threshold")
            
        return result, {
            'execution_time': execution_time,
            'memory_used': memory_used,
            'peak_memory': peak_memory_mb,
            'success': True
        }
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        traceback.print_exc()
        return None, {
            'success': False,
            'error': str(e)
        }
    finally:
        tracemalloc.stop()

def main():
    """Run performance profiling"""
    print("=" * 60)
    print("nAnalyzer Performance Profiling")
    print("=" * 60)
    
    results = {}
    
    # Create test audio files
    print("\n📝 Creating test audio data...")
    short_audio, sr = create_test_audio(duration_seconds=10)  # 10 second clip
    long_audio, sr = create_test_audio(duration_seconds=60)   # 1 minute clip
    
    # Save test files
    temp_dir = backend_path / 'data' / 'temp_profile'
    temp_dir.mkdir(parents=True, exist_ok=True)
    
    short_file = temp_dir / 'test_short.wav'
    long_file = temp_dir / 'test_long.wav'
    
    sf.write(short_file, short_audio, sr)
    sf.write(long_file, long_audio, sr)
    
    print(f"✅ Created test audio files:")
    print(f"   - Short: {short_file} (10s)")
    print(f"   - Long: {long_file} (60s)")
    
    # Profile audio feature extraction
    _, results['feature_extraction_short'] = profile_function(
        extract_audio_features,
        "Audio Feature Extraction (10s)",
        str(short_file)
    )
    
    _, results['feature_extraction_long'] = profile_function(
        extract_audio_features,
        "Audio Feature Extraction (60s)",
        str(long_file)
    )
    
    # Profile transcription (if Vosk models available)
    models_dir = backend_path / 'models'
    ru_model = models_dir / 'vosk-model-small-ru-0.22'
    en_model = models_dir / 'vosk-model-small-en-us-0.15'
    
    if ru_model.exists():
        _, results['transcription_ru_short'] = profile_function(
            transcribe_audio,
            "Transcription Russian (10s)",
            str(short_file),
            'ru'
        )
        
        _, results['transcription_ru_long'] = profile_function(
            transcribe_audio,
            "Transcription Russian (60s)",
            str(long_file),
            'ru'
        )
    else:
        print("\n⚠️  Vosk Russian model not found, skipping transcription tests")
        print(f"   Download with: python backend/scripts/download_models.py")
    
    # Profile language detection
    _, results['language_detection'] = profile_function(
        detect_language,
        "Language Detection",
        str(short_file)
    )
    
    # Profile emotion analysis on extracted features
    features, _ = profile_function(
        extract_audio_features,
        "Feature Extraction for Emotion Analysis",
        str(short_file)
    )
    
    if features:
        _, results['emotion_analysis'] = profile_function(
            analyze_emotion,
            "Emotion Analysis",
            features
        )
    
    # Generate summary report
    print("\n" + "=" * 60)
    print("PERFORMANCE SUMMARY")
    print("=" * 60)
    
    print("\n📊 Execution Times:")
    for name, result in results.items():
        if result['success']:
            time_str = f"{result['execution_time']:.3f}s"
            status = "✅" if result['execution_time'] < 5.0 else "⚠️"
            print(f"  {status} {name}: {time_str}")
    
    print("\n💾 Memory Usage:")
    for name, result in results.items():
        if result['success']:
            mem_str = f"{result['peak_memory']:.2f} MB"
            status = "✅" if result['peak_memory'] < 500 else "⚠️"
            print(f"  {status} {name}: {mem_str}")
    
    print("\n🎯 Performance Targets:")
    print("  - Streaming upload: <2s per 1MB chunk")
    print("  - First segment result: <10s from upload start")
    print("  - Analysis throughput: 1:1 ratio (real-time)")
    print("  - Memory per call: <500MB")
    print("  - Concurrent uploads: 5+ users")
    
    # Recommendations
    print("\n💡 Optimization Recommendations:")
    
    any_slow = any(r.get('execution_time', 0) > 5.0 for r in results.values() if r['success'])
    any_heavy = any(r.get('peak_memory', 0) > 500 for r in results.values() if r['success'])
    
    if any_slow:
        print("  1. Consider parallel processing for long audio files")
        print("  2. Implement chunk-based processing for real-time results")
        print("  3. Cache extracted features to avoid recomputation")
    
    if any_heavy:
        print("  1. Process audio in smaller chunks to reduce memory footprint")
        print("  2. Release memory explicitly after each processing step")
        print("  3. Consider streaming processing for large files")
    
    if not any_slow and not any_heavy:
        print("  ✅ All operations meet performance targets!")
        print("  Consider:")
        print("  1. Implementing caching for frequently accessed data")
        print("  2. Adding monitoring for production workloads")
        print("  3. Load testing with multiple concurrent users")
    
    # Cleanup
    print(f"\n🧹 Cleaning up test files...")
    short_file.unlink()
    long_file.unlink()
    temp_dir.rmdir()
    print("✅ Cleanup complete")
    
    print("\n" + "=" * 60)
    print("Profiling Complete!")
    print("=" * 60)

if __name__ == '__main__':
    main()
