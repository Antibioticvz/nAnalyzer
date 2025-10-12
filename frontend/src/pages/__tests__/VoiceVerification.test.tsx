import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { useAuth } from "../../contexts/AuthContext"
import { usersAPI } from "../../services/usersAPI"
import { convertRecordingToBase64 } from "../../utils/audio"
import VoiceVerification from "../VoiceVerification"

type MockedAuth = ReturnType<typeof useAuth>

jest.mock("../../contexts/AuthContext", () => ({
  useAuth: jest.fn(),
}))

type VoiceRecorderProps = {
  disabled?: boolean
  onRecordingComplete: (blob: Blob, duration: number) => void
}

jest.mock("../../components/VoiceRecorder", () => ({
  VoiceRecorder: ({ disabled, onRecordingComplete }: VoiceRecorderProps) => (
    <button
      type="button"
      onClick={() => onRecordingComplete(new Blob(["test"]), 1.2)}
      disabled={disabled}
    >
      Mock Recorder
    </button>
  ),
}))

jest.mock("../../services/usersAPI", () => ({
  usersAPI: {
    verifyVoice: jest.fn(),
  },
}))

jest.mock("../../utils/audio", () => ({
  convertRecordingToBase64: jest.fn(),
}))

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>
const mockedVerifyVoice = usersAPI.verifyVoice as jest.Mock
const mockedConvertRecordingToBase64 = convertRecordingToBase64 as jest.Mock

const baseAuthMock: MockedAuth = {
  user: {
    user_id: "user-1",
    name: "Tester",
    email: "tester@example.com",
    role: "seller",
    voice_trained: true,
    created_at: "2025-01-01",
    updated_at: "2025-01-01",
  },
  userId: "user-1",
  isAuthenticated: true,
  isLoading: false,
  login: jest.fn(),
  logout: jest.fn(),
  register: jest.fn(),
}

describe("VoiceVerification page", () => {
  const originalCreateObjectURL = URL.createObjectURL
  const originalRevokeObjectURL = URL.revokeObjectURL

  beforeAll(() => {
    URL.createObjectURL = jest.fn(() => "blob:mock-url")
    URL.revokeObjectURL = jest.fn()
  })

  afterAll(() => {
    URL.createObjectURL = originalCreateObjectURL
    URL.revokeObjectURL = originalRevokeObjectURL
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("disables actions when voice model is not trained", () => {
    mockedUseAuth.mockReturnValue({
      ...baseAuthMock,
      user: { ...baseAuthMock.user!, voice_trained: false },
    })
    mockedConvertRecordingToBase64.mockResolvedValue({
      base64: "",
      duration: 0,
    })

    render(<VoiceVerification />)

    expect(
      screen.getByText(/Finish voice training to unlock live verification/i)
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /Mock Recorder/i })
    ).toBeDisabled()

    // Switch to upload tab to check upload button
    fireEvent.click(screen.getByRole("tab", { name: /Upload file/i }))

    expect(
      screen.getByRole("button", { name: /Select audio file/i })
    ).toBeDisabled()
  })

  it("submits recorded audio and displays result", async () => {
    mockedUseAuth.mockReturnValue(baseAuthMock)
    mockedConvertRecordingToBase64.mockResolvedValue({
      base64: "abc",
      duration: 1.1,
    })
    mockedVerifyVoice.mockResolvedValue({
      outcome: "match",
      confidence: 0.92,
      score: -12.3,
      threshold: -20.1,
      message: "Test message",
      details: "Score details",
      recommendations: ["Keep using this model"],
    })

    render(<VoiceVerification />)

    fireEvent.click(screen.getByRole("button", { name: /Mock Recorder/i }))

    await waitFor(() => expect(mockedVerifyVoice).toHaveBeenCalledTimes(1))
    expect(mockedVerifyVoice).toHaveBeenCalledWith("user-1", {
      audio_base64: "abc",
      duration: 1.1,
      source: "recording",
    })

    expect(await screen.findByText(/Test message/)).toBeInTheDocument()
    expect(screen.getByText(/Score details/)).toBeInTheDocument()
    expect(screen.getByText(/Keep using this model/)).toBeInTheDocument()
  })

  it("uploads file and triggers verification", async () => {
    mockedUseAuth.mockReturnValue(baseAuthMock)
    mockedConvertRecordingToBase64.mockResolvedValue({
      base64: "file-base64",
      duration: 2,
    })
    mockedVerifyVoice.mockResolvedValue({
      outcome: "different_speaker",
      confidence: 0.2,
      score: -30,
      threshold: -15,
      message: "Different voice detected",
      details: "Margin -15.00",
      recommendations: ["Check login", "Retrain model"],
    })

    render(<VoiceVerification />)

    fireEvent.click(screen.getByRole("tab", { name: /Upload file/i }))

    const fileInput = screen.getByLabelText(
      /Upload audio file/i
    ) as HTMLInputElement
    const file = new File(["hello"], "call.wav", { type: "audio/wav" })
    fireEvent.change(fileInput, { target: { files: [file] } })

    fireEvent.click(screen.getByRole("button", { name: /Run verification/i }))

    await waitFor(() => expect(mockedVerifyVoice).toHaveBeenCalledTimes(1))
    expect(mockedVerifyVoice).toHaveBeenCalledWith("user-1", {
      audio_base64: "file-base64",
      duration: 2,
      source: "upload",
      filename: "call.wav",
    })
    expect(
      await screen.findByText(/Different voice detected/)
    ).toBeInTheDocument()
    expect(screen.getByText(/Check login/)).toBeInTheDocument()
  })
})
