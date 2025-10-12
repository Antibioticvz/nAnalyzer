import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { usersAPI } from "../../services/usersAPI"
import VoiceTraining from "../VoiceTraining"

const mockNavigate = jest.fn()

jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom")
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ userId: "user_test" }),
  }
})

jest.mock("../../contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { user_id: "user_test", voice_trained: false },
    userId: "user_test",
  }),
}))

jest.mock("../../services/usersAPI", () => ({
  usersAPI: {
    trainVoice: jest.fn(),
  },
}))

jest.mock("../../components/VoiceRecorder", () => ({
  VoiceRecorder: ({ onRecordingComplete, disabled }: any) => (
    <button
      type="button"
      onClick={() => {
        if (!disabled) {
          onRecordingComplete(new Blob(["audio"], { type: "audio/webm" }), 1.23)
        }
      }}
    >
      Mock Record Phrase
    </button>
  ),
}))

describe("VoiceTraining page", () => {
  const trainVoiceMock = usersAPI.trainVoice as jest.Mock

  beforeAll(() => {
    class MockFileReader {
      result: string | ArrayBuffer | null = null
      onloadend: null | (() => void) = null
      onerror: null | (() => void) = null

      readAsDataURL() {
        this.result = "data:audio/webm;base64,TESTDATA"
        if (this.onloadend) {
          this.onloadend()
        }
      }
    }

    // @ts-expect-error override for test environment
    global.FileReader = MockFileReader
  })

  beforeEach(() => {
    jest.clearAllMocks()
    trainVoiceMock.mockResolvedValue({
      user_id: "user_test",
      voice_trained: true,
      samples_count: 5,
      model_accuracy: 0.92,
      model_size_kb: 128,
      calibrated_threshold: 0.7,
    })
  })

  it("shows initial training instructions and progress", () => {
    render(<VoiceTraining />)

    expect(
      screen.getByRole("heading", { name: /Voice Training/i })
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Progress: 0 of 8 phrases recorded/i)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Record yourself reading each phrase/i)
    ).toBeInTheDocument()
  })

  it("records phrases and submits training when minimum clips collected", async () => {
    const user = userEvent.setup()

    render(<VoiceTraining />)

    const recordButton = screen.getByRole("button", {
      name: /Mock Record Phrase/i,
    })

    for (let i = 1; i <= 5; i += 1) {
      await user.click(recordButton)
      await waitFor(() => {
        expect(
          screen.getByText(
            new RegExp(`Progress: ${i} of 8 phrases recorded`, "i")
          )
        ).toBeInTheDocument()
      })
    }

    const submitButton = screen.getByRole("button", {
      name: /Complete Training/i,
    }) as HTMLButtonElement
    expect(submitButton.disabled).toBe(false)

    await user.click(submitButton)

    await waitFor(() => {
      expect(trainVoiceMock).toHaveBeenCalledTimes(1)
    })

    const payload = trainVoiceMock.mock.calls[0][1]
    expect(payload.audio_samples).toHaveLength(5)
    expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true })
  })

  it("allows adding a custom phrase and shows it in the list", async () => {
    const user = userEvent.setup()

    render(<VoiceTraining />)

    await user.click(screen.getByRole("button", { name: /Add Custom Phrase/i }))

    const dialog = await screen.findByRole("dialog")
    const input = within(dialog).getByLabelText(/Custom Phrase/i)
    await user.type(input, "This is my bespoke training sentence.")

    const addButton = within(dialog).getByRole("button", {
      name: /Add Phrase/i,
    })
    await user.click(addButton)

    await waitFor(() => {
      expect(
        screen.getAllByText(/bespoke training sentence/i).length
      ).toBeGreaterThan(0)
    })

    expect(
      screen.getByText(/Progress: 0 of 9 phrases recorded/i)
    ).toBeInTheDocument()
  })
})
