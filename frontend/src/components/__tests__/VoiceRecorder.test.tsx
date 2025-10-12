/**
 * Frontend test: VoiceRecorder component
 * Test microphone recording functionality
 */
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { VoiceRecorder } from "../VoiceRecorder"

// Mock MediaRecorder API
class MockMediaRecorder {
  static isTypeSupported = jest.fn(() => true)
  ondataavailable: ((event: any) => void) | null = null
  onstop: (() => void) | null = null
  state: "inactive" | "recording" | "paused" = "inactive"

  start = jest.fn(() => {
    this.state = "recording"
  })

  stop = jest.fn(() => {
    this.state = "inactive"
    if (this.ondataavailable) {
      this.ondataavailable({
        data: new Blob(["audio"], { type: "audio/webm" }),
      })
    }
    if (this.onstop) {
      this.onstop()
    }
  })

  pause = jest.fn()
  resume = jest.fn()
}

// Mock navigator.mediaDevices
const mockGetUserMedia = jest.fn()
const mockTrack = { stop: jest.fn() }
const mockStream = {
  getTracks: () => [mockTrack],
}

global.MediaRecorder = MockMediaRecorder as any
global.URL.createObjectURL = jest.fn(() => "blob:mock-url")

Object.defineProperty(global.navigator, "mediaDevices", {
  value: {
    getUserMedia: mockGetUserMedia,
  },
  writable: true,
})

describe("VoiceRecorder Component", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetUserMedia.mockResolvedValue(mockStream)
  })

  test("renders phrase and recording button", () => {
    render(
      <VoiceRecorder
        phraseNumber={1}
        phraseText="Hello, this is a test phrase"
        onRecordingComplete={jest.fn()}
      />
    )

    expect(screen.getByText("Phrase 1")).toBeInTheDocument()
    expect(
      screen.getByText('"Hello, this is a test phrase"')
    ).toBeInTheDocument()
    expect(screen.getByText(/Start Recording/i)).toBeInTheDocument()
  })

  test("starts recording when button clicked", async () => {
    const user = userEvent.setup()

    render(
      <VoiceRecorder
        phraseNumber={1}
        phraseText="Test phrase"
        onRecordingComplete={jest.fn()}
      />
    )

    await user.click(screen.getByText(/Start Recording/i))

    await waitFor(() => {
      expect(mockGetUserMedia).toHaveBeenCalledWith({ audio: true })
    })

    expect(await screen.findByText(/Stop Recording/i)).toBeInTheDocument()
  })

  test("shows recording indicator while recording", async () => {
    const user = userEvent.setup()

    render(
      <VoiceRecorder
        phraseNumber={1}
        phraseText="Test phrase"
        onRecordingComplete={jest.fn()}
      />
    )

    await user.click(screen.getByText(/Start Recording/i))

    expect(await screen.findByTestId("recording-indicator")).toBeInTheDocument()
  })

  test("stops recording and calls onRecordingComplete", async () => {
    const onComplete = jest.fn()
    const user = userEvent.setup()

    render(
      <VoiceRecorder
        phraseNumber={1}
        phraseText="Test phrase"
        onRecordingComplete={onComplete}
      />
    )

    await user.click(screen.getByText(/Start Recording/i))
    await screen.findByText(/Stop Recording/i)
    await user.click(screen.getByText(/Stop Recording/i))
    const preview = await screen.findByTestId("recording-preview")
    const useButton = within(preview).getByRole("button", {
      name: /Use This Recording/i,
    })

    expect(onComplete).not.toHaveBeenCalled()

    await user.click(useButton)

    await waitFor(
      () => {
        expect(onComplete).toHaveBeenCalled()
      },
      { timeout: 3000 }
    )

    const callArgs = onComplete.mock.calls[0]
    expect(callArgs[0]).toBeInstanceOf(Blob)
    expect(typeof callArgs[1]).toBe("number") // duration
  })

  test("shows audio preview after recording", async () => {
    const onComplete = jest.fn()
    const user = userEvent.setup()

    render(
      <VoiceRecorder
        phraseNumber={1}
        phraseText="Test phrase"
        onRecordingComplete={onComplete}
      />
    )

    await user.click(screen.getByText(/Start Recording/i))
    await screen.findByText(/Stop Recording/i)
    await user.click(screen.getByText(/Stop Recording/i))
    const preview = await screen.findByTestId("recording-preview")

    expect(preview).toBeInTheDocument()
    expect(within(preview).getByTestId("recording-audio")).toBeInTheDocument()
  })

  test("allows re-recording", async () => {
    const onComplete = jest.fn()
    const user = userEvent.setup()

    render(
      <VoiceRecorder
        phraseNumber={1}
        phraseText="Test phrase"
        onRecordingComplete={onComplete}
      />
    )

    await user.click(screen.getByText(/Start Recording/i))
    await screen.findByText(/Stop Recording/i)
    await user.click(screen.getByText(/Stop Recording/i))
    const preview = await screen.findByTestId("recording-preview")
    await user.click(
      within(preview).getByRole("button", { name: /Use This Recording/i })
    )

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled()
    })

    expect(onComplete.mock.calls[0][0]).toBeInstanceOf(Blob)
  })

  test("handles microphone access error", async () => {
    mockGetUserMedia.mockRejectedValueOnce(new Error("Permission denied"))
    const user = userEvent.setup()

    render(
      <VoiceRecorder
        phraseNumber={1}
        phraseText="Test phrase"
        onRecordingComplete={jest.fn()}
      />
    )

    await user.click(screen.getByText(/Start Recording/i))
    await screen.findByText(/Failed to access microphone/i)
  })

  test("displays recording time", async () => {
    const user = userEvent.setup()

    render(
      <VoiceRecorder
        phraseNumber={1}
        phraseText="Test phrase"
        onRecordingComplete={jest.fn()}
      />
    )

    await user.click(screen.getByText(/Start Recording/i))
    await screen.findByTestId("recording-indicator")

    await waitFor(() => {
      expect(screen.getByTestId("recording-time").textContent).not.toBe(
        "0:00.0"
      )
    })
  })

  test("does not start recording when disabled", async () => {
    const user = userEvent.setup()

    render(
      <VoiceRecorder
        phraseNumber={1}
        phraseText="Disabled"
        onRecordingComplete={jest.fn()}
        disabled
      />
    )

    const startButton = screen.getByText(
      /Start Recording/i
    ) as HTMLButtonElement
    expect(startButton.disabled).toBe(true)

    await user.click(startButton)

    expect(mockGetUserMedia).not.toHaveBeenCalled()
  })
})
