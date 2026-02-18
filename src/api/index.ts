import { ApiClient } from './ApiClient'
import { API_URL, getAuthToken } from '@/config/api'

/**
 * Create the main API client instance with authentication interceptor
 */
export const apiClient = new ApiClient({
  baseURL: API_URL,
  timeout: 30000,
  requestInterceptors: [
    // Add authentication token to requests
    (config) => {
      const token = getAuthToken()
      if (token) {
        config.headers = {
          ...config.headers,
          'Authorization': `Bearer ${token}`
        }
      }
      return config
    }
  ],
  responseInterceptors: [
    // Handle 401 responses (unauthorized)
    async (response) => {
      if (response.status === 401) {
        // Clear token and redirect to login
        // This could be enhanced with a router redirect
        localStorage.removeItem('auth_token')
        console.warn('Unauthorized: Token expired or invalid')
      }
      return response
    }
  ]
})

/**
 * Export ApiClient class for custom instances
 */
export { ApiClient, ApiError } from './ApiClient'
export type { ApiClientConfig, RequestInterceptor, ResponseInterceptor } from './ApiClient'
