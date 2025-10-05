import React from 'react';
import { Card, CardContent, Typography, Box, Chip } from '@mui/material';
import {
  SentimentVerySatisfied,
  SentimentSatisfied,
  SentimentNeutral,
  SentimentDissatisfied,
  SentimentVeryDissatisfied,
} from '@mui/icons-material';

export interface MetricsCardProps {
  emotion: string;
  confidence: number;
  timestamp?: string;
  speakerLabel?: string;
}

const emotionIcons: Record<string, React.ReactElement> = {
  happy: <SentimentVerySatisfied />,
  satisfied: <SentimentSatisfied />,
  neutral: <SentimentNeutral />,
  concerned: <SentimentDissatisfied />,
  frustrated: <SentimentVeryDissatisfied />,
};

const emotionColors: Record<string, string> = {
  happy: '#4caf50',
  satisfied: '#8bc34a',
  neutral: '#9e9e9e',
  concerned: '#ff9800',
  frustrated: '#f44336',
};

const MetricsCard: React.FC<MetricsCardProps> = ({
  emotion,
  confidence,
  timestamp,
  speakerLabel,
}) => {
  const icon = emotionIcons[emotion.toLowerCase()] || emotionIcons.neutral;
  const color = emotionColors[emotion.toLowerCase()] || emotionColors.neutral;

  return (
    <Card sx={{ minWidth: 275, bgcolor: 'background.paper' }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6" component="div">
            Current Emotion
          </Typography>
          {speakerLabel && (
            <Chip label={speakerLabel} size="small" variant="outlined" />
          )}
        </Box>

        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Box sx={{ color, fontSize: 48 }}>
            {icon}
          </Box>
          <Box>
            <Typography variant="h4" component="div" sx={{ color }}>
              {emotion.charAt(0).toUpperCase() + emotion.slice(1)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Confidence: {(confidence * 100).toFixed(1)}%
            </Typography>
          </Box>
        </Box>

        {timestamp && (
          <Typography variant="caption" color="text.secondary">
            Last updated: {new Date(timestamp).toLocaleTimeString()}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default MetricsCard;
