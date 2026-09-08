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
    // L'API renvoie 401 pour : header absent, token inconnu, compte inactif, aucun rôle,
    // ET pour un rôle insuffisant ("Access denied: Required role is ..."). Ce dernier cas
    // est un problème d'autorisation, pas d'authentification : on ne déconnecte pas.
    async (response) => {
      if (response.status === 401) {
        let message = ''
        try {
          const body = await response.clone().json() as { message?: string }
          message = body?.message ?? ''
        } catch {
          // Corps non JSON : on traite comme une authentification invalide
        }

        if (!message.startsWith('Access denied: Required role')) {
          localStorage.removeItem('auth_token')
          localStorage.removeItem('user')
          console.warn('Unauthorized: token invalide ou compte inactif —', message)

          // Déconnexion propre du store + retour au login (imports dynamiques pour
          // éviter les dépendances circulaires api → stores → services → api)
          try {
            const { useAuthStore } = await import('@/stores/auth')
            useAuthStore().logout()
          } catch {
            // Pinia non initialisé : le localStorage est déjà nettoyé
          }
          if (!window.location.pathname.startsWith('/login')) {
            const { default: router } = await import('@/router')
            router.push('/login')
          }
        }
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
