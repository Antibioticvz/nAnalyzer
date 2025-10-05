import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  LinearProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { VoiceRecorder } from '../components/VoiceRecorder';
import api from '../services/apiClient';

const TRAINING_PHRASES = [
  'Hello, how are you today?',
  'I would like to discuss our product offerings.',
  'Can you tell me more about your needs?',
  'Let me explain the pricing structure.',
  'Thank you for your time and interest.',
  'I appreciate your feedback on this matter.',
  'We can schedule a follow-up call next week.',
  'Is there anything else I can help you with?',
];

const VoiceTraining: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [currentPhrase, setCurrentPhrase] = useState(0);
  const [recordings, setRecordings] = useState<Blob[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRecordingComplete = (blob: Blob) => {
    setRecordings([...recordings, blob]);
    
    if (currentPhrase < TRAINING_PHRASES.length - 1) {
      setCurrentPhrase(currentPhrase + 1);
    }
  };

  const handleRetake = () => {
    const newRecordings = [...recordings];
    newRecordings.pop();
    setRecordings(newRecordings);
    if (currentPhrase > 0) {
      setCurrentPhrase(currentPhrase - 1);
    }
  };

  const handleSubmit = async () => {
    if (recordings.length !== TRAINING_PHRASES.length) {
      setError('Please complete all voice training recordings');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      recordings.forEach((blob, index) => {
        formData.append(`recordings`, blob, `phrase_${index}.wav`);
      });

      await api.post(`/api/v1/users/${userId}/train-voice`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      navigate('/dashboard');
    } catch (err: any) {
      setError(
        err.response?.data?.detail || 'Failed to train voice model. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = (recordings.length / TRAINING_PHRASES.length) * 100;

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Voice Training
          </Typography>
          <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
            Record yourself reading each phrase to train the speaker identification system
          </Typography>

          <LinearProgress variant="determinate" value={progress} sx={{ mb: 3 }} />
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 4 }}>
            Progress: {recordings.length} of {TRAINING_PHRASES.length} phrases completed
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Stepper activeStep={currentPhrase} alternativeLabel sx={{ mb: 4 }}>
            {TRAINING_PHRASES.map((_, index) => (
              <Step key={index}>
                <StepLabel>Phrase {index + 1}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {recordings.length < TRAINING_PHRASES.length ? (
            <Box>
              <Paper
                variant="outlined"
                sx={{
                  p: 3,
                  mb: 3,
                  bgcolor: 'primary.light',
                  color: 'primary.contrastText',
                }}
              >
                <Typography variant="h6" align="center">
                  Phrase {currentPhrase + 1}:
                </Typography>
                <Typography variant="h5" align="center" sx={{ mt: 1, fontWeight: 'bold' }}>
                  "{TRAINING_PHRASES[currentPhrase]}"
                </Typography>
              </Paper>

              <VoiceRecorder
                onRecordingComplete={handleRecordingComplete}
              />

              {recordings.length > 0 && (
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                  <Button variant="outlined" onClick={handleRetake}>
                    Re-record Previous Phrase
                  </Button>
                </Box>
              )}
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center' }}>
              <Alert severity="success" sx={{ mb: 3 }}>
                All phrases recorded successfully! You can now submit your voice training.
              </Alert>
              <Button
                variant="contained"
                size="large"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Training Voice Model...' : 'Complete Training'}
              </Button>
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default VoiceTraining;
