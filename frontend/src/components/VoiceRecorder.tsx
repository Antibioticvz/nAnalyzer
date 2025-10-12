/**
 * VoiceRecorder component
 * Records audio from microphone for voice training
 */
import React, { useCallback, useEffect, useRef, useState } from "react"

interface VoiceRecorderProps {
  phraseNumber: number
  phraseText: string
  onRecordingComplete: (audioBlob: Blob, duration: number) => void
  onCancel?: () => void
  disabled?: boolean
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  phraseNumber,
  phraseText,
  onRecordingComplete,
  onCancel,
  disabled = false,
}) => {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [recordedDuration, setRecordedDuration] = useState(0)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [audioURL, setAudioURL] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(0)

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (audioURL) {
        URL.revokeObjectURL(audioURL)
      }
    }
  }, [audioURL])

  const resetState = useCallback(() => {
    setIsRecording(false)
    setRecordingTime(0)
    setRecordedDuration(0)
    setRecordedBlob(null)
    if (audioURL) {
      URL.revokeObjectURL(audioURL)
    }
    setAudioURL(null)
    setError(null)
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [audioURL])

  useEffect(() => {
    resetState()
    // resetState intentionally omitted from deps to avoid re-triggering on internal state updates
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phraseNumber, phraseText])

  const startRecording = async () => {
    try {
      if (recordedBlob || audioURL) {
        resetState()
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" })
        const url = URL.createObjectURL(blob)
        const duration = (Date.now() - startTimeRef.current) / 1000

        setRecordedBlob(blob)
        setRecordedDuration(duration)
        setAudioURL(url)

        stream.getTracks().forEach(track => track.stop())
      }

      startTimeRef.current = Date.now()
      mediaRecorder.start()
      setIsRecording(true)
      setError(null)

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((Date.now() - startTimeRef.current) / 1000)
      }, 100)
    } catch (err) {
      setError("Failed to access microphone. Please check permissions.")
      console.error("Recording error:", err)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)

      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }

  const handleAcceptRecording = () => {
    if (recordedBlob) {
      onRecordingComplete(recordedBlob, recordedDuration)
      setError(null)
      resetState()
    }
  }

  const handleDiscardRecording = () => {
    resetState()
    onCancel?.()
  }

  const handleReRecord = () => {
    resetState()
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 10)
    return `${mins}:${secs.toString().padStart(2, "0")}.${ms}`
  }

  return (
    <div className="voice-recorder">
      <div className="recorder-header">
        <h3>Phrase {phraseNumber}</h3>
      </div>

      <div className="phrase-display">
        <p className="phrase-text">"{phraseText}"</p>
        <p className="phrase-instruction">
          Read this phrase clearly when recording
        </p>
      </div>

      {error && (
        <div className="recorder-error">
          <p>{error}</p>
        </div>
      )}

      <div className="recorder-controls">
        {!isRecording && !audioURL && (
          <button
            onClick={startRecording}
            className="btn btn-primary btn-large"
            disabled={disabled}
          >
            🎤 Start Recording
          </button>
        )}

        {isRecording && (
          <>
            <div
              className="recording-indicator"
              data-testid="recording-indicator"
            >
              <span className="recording-dot" />
              <span className="recording-time" data-testid="recording-time">
                {formatTime(recordingTime)}
              </span>
            </div>
            <button
              onClick={stopRecording}
              className="btn btn-danger btn-large"
            >
              ⏹ Stop Recording
            </button>
          </>
        )}

        {audioURL && recordedBlob && (
          <div className="recording-preview" data-testid="recording-preview">
            <audio
              src={audioURL}
              controls
              className="audio-player"
              data-testid="recording-audio"
            />
            <div className="preview-actions">
              <button onClick={handleReRecord} className="btn btn-secondary">
                🔄 Re-record
              </button>
              <button
                onClick={handleAcceptRecording}
                className="btn btn-primary"
              >
                ✓ Use This Recording
              </button>
              <button
                onClick={handleDiscardRecording}
                className="btn btn-tertiary"
              >
                ✖ Discard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
