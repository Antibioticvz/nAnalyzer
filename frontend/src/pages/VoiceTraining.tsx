import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline"
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline"
import ReplayIcon from "@mui/icons-material/Replay"
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Paper,
  Step,
  StepButton,
  Stepper,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material"
import React, { useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { VoiceRecorder } from "../components/VoiceRecorder"
import { useAuth } from "../contexts/AuthContext"
import { usersAPI } from "../services/usersAPI"
import { VoiceTrainingSample } from "../types/api"

interface TrainingPhrase {
  id: string
  text: string
  isCustom?: boolean
}

interface RecordingEntry {
  base64: string
  duration: number
  createdAt: number
}

const TARGET_SAMPLE_RATE = 16000

const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result
      if (typeof result === "string") {
        const base64 = result.split(",").pop() || ""
        resolve(base64)
      } else {
        reject(new Error("Failed to encode recording"))
      }
    }
    reader.onerror = () => reject(new Error("Failed to process recording"))
    reader.readAsDataURL(blob)
  })

const writeString = (view: DataView, offset: number, data: string) => {
  for (let i = 0; i < data.length; i += 1) {
    view.setUint8(offset + i, data.charCodeAt(i))
  }
}

const encodeWavBuffer = (audioBuffer: AudioBuffer) => {
  const { numberOfChannels, sampleRate, length } = audioBuffer
  const bytesPerSample = 2
  const dataSize = length * numberOfChannels * bytesPerSample
  const buffer = new ArrayBuffer(44 + dataSize)
  const view = new DataView(buffer)

  writeString(view, 0, "RIFF")
  view.setUint32(4, 36 + dataSize, true)
  writeString(view, 8, "WAVE")
  writeString(view, 12, "fmt ")
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true) // PCM
  view.setUint16(22, numberOfChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * numberOfChannels * bytesPerSample, true)
  view.setUint16(32, numberOfChannels * bytesPerSample, true)
  view.setUint16(34, bytesPerSample * 8, true)
  writeString(view, 36, "data")
  view.setUint32(40, dataSize, true)

  let offset = 44
  const channelData: Float32Array[] = []
  for (let channel = 0; channel < numberOfChannels; channel += 1) {
    channelData.push(audioBuffer.getChannelData(channel))
  }

  for (let i = 0; i < length; i += 1) {
    for (let channel = 0; channel < numberOfChannels; channel += 1) {
      let sample = channelData[channel][i]
      sample = Math.max(-1, Math.min(1, sample))
      view.setInt16(
        offset,
        sample < 0 ? sample * 0x8000 : sample * 0x7fff,
        true
      )
      offset += 2
    }
  }

  return buffer
}

const convertRecordingToBase64 = async (
  blob: Blob,
  duration: number
): Promise<{ base64: string; duration: number }> => {
  if (typeof window === "undefined") {
    return { base64: await blobToBase64(blob), duration }
  }

  const globalWindow = window as typeof window & {
    webkitAudioContext?: typeof AudioContext
    webkitOfflineAudioContext?: typeof OfflineAudioContext
  }

  const AudioContextClass =
    globalWindow.AudioContext || globalWindow.webkitAudioContext
  const OfflineAudioContextClass =
    globalWindow.OfflineAudioContext || globalWindow.webkitOfflineAudioContext

  if (!AudioContextClass || !OfflineAudioContextClass) {
    return { base64: await blobToBase64(blob), duration }
  }

  const audioContext = new AudioContextClass()

  try {
    const arrayBuffer = await blob.arrayBuffer()
    const decodedBuffer = await audioContext.decodeAudioData(arrayBuffer)
    const offlineContext = new OfflineAudioContextClass(
      decodedBuffer.numberOfChannels,
      Math.ceil(decodedBuffer.duration * TARGET_SAMPLE_RATE),
      TARGET_SAMPLE_RATE
    )

    const source = offlineContext.createBufferSource()
    source.buffer = decodedBuffer
    source.connect(offlineContext.destination)
    source.start(0)

    const renderedBuffer = await offlineContext.startRendering()
    const wavBuffer = encodeWavBuffer(renderedBuffer)
    const wavBlob = new Blob([wavBuffer], { type: "audio/wav" })
    const base64 = await blobToBase64(wavBlob)
    await audioContext.close()

    return { base64, duration: renderedBuffer.duration }
  } catch (conversionError) {
    try {
      await audioContext.close()
    } catch (closeError) {
      // ignore close errors
    }
    return { base64: await blobToBase64(blob), duration }
  }
}

const TRAINING_PHRASES = [
  "Hello, how are you today?",
  "I would like to discuss our product offerings.",
  "Can you tell me more about your needs?",
  "Let me explain the pricing structure.",
  "Thank you for your time and interest.",
  "I appreciate your feedback on this matter.",
  "We can schedule a follow-up call next week.",
  "Is there anything else I can help you with?",
]

const VoiceTraining: React.FC = () => {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const { user: authUser, userId: authUserId } = useAuth()

  const resolvedUserId = useMemo(() => {
    if (userId === "me") {
      return authUserId || null
    }
    return userId || authUserId || null
  }, [authUserId, userId])

  const [phrases, setPhrases] = useState<TrainingPhrase[]>(() =>
    TRAINING_PHRASES.map((text, index) => ({
      id: `builtin-${index + 1}`,
      text,
    }))
  )
  const [currentStep, setCurrentStep] = useState(0)
  const [recordings, setRecordings] = useState<Record<string, RecordingEntry>>(
    {}
  )
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [customPhraseText, setCustomPhraseText] = useState("")
  const [customPhraseError, setCustomPhraseError] = useState<string | null>(
    null
  )

  const maxSamples = 10
  const recordedCount = Object.keys(recordings).length
  const progress = (recordedCount / Math.max(phrases.length, 1)) * 100
  const minSamplesMet = recordedCount >= 5
  const canSubmit = Boolean(
    resolvedUserId && minSamplesMet && recordedCount <= maxSamples
  )

  const isRetrainingFlow = Boolean(authUser?.voice_trained)

  const handleRecordingComplete = async (blob: Blob, duration: number) => {
    const phrase = phrases[currentStep]
    if (!phrase) {
      return
    }

    try {
      setError(null)
      setSuccess(null)
      const { base64, duration: normalizedDuration } =
        await convertRecordingToBase64(blob, duration)
      const effectiveDuration = Number.isFinite(normalizedDuration)
        ? normalizedDuration
        : duration
      setRecordings(prev => ({
        ...prev,
        [phrase.id]: {
          base64,
          duration: effectiveDuration,
          createdAt: Date.now(),
        },
      }))

      if (currentStep < phrases.length - 1) {
        setCurrentStep(currentStep + 1)
      }
    } catch (encodeError) {
      setError(
        encodeError instanceof Error
          ? encodeError.message
          : "Unable to save recording"
      )
    }
  }

  const handleRemoveRecording = (phraseId: string) => {
    setRecordings(prev => {
      if (!(phraseId in prev)) return prev
      const { [phraseId]: _removed, ...rest } = prev
      return rest
    })
    setSuccess(null)
  }

  const handleNavigateStep = (step: number) => {
    setCurrentStep(step)
    setError(null)
  }

  const handleNextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, phrases.length - 1))
  }

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0))
  }

  const handleOpenAddDialog = () => {
    setCustomPhraseText("")
    setCustomPhraseError(null)
    setIsAddDialogOpen(true)
  }

  const handleCloseAddDialog = () => {
    setIsAddDialogOpen(false)
    setCustomPhraseError(null)
  }

  const handleAddCustomPhrase = () => {
    const trimmed = customPhraseText.trim()
    if (trimmed.length < 10) {
      setCustomPhraseError("Phrase should be at least 10 characters long")
      return
    }
    const newPhrase: TrainingPhrase = {
      id: `custom-${Date.now()}`,
      text: trimmed,
      isCustom: true,
    }
    setPhrases(prev => [...prev, newPhrase])
    setCurrentStep(phrases.length)
    setIsAddDialogOpen(false)
  }

  const handleRemovePhrase = (phraseId: string, index: number) => {
    if (phrases.length <= 5) {
      setError("You must keep at least five phrases for reliable training")
      return
    }
    setPhrases(prev => prev.filter(phrase => phrase.id !== phraseId))
    setRecordings(prev => {
      const { [phraseId]: _removed, ...rest } = prev
      return rest
    })
    if (currentStep >= phrases.length - 1) {
      setCurrentStep(Math.max(index - 1, 0))
    }
  }

  const handleSubmit = async () => {
    if (!resolvedUserId) {
      setError("No user detected. Please log in again.")
      return
    }

    const orderedSamples = phrases.reduce<VoiceTrainingSample[]>(
      (accumulator, phrase, index) => {
        const sample = recordings[phrase.id]
        if (!sample) {
          return accumulator
        }

        accumulator.push({
          phrase_number: index + 1,
          audio_base64: sample.base64,
          duration: Number(sample.duration.toFixed(2)),
        })

        return accumulator
      },
      []
    )

    if (orderedSamples.length < 5) {
      setError("At least five recordings are required before training")
      return
    }

    if (orderedSamples.length > maxSamples) {
      setError("Maximum of ten recordings allowed for training")
      return
    }

    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      await usersAPI.trainVoice(resolvedUserId, {
        audio_samples: orderedSamples,
      })

      setSuccess(
        isRetrainingFlow
          ? "Voice model retrained successfully."
          : "Voice model trained successfully."
      )

      if (!isRetrainingFlow) {
        navigate("/", { replace: true })
      }
    } catch (err: any) {
      setError(
        err?.message ||
          err?.response?.data?.detail ||
          "Failed to train voice model. Please try again."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderRecordingStatus = (phrase: TrainingPhrase, index: number) => {
    const sample = recordings[phrase.id]
    if (!sample) {
      return (
        <Typography variant="body2" color="text.secondary">
          Not recorded yet
        </Typography>
      )
    }

    const audioSrc = `data:audio/webm;base64,${sample.base64}`
    return (
      <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
        <audio controls src={audioSrc} style={{ maxWidth: 220 }} />
        <Typography variant="body2" color="text.secondary">
          {sample.duration.toFixed(1)}s
        </Typography>
        <Tooltip title="Remove this recording">
          <IconButton
            aria-label="remove recording"
            size="small"
            onClick={() => handleRemoveRecording(phrase.id)}
          >
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Record again">
          <IconButton
            aria-label="re-record"
            size="small"
            onClick={() => handleNavigateStep(index)}
          >
            <ReplayIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        {phrase.isCustom && (
          <Chip label="Custom" color="secondary" size="small" />
        )}
      </Box>
    )
  }

  if (!resolvedUserId) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ mt: 8 }}>
          <Alert severity="warning">
            Unable to find user information for voice training. Please log in
            again.
          </Alert>
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Voice Training
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            align="center"
            sx={{ mb: 4 }}
          >
            {isRetrainingFlow
              ? "Refresh your voice model by updating any phrases that no longer sound accurate."
              : "Record yourself reading each phrase to train the speaker identification system."}
          </Typography>

          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{ mb: 3 }}
          />
          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
            sx={{ mb: 4 }}
          >
            Progress: {recordedCount} of {phrases.length} phrases recorded
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {success}
            </Alert>
          )}

          <Stepper
            nonLinear
            activeStep={currentStep}
            alternativeLabel
            sx={{ mb: 4 }}
          >
            {phrases.map((phrase, index) => {
              const isCompleted = Boolean(recordings[phrase.id])
              return (
                <Step key={phrase.id} completed={isCompleted}>
                  <StepButton onClick={() => handleNavigateStep(index)}>
                    Phrase {index + 1}
                  </StepButton>
                </Step>
              )
            })}
          </Stepper>

          <Paper
            variant="outlined"
            sx={{
              p: 3,
              mb: 3,
              bgcolor: "primary.light",
              color: "primary.contrastText",
            }}
          >
            <Typography variant="h6" align="center">
              Phrase {currentStep + 1}
            </Typography>
            <Typography
              variant="h5"
              align="center"
              sx={{ mt: 1, fontWeight: "bold" }}
            >
              "{phrases[currentStep]?.text}"
            </Typography>
          </Paper>

          <VoiceRecorder
            phraseNumber={currentStep + 1}
            phraseText={phrases[currentStep]?.text || ""}
            onRecordingComplete={handleRecordingComplete}
            disabled={isSubmitting}
          />

          <Box
            mt={3}
            display="flex"
            justifyContent="space-between"
            flexWrap="wrap"
            gap={2}
          >
            <Button
              variant="outlined"
              onClick={handlePrevStep}
              disabled={currentStep === 0}
            >
              Previous Phrase
            </Button>
            <Button
              variant="outlined"
              onClick={handleNextStep}
              disabled={currentStep >= phrases.length - 1}
            >
              Next Phrase
            </Button>
          </Box>

          <Box mt={4}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              flexWrap="wrap"
              gap={2}
              mb={2}
            >
              <Typography variant="h6">Recorded Phrases</Typography>
              <Button
                variant="text"
                startIcon={<AddCircleOutlineIcon />}
                onClick={handleOpenAddDialog}
                disabled={phrases.length >= maxSamples}
              >
                Add Custom Phrase
              </Button>
            </Box>

            <List sx={{ width: "100%" }}>
              {phrases.map((phrase, index) => (
                <ListItem
                  key={phrase.id}
                  alignItems="flex-start"
                  sx={{ flexDirection: "column", alignItems: "stretch" }}
                  secondaryAction={
                    phrase.isCustom ? (
                      <Tooltip title="Remove custom phrase">
                        <IconButton
                          edge="end"
                          onClick={() => handleRemovePhrase(phrase.id, index)}
                        >
                          <DeleteOutlineIcon />
                        </IconButton>
                      </Tooltip>
                    ) : null
                  }
                >
                  <ListItemText
                    primary={`Phrase ${index + 1}`}
                    secondary={phrase.text}
                    sx={{ mb: 1 }}
                  />
                  {renderRecordingStatus(phrase, index)}
                </ListItem>
              ))}
            </List>
          </Box>

          <Box mt={4} textAlign="center">
            {!minSamplesMet && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Record at least {Math.max(5 - recordedCount, 0)} more phrase
                {recordedCount === 4 ? "" : "s"} to enable training.
              </Typography>
            )}
            <Button
              variant="contained"
              size="large"
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
            >
              {isSubmitting
                ? "Training Voice Model..."
                : isRetrainingFlow
                  ? "Retrain Voice Model"
                  : "Complete Training"}
            </Button>
          </Box>
        </Paper>
      </Box>

      <Dialog open={isAddDialogOpen} onClose={handleCloseAddDialog} fullWidth>
        <DialogTitle>Add Custom Phrase</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Custom Phrase"
            fullWidth
            multiline
            minRows={2}
            value={customPhraseText}
            onChange={event => setCustomPhraseText(event.target.value)}
            helperText={
              customPhraseError ||
              "Provide a sentence the salesperson can read for additional coverage."
            }
            error={Boolean(customPhraseError)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddDialog}>Cancel</Button>
          <Button
            onClick={handleAddCustomPhrase}
            disabled={!customPhraseText.trim()}
          >
            Add Phrase
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default VoiceTraining
