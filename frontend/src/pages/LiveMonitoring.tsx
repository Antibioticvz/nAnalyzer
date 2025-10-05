import React, { useState } from "react"

const LiveMonitoring: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false)
  const [transcript] = useState<string[]>([])
  const [sentiment] = useState("neutral")

  const startRecording = () => {
    setIsRecording(true)
    // TODO: Connect to WebSocket
  }

  const stopRecording = () => {
    setIsRecording(false)
    // TODO: Disconnect WebSocket
  }

  return (
    <div className="live-monitoring">
      <h1>Live Call Monitoring</h1>

      <div className="card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 className="card-title">Recording Status</h2>
          {isRecording ? (
            <button className="btn btn-danger" onClick={stopRecording}>
              ⏹ Stop Recording
            </button>
          ) : (
            <button className="btn btn-primary" onClick={startRecording}>
              🔴 Start Recording
            </button>
          )}
        </div>
      </div>

      {isRecording && (
        <>
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-label">Duration</div>
              <div className="metric-value">00:00</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Current Sentiment</div>
              <div
                className="metric-value"
                style={{
                  color:
                    sentiment === "positive"
                      ? "#2ecc71"
                      : sentiment === "negative"
                        ? "#e74c3c"
                        : "#95a5a6",
                }}
              >
                {sentiment}
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Talk Ratio</div>
              <div className="metric-value">50%</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Questions</div>
              <div className="metric-value">0</div>
            </div>
          </div>

          <div className="card">
            <h2 className="card-title">Live Transcript</h2>
            <div
              style={{
                maxHeight: "400px",
                overflowY: "auto",
                padding: "1rem",
                backgroundColor: "#f9f9f9",
                borderRadius: "4px",
              }}
            >
              {transcript.length > 0 ? (
                transcript.map((text, index) => <p key={index}>{text}</p>)
              ) : (
                <p style={{ color: "#999" }}>Waiting for audio input...</p>
              )}
            </div>
          </div>

          <div className="card">
            <h2 className="card-title">Audio Waveform</h2>
            <div
              style={{
                height: "100px",
                backgroundColor: "#f0f0f0",
                borderRadius: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <p style={{ color: "#999" }}>
                Waveform visualization placeholder
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default LiveMonitoring
