/**
 * EmotionChart component
 * Displays emotion scores over time using Chart.js
 */
import {
  CategoryScale,
  Chart as ChartJS,
  ChartOptions,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js"
import React from "react"
import { Line } from "react-chartjs-2"

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

interface EmotionChartProps {
  data: Array<{
    timestamp: number
    emotion: string
    confidence: number
  }>
  height?: number
}

export const EmotionChart: React.FC<EmotionChartProps> = ({
  data,
  height = 300,
}) => {
  // Group data by emotion
  const emotionGroups = (data || []).reduce(
    (acc, item) => {
      if (!acc[item.emotion]) acc[item.emotion] = []
      acc[item.emotion].push(item)
      return acc
    },
    {} as Record<string, typeof data>
  )

  const labels = (data || []).map(item =>
    new Date(item.timestamp * 1000).toLocaleTimeString()
  )

  const datasets = Object.entries(emotionGroups).map(([emotion, items]) => ({
    label: emotion,
    data: items.map(item => item.confidence),
    borderColor: getEmotionColor(emotion),
    backgroundColor: getEmotionColor(emotion, 0.1),
    tension: 0.4,
  }))

  const chartData = {
    labels,
    datasets,
  }

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Emotion Analysis Over Time",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 1,
        title: {
          display: true,
          text: "Confidence",
        },
      },
      x: {
        title: {
          display: true,
          text: "Time",
        },
      },
    },
  }

  if (data.length === 0) {
    return (
      <div
        style={{
          height: `${height}px`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p>No emotion data available yet. Upload and analyze a call first.</p>
      </div>
    )
  }

  return (
    <div style={{ height: `${height}px` }}>
      <Line data={chartData} options={options} />
    </div>
  )
}

function getEmotionColor(emotion: string, alpha = 1): string {
  const colors: Record<string, string> = {
    positive: `rgba(76, 175, 80, ${alpha})`,
    negative: `rgba(244, 67, 54, ${alpha})`,
    neutral: `rgba(96, 125, 139, ${alpha})`,
    anger: `rgba(255, 87, 34, ${alpha})`,
    joy: `rgba(255, 193, 7, ${alpha})`,
    sadness: `rgba(33, 150, 243, ${alpha})`,
    surprise: `rgba(156, 39, 176, ${alpha})`,
  }
  return colors[emotion] || `rgba(158, 158, 158, ${alpha})`
}
