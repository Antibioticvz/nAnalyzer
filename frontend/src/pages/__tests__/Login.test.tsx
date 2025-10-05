import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { AuthProvider } from "../../contexts/AuthContext"
import { apiClient } from "../../services/apiClient"
import Login from "../Login"

// Mock apiClient
jest.mock("../../services/apiClient", () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    setUserId: jest.fn(),
  },
}))

// Mock useNavigate
const mockNavigate = jest.fn()
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ state: { from: { pathname: "/dashboard" } } }),
}))

describe("Login", () => {
  beforeEach(() => {
    mockNavigate.mockClear()
  })

  it("should render login form", () => {
    render(
      <MemoryRouter
        future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
      >
        <AuthProvider>
          <Login />
        </AuthProvider>
      </MemoryRouter>
    )

    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Sign In/i })).toBeInTheDocument()
    expect(screen.getByText(/Don't have an account\?/i)).toBeInTheDocument()
  })

  it("should show error for invalid email", async () => {
    // Mock localStorage
    const localStorageMock = {
      getItem: jest.fn().mockReturnValue(null),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    }
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
      writable: true,
    })

    render(
      <MemoryRouter
        future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
      >
        <AuthProvider>
          <Login />
        </AuthProvider>
      </MemoryRouter>
    )

    const emailInput = screen.getByLabelText(/Email Address/i)
    const submitButton = screen.getByRole("button", { name: /Sign In/i })

    fireEvent.change(emailInput, { target: { value: "invalid@example.com" } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/User not found/i)).toBeInTheDocument()
    })
  })

  it("should navigate to dashboard on successful login", async () => {
    // Mock successful API response
    const mockUser = {
      user_id: "test-user",
      name: "Test User",
      email: "test@example.com",
      role: "seller",
      voice_trained: false,
      created_at: "2025-01-01T00:00:00Z",
      updated_at: "2025-01-01T00:00:00Z",
    }
    ;(apiClient.post as jest.Mock).mockResolvedValue({ data: mockUser })

    render(
      <MemoryRouter
        future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
      >
        <AuthProvider>
          <Login />
        </AuthProvider>
      </MemoryRouter>
    )

    const emailInput = screen.getByLabelText(/Email Address/i)
    const submitButton = screen.getByRole("button", { name: /Sign In/i })

    fireEvent.change(emailInput, { target: { value: "test@example.com" } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard", { replace: true })
    })
  })

  it("should disable submit button when email is empty", () => {
    render(
      <MemoryRouter
        future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
      >
        <AuthProvider>
          <Login />
        </AuthProvider>
      </MemoryRouter>
    )

    const submitButton = screen.getByRole("button", { name: /Sign In/i })
    expect(submitButton).toBeDisabled()
  })

  it("should enable submit button when email is entered", () => {
    render(
      <MemoryRouter
        future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
      >
        <AuthProvider>
          <Login />
        </AuthProvider>
      </MemoryRouter>
    )

    const emailInput = screen.getByLabelText(/Email Address/i)
    const submitButton = screen.getByRole("button", { name: /Sign In/i })

    fireEvent.change(emailInput, { target: { value: "test@example.com" } })
    expect(submitButton).not.toBeDisabled()
  })
})
