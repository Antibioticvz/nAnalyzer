import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid2 as Grid,
  Paper,
  Typography,
  Box,
  Button,
  CircularProgress,
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { AudioUploader } from '../components/AudioUploader';
import MetricsCard from '../components/MetricsCard';
import { EmotionChart } from '../components/EmotionChart';
import { TranscriptView } from '../components/TranscriptView';
import AlertPopup from '../components/AlertPopup';
import { useWebSocket } from '../hooks/useWebSocket';

interface AnalysisState {
  callId: string | null;
  isAnalyzing: boolean;
  currentEmotion: {
    emotion: string;
    confidence: number;
    timestamp: string;
    speakerLabel: string;
  } | null;
  emotionHistory: Array<{
    timestamp: number;
    emotion: string;
    confidence: number;
  }>;
  segments: Array<{
    id: string;
    text: string;
    speaker: string;
    start_time: number;
    end_time: number;
    emotion: string;
    confidence: number;
  }>;
}

const AnalysisDashboard: React.FC = () => {
  const [state, setState] = useState<AnalysisState>({
    callId: null,
    isAnalyzing: false,
    currentEmotion: null,
    emotionHistory: [],
    segments: [],
  });

  const [alert, setAlert] = useState<{
    open: boolean;
    severity: 'error' | 'warning' | 'info' | 'success';
    message: string;
  }>({
    open: false,
    severity: 'info',
    message: '',
  });

  const handleWebSocketMessage = (message: any) => {
    switch (message.type) {
      case 'analysis_started':
        setState((prev) => ({ ...prev, isAnalyzing: true }));
        setAlert({
          open: true,
          severity: 'info',
          message: 'Analysis started',
        });
        break;

      case 'segment_complete':
        const segment = message.data;
        setState((prev) => ({
          ...prev,
          segments: [...prev.segments, segment],
          currentEmotion: {
            emotion: segment.emotion,
            confidence: segment.confidence,
            timestamp: new Date().toISOString(),
            speakerLabel: segment.speaker,
          },
          emotionHistory: [
            ...prev.emotionHistory,
            {
              timestamp: segment.start_time,
              emotion: segment.emotion,
              confidence: segment.confidence,
            },
          ],
        }));
        break;

      case 'analysis_complete':
        setState((prev) => ({ ...prev, isAnalyzing: false }));
        setAlert({
          open: true,
          severity: 'success',
          message: 'Analysis completed successfully',
        });
        break;

      case 'error':
        setState((prev) => ({ ...prev, isAnalyzing: false }));
        setAlert({
          open: true,
          severity: 'error',
          message: message.data.message || 'Analysis failed',
        });
        break;
    }
  };

  const { isConnected: _isConnected, lastMessage: _lastMessage } = useWebSocket({
    url: state.callId ? `ws://localhost:8000/ws/${state.callId}` : '',
    onMessage: handleWebSocketMessage,
    reconnect: true,
  });

  const handleUploadComplete = async (callId: string) => {
    setState({
      callId,
      isAnalyzing: true,
      currentEmotion: null,
      emotionHistory: [],
      segments: [],
    });

    setAlert({
      open: true,
      severity: 'info',
      message: 'Upload complete. Starting analysis...',
    });
  };

  const handleUploadError = (error: string) => {
    setAlert({
      open: true,
      severity: 'error',
      message: error,
    });
  };

  const handleReset = () => {
    setState({
      callId: null,
      isAnalyzing: false,
      currentEmotion: null,
      emotionHistory: [],
      segments: [],
    });
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            Analysis Dashboard
          </Typography>
          {state.callId && (
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleReset}
            >
              New Analysis
            </Button>
          )}
        </Box>

        <Grid container spacing={3}>
          {/* Upload Section */}
          {!state.callId && (
            <Grid item xs={12}>
              <Paper sx={{ p: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Upload Audio File
                </Typography>
                <AudioUploader
                  onUploadComplete={handleUploadComplete}
                  onUploadError={handleUploadError}
                />
              </Paper>
            </Grid>
          )}

          {/* Analysis in Progress */}
          {state.isAnalyzing && (
            <Grid item xs={12}>
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <CircularProgress size={60} sx={{ mb: 2 }} />
                <Typography variant="h6">Analyzing Audio...</Typography>
                <Typography variant="body2" color="text.secondary">
                  Processing speech, emotions, and transcription
                </Typography>
              </Paper>
            </Grid>
          )}

          {/* Current Emotion Metrics */}
          {state.currentEmotion && (
            <Grid item xs={12} md={4}>
              <MetricsCard
                emotion={state.currentEmotion.emotion}
                confidence={state.currentEmotion.confidence}
                timestamp={state.currentEmotion.timestamp}
                speakerLabel={state.currentEmotion.speakerLabel}
              />
            </Grid>
          )}

          {/* Emotion Chart */}
          {state.emotionHistory.length > 0 && (
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Emotion Timeline
                </Typography>
                <EmotionChart data={state.emotionHistory} />
              </Paper>
            </Grid>
          )}

          {/* Transcript View */}
          {state.segments.length > 0 && (
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Transcript
                </Typography>
                <TranscriptView segments={state.segments} />
              </Paper>
            </Grid>
          )}
        </Grid>

        <AlertPopup
          open={alert.open}
          severity={alert.severity}
          message={alert.message}
          onClose={() => setAlert({ ...alert, open: false })}
        />
      </Box>
    </Container>
  );
};

export default AnalysisDashboard;
