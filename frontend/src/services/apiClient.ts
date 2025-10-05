/**
 * API client for nAnalyzer backend
 * Centralized HTTP client with error handling
 */
import axios, { AxiosError, AxiosInstance } from "axios"
import { APIError } from "../types/api"

// Use environment variable with fallback
// In production: set REACT_APP_API_BASE_URL or VITE_API_BASE_URL
// In tests: defaults to localhost:8000
const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:8000"

class APIClient {
  private client: AxiosInstance
  private userId: string | null = null

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        "Content-Type": "application/json",
      },
    })

    // Request interceptor to add user ID header
    this.client.interceptors.request.use(config => {
      if (this.userId) {
        config.headers["X-User-ID"] = this.userId
      }
      return config
    })

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      response => response,
      (error: AxiosError<APIError>) => {
        if (error.response?.data) {
          throw new Error(error.response.data.message || "API request failed")
        }
        throw error
      }
    )
  }

  setUserId(userId: string) {
    this.userId = userId
  }

  getUserId(): string | null {
    return this.userId
  }

  getClient(): AxiosInstance {
    return this.client
  }

  // HTTP methods
  get(url: string, config?: any) {
    return this.client.get(url, config)
  }

  post(url: string, data?: any, config?: any) {
    return this.client.post(url, data, config)
  }

  put(url: string, data?: any, config?: any) {
    return this.client.put(url, data, config)
  }

  delete(url: string, config?: any) {
    return this.client.delete(url, config)
  }
}

export const apiClient = new APIClient()
export default apiClient.getClient()
