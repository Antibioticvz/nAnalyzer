/**
 * Frontend test: TranscriptView component
 * Test scrolling, highlighting, and segment rendering
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { TranscriptView } from '../TranscriptView';
import { SegmentResponse } from '../../types/api';

// Mock scrollIntoView
Element.prototype.scrollIntoView = jest.fn();

describe('TranscriptView Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  const mockSegments: SegmentResponse[] = [
    {
      segment_id: 1,
      call_id: 'call_123',
      start_time: 0,
      end_time: 10,
      speaker: 'seller',
      transcript: 'Hello, how can I help you?',
      emotions: null,
    },
    {
      segment_id: 2,
      call_id: 'call_123',
      start_time: 10,
      end_time: 20,
      speaker: 'client',
      transcript: 'I am interested in your product',
      emotions: {
        enthusiasm: 7.5,
        agreement: 8.0,
        stress: 3.0,
      },
    },
    {
      segment_id: 3,
      call_id: 'call_123',
      start_time: 20,
      end_time: 30,
      speaker: 'seller',
      transcript: 'Great! Let me tell you more about it',
      emotions: null,
    },
  ];

  test('renders transcript header', () => {
    render(<TranscriptView segments={mockSegments} />);
    
    expect(screen.getByText('Call Transcript')).toBeInTheDocument();
    expect(screen.getByText('Seller')).toBeInTheDocument();
    expect(screen.getByText('Client')).toBeInTheDocument();
  });

  test('renders all segments', () => {
    render(<TranscriptView segments={mockSegments} />);
    
    expect(screen.getByText('Hello, how can I help you?')).toBeInTheDocument();
    expect(screen.getByText('I am interested in your product')).toBeInTheDocument();
    expect(screen.getByText('Great! Let me tell you more about it')).toBeInTheDocument();
  });

  test('shows empty state when no segments', () => {
    render(<TranscriptView segments={[]} />);
    
    expect(screen.getByText(/No transcript available/i)).toBeInTheDocument();
  });

  test('displays speaker labels correctly', () => {
    render(<TranscriptView segments={mockSegments} />);
    
    const sellerLabels = screen.getAllByText('🎤 Seller');
    const clientLabel = screen.getByText('👤 Client');
    
    expect(sellerLabels.length).toBe(2); // Two seller segments
    expect(clientLabel).toBeInTheDocument();
  });

  test('formats timestamps correctly', () => {
    render(<TranscriptView segments={mockSegments} />);
    
    expect(screen.getByText('0:00')).toBeInTheDocument();
    expect(screen.getByText('0:10')).toBeInTheDocument();
    expect(screen.getByText('0:20')).toBeInTheDocument();
  });

  test('displays emotion badges for client segments', () => {
    render(<TranscriptView segments={mockSegments} />);
    
    // Client segment should have emotion badges
    const emotionBadges = document.querySelectorAll('.emotion-badge');
    expect(emotionBadges.length).toBeGreaterThan(0);
  });

  test('does not display emotions for seller segments', () => {
    const sellerSegments: SegmentResponse[] = [
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
    
    const { container } = render(<TranscriptView segments={sellerSegments} />);
    
    const emotionBadges = container.querySelectorAll('.emotion-badge');
    expect(emotionBadges).toHaveLength(0);
  });

  test('calls onSegmentClick when segment is clicked', () => {
    const onSegmentClick = jest.fn();
    
    render(
      <TranscriptView
        segments={mockSegments}
        onSegmentClick={onSegmentClick}
      />
    );
    
    const firstSegment = screen.getByText('Hello, how can I help you?');
    fireEvent.click(firstSegment.closest('.transcript-segment')!);
    
    expect(onSegmentClick).toHaveBeenCalledWith(mockSegments[0]);
  });

  test('highlights selected segment', () => {
    const onSegmentClick = jest.fn();
    
    const { container } = render(
      <TranscriptView
        segments={mockSegments}
        onSegmentClick={onSegmentClick}
      />
    );
    
    const firstSegment = container.querySelector('#segment-1')!;
    fireEvent.click(firstSegment);
    
    expect(firstSegment.classList.contains('selected')).toBe(true);
  });

  test('applies highlighted class to specified segment', () => {
    const { container } = render(
      <TranscriptView
        segments={mockSegments}
        highlightedSegmentId={2}
      />
    );
    
    const highlightedSegment = container.querySelector('#segment-2');
    expect(highlightedSegment?.classList.contains('highlighted')).toBe(true);
  });

  test('applies emotion color classes based on emotion values', () => {
    const highStressSegment: SegmentResponse[] = [
      {
        segment_id: 1,
        call_id: 'call_123',
        start_time: 0,
        end_time: 10,
        speaker: 'client',
        transcript: 'Test',
        emotions: {
          enthusiasm: 3.0,
          agreement: 4.0,
          stress: 8.5, // High stress
        },
      },
    ];
    
    const { container } = render(<TranscriptView segments={highStressSegment} />);
    
    const segment = container.querySelector('.transcript-segment');
    expect(segment?.classList.contains('high-stress')).toBe(true);
  });

  test('handles segments with missing transcript', () => {
    const segmentWithoutTranscript: SegmentResponse[] = [
      {
        segment_id: 1,
        call_id: 'call_123',
        start_time: 0,
        end_time: 10,
        speaker: 'client',
        transcript: null as any,
        emotions: null,
      },
    ];
    
    render(<TranscriptView segments={segmentWithoutTranscript} />);
    
    expect(screen.getByText('(No transcript)')).toBeInTheDocument();
  });

  test('scrolls to highlighted segment', () => {
    const scrollIntoViewMock = jest.fn();
    Element.prototype.scrollIntoView = scrollIntoViewMock;
    
    const { rerender } = render(
      <TranscriptView segments={mockSegments} />
    );
    
    rerender(
      <TranscriptView
        segments={mockSegments}
        highlightedSegmentId={2}
      />
    );
    
    expect(scrollIntoViewMock).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'center',
    });
  });

  test('formats longer timestamps correctly', () => {
    const longSegments: SegmentResponse[] = [
      {
        segment_id: 1,
        call_id: 'call_123',
        start_time: 125, // 2:05
        end_time: 135,
        speaker: 'client',
        transcript: 'Test',
        emotions: null,
      },
    ];
    
    render(<TranscriptView segments={longSegments} />);
    
    expect(screen.getByText('2:05')).toBeInTheDocument();
  });
});
