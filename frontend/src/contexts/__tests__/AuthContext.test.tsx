import { act, render, screen, waitFor } from "@testing-library/react"
import React from "react"
import { AuthProvider, useAuth } from "../AuthContext"

import { apiClient } from "../../services/apiClient"

// Mock apiClient
jest.mock("../../services/apiClient", () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    setUserId: jest.fn(),
  },
}))

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
})

// Test component that uses auth context
const TestComponent: React.FC = () => {
  const { user, userId, isAuthenticated, login, logout, register } = useAuth()

  const handleLogin = async () => {
    try {
      await login("test@example.com")
    } catch (error) {
      // Handle login error
    }
  }

  return (
    <div>
      <div data-testid="user">{user ? user.name : "No user"}</div>
      <div data-testid="userId">{userId || "No userId"}</div>
      <div data-testid="isAuthenticated">
        {isAuthenticated ? "true" : "false"}
      </div>
      <button onClick={handleLogin}>Login</button>
      <button onClick={logout}>Logout</button>
      <button
        onClick={() => register({ name: "Test", email: "test@example.com" })}
      >
        Register
      </button>
    </div>
  )
}

describe("AuthContext", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
    localStorageMock.setItem.mockClear()
    localStorageMock.removeItem.mockClear()
  })

  it("should provide default auth state", async () => {
    ;(apiClient.get as jest.Mock).mockRejectedValue(new Error("User not found"))

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId("user")).toHaveTextContent("No user")
    })

    expect(screen.getByTestId("userId")).toHaveTextContent("No userId")
    expect(screen.getByTestId("isAuthenticated")).toHaveTextContent("false")
  })

  it("should restore user from localStorage on mount", async () => {
    const mockUser = {
      user_id: "test-user",
      name: "Test User",
      email: "test@example.com",
      role: "seller",
      voice_trained: false,
      created_at: "2025-01-01T00:00:00Z",
      updated_at: "2025-01-01T00:00:00Z",
    }

    localStorageMock.getItem.mockReturnValue("test-user")
    ;(apiClient.get as jest.Mock).mockResolvedValue({ data: mockUser })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId("user")).toHaveTextContent("Test User")
    })

    expect(screen.getByTestId("userId")).toHaveTextContent("test-user")
    expect(screen.getByTestId("isAuthenticated")).toHaveTextContent("true")

    expect(apiClient.get).toHaveBeenCalledWith("/api/v1/users/test-user")
  })

  it("should handle login successfully", async () => {
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
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    const loginButton = screen.getByText("Login")
    await act(async () => {
      loginButton.click()
    })

    await waitFor(() => {
      expect(screen.getByTestId("user")).toHaveTextContent("Test User")
    })

    expect(screen.getByTestId("userId")).toHaveTextContent("test-user")
    expect(screen.getByTestId("isAuthenticated")).toHaveTextContent("true")

    expect(localStorageMock.setItem).toHaveBeenCalledWith("userId", "test-user")
    expect(apiClient.post).toHaveBeenCalledWith("/api/v1/users/login", {
      email: "test@example.com",
    })
  })

  it("should handle login failure", async () => {
    ;(apiClient.post as jest.Mock).mockRejectedValue(
      new Error("User not found")
    )

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    const loginButton = screen.getByText("Login")

    // Mock console.error to avoid test output pollution
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {})

    await act(async () => {
      try {
        loginButton.click()
      } catch (error) {
        // Expected error for failed login
      }
    })

    await waitFor(() => {
      expect(screen.getByTestId("isAuthenticated")).toHaveTextContent("false")
    })

    consoleSpy.mockRestore()
  })

  it("should handle logout", async () => {
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
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    // First login
    const loginButton = screen.getByText("Login")
    await act(async () => {
      loginButton.click()
    })

    await waitFor(() => {
      expect(screen.getByTestId("isAuthenticated")).toHaveTextContent("true")
    })

    // Then logout
    const logoutButton = screen.getByText("Logout")
    await act(async () => {
      logoutButton.click()
    })

    expect(screen.getByTestId("user")).toHaveTextContent("No user")
    expect(screen.getByTestId("userId")).toHaveTextContent("No userId")
    expect(screen.getByTestId("isAuthenticated")).toHaveTextContent("false")
    expect(localStorageMock.removeItem).toHaveBeenCalledWith("userId")
  })

  it("should handle registration", async () => {
    const mockResponse = {
      data: {
        user_id: "new-user-123",
        name: "Test",
        email: "test@example.com",
        role: "seller",
        voice_trained: false,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      },
    }
    ;(apiClient.post as jest.Mock).mockResolvedValue(mockResponse)

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    const registerButton = screen.getByText("Register")
    await act(async () => {
      registerButton.click()
    })

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith("/api/v1/users/register", {
        name: "Test",
        email: "test@example.com",
      })
    })

    expect(apiClient.setUserId).toHaveBeenCalledWith("new-user-123")
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "userId",
      "new-user-123"
    )

    expect(await screen.findByTestId("user")).toHaveTextContent("Test")
    expect(screen.getByTestId("userId")).toHaveTextContent("new-user-123")
  })
})
