/**
 * TranscriptView component
 * Displays call transcript with speaker labels and emotion highlighting
 */
import React, { useEffect, useRef, useState } from "react"

interface TranscriptSegment {
  id: string
  text: string
  speaker: string
  start_time: number
  end_time: number
  emotion: string
  confidence: number
}

interface TranscriptViewProps {
  segments: TranscriptSegment[]
  onSegmentClick?: (segment: TranscriptSegment) => void
  highlightedSegmentId?: string
}

export const TranscriptView: React.FC<TranscriptViewProps> = ({
  segments,
  onSegmentClick,
  highlightedSegmentId,
}) => {
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (highlightedSegmentId !== undefined) {
      // Scroll to highlighted segment
      const element = document.getElementById(`segment-${highlightedSegmentId}`)
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" })
      }
    }
  }, [highlightedSegmentId])

  const handleSegmentClick = (segment: TranscriptSegment) => {
    setSelectedSegment(segment.id)
    onSegmentClick?.(segment)
  }

  const getEmotionColor = (emotion: string) => {
    const colors: Record<string, string> = {
      positive: "positive",
      negative: "negative",
      neutral: "neutral",
      anger: "negative",
      joy: "positive",
      sadness: "negative",
      surprise: "neutral",
      stress: "negative",
      agreement: "positive",
      enthusiasm: "positive",
    }
    return colors[emotion] || "neutral"
  }

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${minutes}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="transcript-view" ref={containerRef}>
      <div className="transcript-header">
        <h3>Call Transcript</h3>
        <div className="legend">
          <span className="legend-item">
            <span className="legend-color seller" />
            Seller
          </span>
          <span className="legend-item">
            <span className="legend-color client" />
            Client
          </span>
        </div>
      </div>

      <div className="transcript-content">
        {segments.length === 0 ? (
          <p className="empty-state">No transcript available yet.</p>
        ) : (
          segments.map(segment => (
            <div
              key={segment.id}
              id={`segment-${segment.id}`}
              className={`transcript-segment ${segment.speaker} ${getEmotionColor(
                segment.emotion
              )} ${selectedSegment === segment.id ? "selected" : ""} ${
                highlightedSegmentId === segment.id ? "highlighted" : ""
              }`}
              onClick={() => handleSegmentClick(segment)}
            >
              <div className="segment-header">
                <span className="speaker-label">
                  {segment.speaker === "seller" ? "🎤 Agent" : "👤 Client"}
                </span>
                <span className="timestamp">
                  {formatTime(segment.start_time)}
                </span>
              </div>

              <div className="segment-text">
                {segment.text || "(No transcript)"}
              </div>

              {segment.speaker === "client" && (
                <div className="segment-emotions">
                  <span className="emotion-badge">
                    {segment.emotion} ({segment.confidence.toFixed(0)})
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
