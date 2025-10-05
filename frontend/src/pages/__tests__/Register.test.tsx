import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { AuthProvider } from "../../contexts/AuthContext"
import Register from "../Register"

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
}))

describe("Register", () => {
  it("should render registration form", () => {
    render(
      <MemoryRouter
        future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
      >
        <AuthProvider>
          <Register />
        </AuthProvider>
      </MemoryRouter>
    )

    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /Create Account/i })
    ).toBeInTheDocument()
  })
})
