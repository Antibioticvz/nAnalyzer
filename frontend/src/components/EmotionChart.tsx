/**
 * EmotionChart component
 * Displays emotion scores over time using Chart.js
 */
import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { SegmentResponse } from '../types/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface EmotionChartProps {
  segments: SegmentResponse[];
  height?: number;
}

export const EmotionChart: React.FC<EmotionChartProps> = ({
  segments,
  height = 300,
}) => {
  // Filter only client segments with emotions
  const clientSegments = segments.filter(
    (seg) => seg.speaker === 'client' && seg.emotions
  );

  // Extract data for chart
  const labels = clientSegments.map((seg) => {
    const time = Math.floor(seg.start_time);
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  });

  const enthusiasmData = clientSegments.map((seg) => seg.emotions?.enthusiasm ?? 0);
  const agreementData = clientSegments.map((seg) => seg.emotions?.agreement ?? 0);
  const stressData = clientSegments.map((seg) => seg.emotions?.stress ?? 0);

  const data = {
    labels,
    datasets: [
      {
        label: 'Enthusiasm',
        data: enthusiasmData,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.3,
      },
      {
        label: 'Agreement',
        data: agreementData,
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        tension: 0.3,
      },
      {
        label: 'Stress',
        data: stressData,
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.3,
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Client Emotions Over Time',
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}/10`;
          },
        },
      },
    },
    scales: {
      y: {
        min: 0,
        max: 10,
        ticks: {
          stepSize: 2,
        },
        title: {
          display: true,
          text: 'Score (0-10)',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Time',
        },
      },
    },
  };

  if (clientSegments.length === 0) {
    return (
      <div className="emotion-chart-empty">
        <p>No emotion data available yet. Upload and analyze a call first.</p>
      </div>
    );
  }

  return (
    <div className="emotion-chart" style={{ height: `${height}px` }}>
      <Line data={data} options={options} />
    </div>
  );
};
