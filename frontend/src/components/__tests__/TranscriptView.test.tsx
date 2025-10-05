/**
 * Frontend test: TranscriptView component
 * Test scrolling, highlighting, and segment rendering
 */
import { fireEvent, render, screen } from "@testing-library/react"
import { TranscriptView } from "../TranscriptView"

// Mock scrollIntoView
Element.prototype.scrollIntoView = jest.fn()

// Helper function to convert SegmentResponse to TranscriptSegment format
const convertToTranscriptSegment = (segment: any) => {
  let emotion = "neutral"
  let confidence = 0

  if (segment.emotions) {
    // Find the dominant emotion
    const emotions = segment.emotions
    const entries = Object.entries(emotions)
    if (entries.length > 0) {
      const maxEmotion = entries.reduce(
        (max: any, [key, value]: [string, any]) =>
          value > max.value ? { key, value } : max,
        { key: "neutral", value: 0 }
      )
      emotion = maxEmotion.key
      confidence = maxEmotion.value
    }
  }

  return {
    id: segment.segment_id?.toString() || segment.id,
    text: segment.transcript || segment.text,
    speaker: segment.speaker,
    start_time: segment.start_time,
    end_time: segment.end_time,
    emotion,
    confidence,
  }
}

describe("TranscriptView Component", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const mockSegments = [
    {
      segment_id: 1,
      call_id: "call_123",
      start_time: 0,
      end_time: 10,
      speaker: "seller",
      transcript: "Hello, how can I help you?",
      emotions: null,
    },
    {
      segment_id: 2,
      call_id: "call_123",
      start_time: 10,
      end_time: 20,
      speaker: "client",
      transcript: "I am interested in your product",
      emotions: {
        enthusiasm: 7.5,
        agreement: 8.0,
        stress: 3.0,
      },
    },
    {
      segment_id: 3,
      call_id: "call_123",
      start_time: 20,
      end_time: 30,
      speaker: "seller",
      transcript: "Great! Let me tell you more about it",
      emotions: null,
    },
  ].map(convertToTranscriptSegment)

  test("renders transcript header", () => {
    render(<TranscriptView segments={mockSegments} />)

    expect(screen.getByText("Call Transcript")).toBeInTheDocument()
    expect(screen.getByText("Seller")).toBeInTheDocument()
    expect(screen.getByText("Client")).toBeInTheDocument()
  })

  test("renders all segments", () => {
    render(<TranscriptView segments={mockSegments} />)

    expect(screen.getByText("Hello, how can I help you?")).toBeInTheDocument()
    expect(
      screen.getByText("I am interested in your product")
    ).toBeInTheDocument()
    expect(
      screen.getByText("Great! Let me tell you more about it")
    ).toBeInTheDocument()
  })

  test("shows empty state when no segments", () => {
    render(<TranscriptView segments={[]} />)

    expect(screen.getByText(/No transcript available/i)).toBeInTheDocument()
  })

  test("displays speaker labels correctly", () => {
    render(<TranscriptView segments={mockSegments} />)

    const sellerLabels = screen.getAllByText("🎤 Agent")
    const clientLabel = screen.getByText("👤 Client")

    expect(sellerLabels.length).toBe(2) // Two seller segments
    expect(clientLabel).toBeInTheDocument()
  })

  test("formats timestamps correctly", () => {
    render(<TranscriptView segments={mockSegments} />)

    expect(screen.getByText("0:00")).toBeInTheDocument()
    expect(screen.getByText("0:10")).toBeInTheDocument()
    expect(screen.getByText("0:20")).toBeInTheDocument()
  })

  test("displays emotion badges for client segments", () => {
    render(<TranscriptView segments={mockSegments} />)

    // Client segment should have emotion badges
    expect(screen.getByText("agreement (8)")).toBeInTheDocument()
  })

  test("does not display emotions for seller segments", () => {
    const sellerSegments = [
      {
        segment_id: 1,
        call_id: "call_123",
        start_time: 0,
        end_time: 10,
        speaker: "seller",
        transcript: "Hello",
        emotions: null,
      },
    ].map(convertToTranscriptSegment)

    render(<TranscriptView segments={sellerSegments} />)

    const emotionBadges = screen.queryAllByText(/./, {
      selector: ".emotion-badge",
    })
    expect(emotionBadges.length).toBe(0)
  })

  test("calls onSegmentClick when segment is clicked", () => {
    const onSegmentClick = jest.fn()

    render(
      <TranscriptView segments={mockSegments} onSegmentClick={onSegmentClick} />
    )

    const firstSegment = screen.getByText("Hello, how can I help you?")
    fireEvent.click(firstSegment)

    expect(onSegmentClick).toHaveBeenCalledWith(mockSegments[0])
  })

  test("highlights selected segment", () => {
    const onSegmentClick = jest.fn()

    render(
      <TranscriptView segments={mockSegments} onSegmentClick={onSegmentClick} />
    )

    const firstSegment = screen.getByText("Hello, how can I help you?")
    fireEvent.click(firstSegment)

    expect(firstSegment.closest(".transcript-segment")).toHaveClass("selected")
  })

  test("applies highlighted class to specified segment", () => {
    render(<TranscriptView segments={mockSegments} highlightedSegmentId="2" />)

    const highlightedSegment = screen
      .getByText("I am interested in your product")
      .closest(".transcript-segment")
    expect(highlightedSegment).toHaveClass("highlighted")
  })

  test("applies emotion color classes based on emotion values", () => {
    const highStressSegment = [
      {
        segment_id: 1,
        call_id: "call_123",
        start_time: 0,
        end_time: 10,
        speaker: "client",
        transcript: "This is stressful",
        emotions: {
          enthusiasm: 2.0,
          agreement: 1.0,
          stress: 9.0,
        },
      },
    ].map(convertToTranscriptSegment)

    render(<TranscriptView segments={highStressSegment} />)

    const segment = screen
      .getByText("This is stressful")
      .closest(".transcript-segment")
    expect(segment).toHaveClass("negative")
  })

  test("handles segments with missing transcript", () => {
    const segmentWithoutTranscript = [
      {
        segment_id: 1,
        call_id: "call_123",
        start_time: 0,
        end_time: 10,
        speaker: "seller",
        transcript: null,
        emotions: null,
      },
    ].map(convertToTranscriptSegment)

    render(<TranscriptView segments={segmentWithoutTranscript} />)

    expect(screen.getByText("(No transcript)")).toBeInTheDocument()
  })

  test("scrolls to highlighted segment", () => {
    render(<TranscriptView segments={mockSegments} highlightedSegmentId="2" />)

    // Mock should have been called
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled()
  })

  test("formats longer timestamps correctly", () => {
    const longSegments = [
      {
        segment_id: 1,
        call_id: "call_123",
        start_time: 125,
        end_time: 135,
        speaker: "seller",
        transcript: "Long timestamp test",
        emotions: null,
      },
    ].map(convertToTranscriptSegment)

    render(<TranscriptView segments={longSegments} />)

    expect(screen.getByText("2:05")).toBeInTheDocument()
  })
})
