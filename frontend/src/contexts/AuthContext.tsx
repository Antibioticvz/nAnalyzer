import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react"
import { apiClient } from "../services/apiClient"

interface User {
  user_id: string
  name: string
  email: string
  role: string
  voice_trained: boolean
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: User | null
  userId: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (userId: string) => Promise<void>
  logout: () => void
  register: (userData: {
    name: string
    email: string
    role?: string
  }) => Promise<string>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [userId, setUserIdState] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check if user is already logged in on app start
  useEffect(() => {
    const checkAuth = async () => {
      const storedUserId = localStorage.getItem("userId")
      if (storedUserId) {
        try {
          apiClient.setUserId(storedUserId)
          const response = await apiClient.get(`/api/v1/users/${storedUserId}`)
          setUser(response.data)
          setUserIdState(storedUserId)
        } catch (error) {
          // User ID is invalid, clear it
          localStorage.removeItem("userId")
          apiClient.setUserId("")
        }
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [])

  const login = async (userId: string) => {
    setIsLoading(true)
    try {
      apiClient.setUserId(userId)
      const response = await apiClient.get(`/api/v1/users/${userId}`)
      setUser(response.data)
      setUserIdState(userId)
      localStorage.setItem("userId", userId)
    } catch (error) {
      apiClient.setUserId("")
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    setUserIdState(null)
    apiClient.setUserId("")
    localStorage.removeItem("userId")
  }

  const register = async (userData: {
    name: string
    email: string
    role?: string
  }) => {
    const response = await apiClient.post("/api/v1/users/register", userData)
    return response.data.user_id
  }

  const value: AuthContextType = {
    user,
    userId,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    register,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
