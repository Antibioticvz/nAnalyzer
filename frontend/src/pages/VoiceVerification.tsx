import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline"
import CloudUploadIcon from "@mui/icons-material/CloudUpload"
import GraphicEqIcon from "@mui/icons-material/GraphicEq"
import HelpOutlineIcon from "@mui/icons-material/HelpOutline"
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined"
import WarningAmberIcon from "@mui/icons-material/WarningAmber"
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material"
import React, { useCallback, useEffect, useMemo, useState } from "react"
import { VoiceRecorder } from "../components/VoiceRecorder"
import { useAuth } from "../contexts/AuthContext"
import { usersAPI } from "../services/usersAPI"
import {
  VoiceVerificationOutcome,
  VoiceVerificationRequest,
  VoiceVerificationResponse,
} from "../types/api"
import { convertRecordingToBase64 } from "../utils/audio"

const OUTCOME_ICONS: Record<VoiceVerificationOutcome, React.ReactNode> = {
  match: <CheckCircleOutlineIcon fontSize="large" color="success" />,
  uncertain: <HelpOutlineIcon fontSize="large" color="warning" />,
  different_speaker: <WarningAmberIcon fontSize="large" color="error" />,
  audio_issue: <InfoOutlinedIcon fontSize="large" color="info" />,
  model_not_ready: <InfoOutlinedIcon fontSize="large" color="info" />,
}

const OUTCOME_COLORS: Record<VoiceVerificationOutcome, string> = {
  match: "success.main",
  uncertain: "warning.main",
  different_speaker: "error.main",
  audio_issue: "info.main",
  model_not_ready: "info.main",
}

const OUTCOME_LABELS: Record<VoiceVerificationOutcome, string> = {
  match: "Confident match",
  uncertain: "Borderline",
  different_speaker: "Different speaker",
  audio_issue: "Audio issue",
  model_not_ready: "Model not ready",
}

type VerificationMode = "record" | "upload"

const VoiceVerification: React.FC = () => {
  const { user, userId } = useAuth()
  const [mode, setMode] = useState<VerificationMode>("record")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [result, setResult] = useState<VoiceVerificationResponse | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isTrained = Boolean(user?.voice_trained)

  useEffect(() => {
    return () => {
      if (filePreview) {
        URL.revokeObjectURL(filePreview)
      }
    }
  }, [filePreview])

  const resolvedUserId = userId || user?.user_id || null

  const handleSubmit = useCallback(
    async (payload: VoiceVerificationRequest) => {
      if (!resolvedUserId) {
        setError("No user session detected. Please log in again.")
        return
      }
      setIsSubmitting(true)
      setError(null)

      try {
        const response = await usersAPI.verifyVoice(resolvedUserId, payload)
        setResult(response)
      } catch (submissionError: any) {
        const backendMessage =
          submissionError?.response?.data?.detail?.message ||
          submissionError?.message ||
          "Verification failed. Please try again."
        setError(backendMessage)
        setResult(null)
      } finally {
        setIsSubmitting(false)
      }
    },
    [resolvedUserId]
  )

  const handleRecordingComplete = async (blob: Blob, duration: number) => {
    const normalized = await convertRecordingToBase64(blob, duration)
    await handleSubmit({
      audio_base64: normalized.base64,
      duration: normalized.duration || duration,
      source: "recording",
    })
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    setResult(null)
    setError(null)

    if (file) {
      const validTypes = ["audio/wav", "audio/mpeg", "audio/mp3", "audio/x-wav"]
      const extensionMatches = /\.(wav|mp3|mpeg)$/i.test(file.name)

      if (!validTypes.includes(file.type) && !extensionMatches) {
        setError("Invalid format. Please choose a WAV or MP3 file.")
        event.target.value = ""
        return
      }

      const maxSizeBytes = 100 * 1024 * 1024
      if (file.size > maxSizeBytes) {
        setError("File is too large. The maximum supported size is 100MB.")
        event.target.value = ""
        return
      }

      if (filePreview) {
        URL.revokeObjectURL(filePreview)
      }
      const previewUrl = URL.createObjectURL(file)
      setFilePreview(previewUrl)
      setSelectedFile(file)
    } else {
      setSelectedFile(null)
      setFilePreview(null)
    }

    event.target.value = ""
  }

  const handleFileVerification = async () => {
    if (!selectedFile) return

    const normalized = await convertRecordingToBase64(selectedFile)
    await handleSubmit({
      audio_base64: normalized.base64,
      duration: normalized.duration || undefined,
      source: "upload",
      filename: selectedFile.name,
    })
  }

  const handleClearFile = () => {
    if (filePreview) {
      URL.revokeObjectURL(filePreview)
    }
    setSelectedFile(null)
    setFilePreview(null)
  }

  const outcomeColor = result ? OUTCOME_COLORS[result.outcome] : undefined
  const outcomeLabel = result ? OUTCOME_LABELS[result.outcome] : undefined
  const outcomeIcon = result ? OUTCOME_ICONS[result.outcome] : null

  const disableActions = !isTrained || isSubmitting

  const modeTabs = useMemo(
    () => (
      <Tabs
        value={mode}
        onChange={(_, newValue) => setMode(newValue as VerificationMode)}
        sx={{ mb: 3 }}
        aria-label="Verification input mode"
      >
        <Tab value="record" icon={<GraphicEqIcon />} iconPosition="start" label="Record live" />
        <Tab value="upload" icon={<CloudUploadIcon />} iconPosition="start" label="Upload file" />
      </Tabs>
    ),
    [mode]
  )

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Test your voice model
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Record a fresh snippet or upload an existing call sample to see how confidently nAnalyzer
            recognises your voice. Great for sanity-checking diarization before analysing important calls.
          </Typography>
        </Box>

        {!isTrained && (
          <Alert severity="info">
            Finish voice training to unlock live verification. Once trained, you can come back here to validate
            new recordings and adjust thresholds if needed.
          </Alert>
        )}

        <Paper elevation={2} sx={{ p: 3 }}>
          {modeTabs}

          {mode === "record" ? (
            <VoiceRecorder
              phraseNumber={1}
              phraseText="Speak naturally for 5-10 seconds so we can verify your voice signature."
              onRecordingComplete={handleRecordingComplete}
              disabled={disableActions}
            />
          ) : (
            <Stack spacing={2}>
              <Typography variant="body1" color="text.secondary">
                Choose a WAV or MP3 clip with your voice. We resample to 16kHz automatically and compare it
                against your trained model.
              </Typography>
              <Button
                variant="contained"
                component="label"
                startIcon={<CloudUploadIcon />}
                disabled={disableActions}
              >
                Select audio file
                <input
                  type="file"
                  hidden
                  accept="audio/*"
                  aria-label="Upload audio file"
                  onChange={handleFileSelect}
                />
              </Button>
              {selectedFile && (
                <Box sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider", p: 2 }}>
                  <Stack spacing={1}>
                    <Typography variant="subtitle1">{selectedFile.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </Typography>
                    {filePreview && (
                      <audio src={filePreview} controls style={{ width: "100%" }} />
                    )}
                    <Stack direction="row" spacing={1}>
                      <Button
                        variant="contained"
                        onClick={handleFileVerification}
                        disabled={disableActions}
                      >
                        Run verification
                      </Button>
                      <Button variant="outlined" onClick={handleClearFile} disabled={isSubmitting}>
                        Clear
                      </Button>
                    </Stack>
                  </Stack>
                </Box>
              )}
            </Stack>
          )}
        </Paper>

        {isSubmitting && (
          <Paper elevation={0} sx={{ p: 3, textAlign: "center" }}>
            <CircularProgress />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Analyzing audio sample…
            </Typography>
          </Paper>
        )}

        {error && <Alert severity="error">{error}</Alert>}

        {result && (
          <Paper elevation={3} sx={{ p: 3, borderLeft: `4px solid`, borderColor: outcomeColor }}>
            <Stack direction="row" spacing={2} alignItems="center">
              {outcomeIcon}
              <Box>
                <Typography variant="h6" sx={{ color: outcomeColor }}>
                  {result.message}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {result.details}
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  <Chip
                    label={outcomeLabel}
                    color={
                      result.outcome === "match"
                        ? "success"
                        : result.outcome === "different_speaker"
                        ? "error"
                        : result.outcome === "uncertain"
                        ? "warning"
                        : "info"
                    }
                  />
                  <Chip
                    label={`Confidence ${(result.confidence * 100).toFixed(0)}%`}
                    variant="outlined"
                    color="default"
                  />
                </Stack>
              </Box>
            </Stack>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" gutterBottom>
              Next suggestions
            </Typography>
            <Stack spacing={1}>
              {result.recommendations.map(recommendation => (
                <Typography key={recommendation} variant="body2">
                  • {recommendation}
                </Typography>
              ))}
            </Stack>
          </Paper>
        )}
      </Stack>
    </Container>
  )
}

export default VoiceVerification
