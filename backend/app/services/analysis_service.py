"""
Analysis service - Orchestrate ML pipeline
Per spec: Audio → Lang Detection → Transcription → Speaker ID → Emotions
"""
import numpy as np
import soundfile as sf
from pathlib import Path
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta

from app.ml.audio_processing import extract_all_features
from app.ml.language_detection import detect_language
from app.ml.transcription import transcribe_audio
from app.ml.speaker_id import identify_speaker, load_model
from app.ml.emotion_analysis import analyze_emotions
from app.core.config import settings


class AnalysisService:
    """Service for orchestrating call analysis pipeline"""
    
    def __init__(self):
        self.sample_rate = settings.SAMPLE_RATE
    
    def analyze_call(
        self,
        audio_path: str,
        user_id: str,
        gmm_model_path: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Complete analysis pipeline for a call
        
        Args:
            audio_path: Path to audio file
            user_id: User ID for speaker identification
            gmm_model_path: Path to user's GMM model (if trained)
        
        Returns:
            Dictionary with language, segments, alerts
        """
        # Load audio
        audio, sample_rate = sf.read(audio_path)
        
        # Convert to mono if stereo
        if len(audio.shape) > 1:
            audio = np.mean(audio, axis=1)
        
        # Resample if needed
        if sample_rate != self.sample_rate:
            audio = self._resample_audio(audio, sample_rate, self.sample_rate)
        
        # Step 1: Detect language
        audio_bytes = (audio * 32767).astype(np.int16).tobytes()
        language = detect_language(audio_bytes, sample_rate=self.sample_rate)
        
        # Step 2: Segment audio (simple: 5-second segments)
        segments = self._segment_audio(audio, self.sample_rate)
        
        # Step 3: Load user's GMM model if available
        user_model = None
        if gmm_model_path and Path(gmm_model_path).exists():
            try:
                user_model = load_model(gmm_model_path)
            except Exception:
                pass  # Continue without speaker identification
        
        # Step 4: Process each segment
        analyzed_segments = []
        
        for i, segment_audio in enumerate(segments):
            segment_result = self._analyze_segment(
                segment_audio,
                segment_number=i,
                language=language,
                user_model=user_model,
                sample_rate=self.sample_rate
            )
            analyzed_segments.append(segment_result)
        
        # Step 5: Generate alerts
        alerts = self._generate_alerts(analyzed_segments)
        
        # Step 6: Calculate summary
        summary = self._calculate_summary(analyzed_segments)
        
        return {
            'language': language,
            'duration': len(audio) / self.sample_rate,
            'segments': analyzed_segments,
            'alerts': alerts,
            'summary': summary
        }
    
    def _segment_audio(
        self,
        audio: np.ndarray,
        sample_rate: int,
        segment_duration: float = 5.0
    ) -> List[np.ndarray]:
        """
        Split audio into fixed-duration segments
        
        Args:
            audio: Audio signal
            sample_rate: Sample rate
            segment_duration: Segment length in seconds
        
        Returns:
            List of audio segments
        """
        segment_samples = int(segment_duration * sample_rate)
        segments = []
        
        for i in range(0, len(audio), segment_samples):
            segment = audio[i:i + segment_samples]
            if len(segment) > sample_rate * 0.5:  # At least 0.5 seconds
                segments.append(segment)
        
        return segments
    
    def _analyze_segment(
        self,
        audio: np.ndarray,
        segment_number: int,
        language: str,
        user_model: Optional[Dict[str, Any]],
        sample_rate: int
    ) -> Dict[str, Any]:
        """
        Analyze single segment: transcribe, identify speaker, analyze emotions
        
        Args:
            audio: Segment audio
            segment_number: Segment index
            language: Detected language
            user_model: User's GMM model (optional)
            sample_rate: Sample rate
        
        Returns:
            Dictionary with segment analysis
        """
        # Calculate timestamps
        segment_duration = len(audio) / sample_rate
        start_time = segment_number * 5.0  # Assuming 5-second segments
        end_time = start_time + segment_duration
        
        # Transcribe
        audio_bytes = (audio * 32767).astype(np.int16).tobytes()
        transcription = transcribe_audio(audio_bytes, language=language, sample_rate=sample_rate)
        transcript = transcription.get('text', '')
        
        # Identify speaker
        speaker = 'client'  # Default
        if user_model:
            try:
                from app.ml.audio_processing import extract_mfcc
                mfcc = extract_mfcc(audio, sample_rate)
                speaker = identify_speaker(mfcc.T, user_model)
            except Exception:
                pass  # Keep default
        
        # Extract features for emotion analysis
        features = extract_all_features(audio, sample_rate)
        
        # Analyze emotions (only for client segments)
        emotions = None
        if speaker == 'client':
            emotions = analyze_emotions(features, transcript, language)
        
        return {
            'segment_number': segment_number,
            'start_time': start_time,
            'end_time': end_time,
            'speaker': speaker,
            'transcript': transcript,
            'emotions': emotions
        }
    
    def _generate_alerts(self, segments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Generate alerts based on emotion patterns
        
        Args:
            segments: List of analyzed segments
        
        Returns:
            List of alerts
        """
        alerts = []
        
        for segment in segments:
            if segment['speaker'] != 'client' or not segment.get('emotions'):
                continue
            
            emotions = segment['emotions']
            timestamp = segment['start_time']
            
            # High stress alert
            if emotions['stress'] > 7.0:
                alerts.append({
                    'timestamp': timestamp,
                    'type': 'high_stress',
                    'message': 'Клиент показывает признаки стресса',
                    'recommendation': 'Попробуйте снизить темп разговора и убедитесь, что клиент всё понимает'
                })
            
            # Low enthusiasm alert
            if emotions['enthusiasm'] < 4.0:
                alerts.append({
                    'timestamp': timestamp,
                    'type': 'low_enthusiasm',
                    'message': 'Клиент проявляет низкий уровень интереса',
                    'recommendation': 'Попробуйте задать вопросы или рассказать о преимуществах продукта'
                })
            
            # High enthusiasm (positive)
            if emotions['enthusiasm'] > 8.0:
                alerts.append({
                    'timestamp': timestamp,
                    'type': 'high_enthusiasm',
                    'message': 'Клиент проявляет высокий интерес!',
                    'recommendation': 'Хороший момент для закрытия сделки'
                })
            
            # Low agreement alert
            if emotions['agreement'] < 4.0:
                alerts.append({
                    'timestamp': timestamp,
                    'type': 'low_agreement',
                    'message': 'Клиент выражает несогласие',
                    'recommendation': 'Уточните возражения и постарайтесь их проработать'
                })
        
        return alerts
    
    def _calculate_summary(self, segments: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Calculate call summary statistics
        
        Args:
            segments: List of analyzed segments
        
        Returns:
            Summary dictionary
        """
        total_segments = len(segments)
        seller_segments = sum(1 for s in segments if s['speaker'] == 'seller')
        client_segments = sum(1 for s in segments if s['speaker'] == 'client')
        
        # Calculate average emotions for client
        client_emotions = [
            s['emotions'] for s in segments
            if s['speaker'] == 'client' and s.get('emotions')
        ]
        
        avg_emotions = None
        if client_emotions:
            avg_emotions = {
                'enthusiasm': sum(e['enthusiasm'] for e in client_emotions) / len(client_emotions),
                'agreement': sum(e['agreement'] for e in client_emotions) / len(client_emotions),
                'stress': sum(e['stress'] for e in client_emotions) / len(client_emotions)
            }
        
        return {
            'total_segments': total_segments,
            'seller_segments': seller_segments,
            'client_segments': client_segments,
            'avg_client_emotions': avg_emotions
        }
    
    def _resample_audio(
        self,
        audio: np.ndarray,
        orig_sr: int,
        target_sr: int
    ) -> np.ndarray:
        """Resample audio to target sample rate"""
        import librosa
        return librosa.resample(audio, orig_sr=orig_sr, target_sr=target_sr)


# Singleton
_analysis_service: Optional[AnalysisService] = None


def get_analysis_service() -> AnalysisService:
    """Get or create analysis service singleton"""
    global _analysis_service
    if _analysis_service is None:
        _analysis_service = AnalysisService()
    return _analysis_service
