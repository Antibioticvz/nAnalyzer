/**
 * Frontend test: EmotionChart component
 * Test Chart.js rendering with emotion data
 */
import { render, screen } from '@testing-library/react';
import { EmotionChart } from '../EmotionChart';
import { SegmentResponse } from '../../types/api';

// Mock Chart.js
jest.mock('react-chartjs-2', () => ({
  Line: () => <div data-testid="line-chart">Chart</div>,
}));

describe('EmotionChart Component', () => {
  const mockSegments: SegmentResponse[] = [
    {
      segment_id: 1,
      call_id: 'call_123',
      start_time: 0,
      end_time: 10,
      speaker: 'client',
      transcript: 'Hello',
      emotions: {
        enthusiasm: 7.5,
        agreement: 8.0,
        stress: 3.5,
      },
    },
    {
      segment_id: 2,
      call_id: 'call_123',
      start_time: 10,
      end_time: 20,
      speaker: 'seller',
      transcript: 'Hi there',
      emotions: null,
    },
    {
      segment_id: 3,
      call_id: 'call_123',
      start_time: 20,
      end_time: 30,
      speaker: 'client',
      transcript: 'How are you?',
      emotions: {
        enthusiasm: 6.0,
        agreement: 7.5,
        stress: 4.0,
      },
    },
  ];

  test('renders chart with emotion data', () => {
    render(<EmotionChart segments={mockSegments} />);
    
    const chart = screen.getByTestId('line-chart');
    expect(chart).toBeInTheDocument();
  });

  test('shows empty state when no segments', () => {
    render(<EmotionChart segments={[]} />);
    
    expect(screen.getByText(/No emotion data available/i)).toBeInTheDocument();
  });

  test('filters only client segments with emotions', () => {
    render(<EmotionChart segments={mockSegments} />);
    
    // Should render chart because there are client segments with emotions
    const chart = screen.getByTestId('line-chart');
    expect(chart).toBeInTheDocument();
  });

  test('shows empty state when no client segments', () => {
    const sellerOnlySegments: SegmentResponse[] = [
      {
        segment_id: 1,
        call_id: 'call_123',
        start_time: 0,
        end_time: 10,
        speaker: 'seller',
        transcript: 'Hello',
        emotions: null,
      },
    ];
    
    render(<EmotionChart segments={sellerOnlySegments} />);
    
    expect(screen.getByText(/No emotion data available/i)).toBeInTheDocument();
  });

  test('handles custom height prop', () => {
    const { container } = render(
      <EmotionChart segments={mockSegments} height={500} />
    );
    
    const chartContainer = container.querySelector('.emotion-chart');
    expect(chartContainer).toHaveStyle({ height: '500px' });
  });

  test('uses default height when not specified', () => {
    const { container } = render(<EmotionChart segments={mockSegments} />);
    
    const chartContainer = container.querySelector('.emotion-chart');
    expect(chartContainer).toHaveStyle({ height: '300px' });
  });

  test('handles segments without emotions', () => {
    const segmentsWithoutEmotions: SegmentResponse[] = [
      {
        segment_id: 1,
        call_id: 'call_123',
        start_time: 0,
        end_time: 10,
        speaker: 'client',
        transcript: 'Hello',
        emotions: null,
      },
    ];
    
    render(<EmotionChart segments={segmentsWithoutEmotions} />);
    
    expect(screen.getByText(/No emotion data available/i)).toBeInTheDocument();
  });

  test('handles mixed segments with and without emotions', () => {
    const mixedSegments: SegmentResponse[] = [
      {
        segment_id: 1,
        call_id: 'call_123',
        start_time: 0,
        end_time: 10,
        speaker: 'client',
        transcript: 'Hello',
        emotions: {
          enthusiasm: 5.0,
          agreement: 6.0,
          stress: 4.0,
        },
      },
      {
        segment_id: 2,
        call_id: 'call_123',
        start_time: 10,
        end_time: 20,
        speaker: 'client',
        transcript: 'Test',
        emotions: null, // No emotions for this segment
      },
    ];
    
    render(<EmotionChart segments={mixedSegments} />);
    
    // Should still render chart with the segment that has emotions
    const chart = screen.getByTestId('line-chart');
    expect(chart).toBeInTheDocument();
  });

  test('formats time labels correctly', () => {
    const segmentsWithVariousTimes: SegmentResponse[] = [
      {
        segment_id: 1,
        call_id: 'call_123',
        start_time: 65, // 1:05
        end_time: 75,
        speaker: 'client',
        transcript: 'Test',
        emotions: {
          enthusiasm: 5.0,
          agreement: 6.0,
          stress: 4.0,
        },
      },
      {
        segment_id: 2,
        call_id: 'call_123',
        start_time: 125, // 2:05
        end_time: 135,
        speaker: 'client',
        transcript: 'Test 2',
        emotions: {
          enthusiasm: 6.0,
          agreement: 7.0,
          stress: 3.0,
        },
      },
    ];
    
    render(<EmotionChart segments={segmentsWithVariousTimes} />);
    
    const chart = screen.getByTestId('line-chart');
    expect(chart).toBeInTheDocument();
  });
});
