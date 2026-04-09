import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService } from '@/services'
import type { LoginRequest, LoginResponse, UserDTO } from '@/models'
import { ApiError } from '@/api'
import { USER_ROLE_UUIDS } from '@/enums'

// Re-export pour compatibilité avec l'ancien code
export const ROLE_UUIDS = USER_ROLE_UUIDS

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<UserDTO | null>(null)
  const token = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const viewAsUser = ref(false)

  // Getters
  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const isEmailVerified = computed(() => user.value?.isMailVerified || false)
  const isActive = computed(() => user.value?.isActive || false)
  const userRole = computed(() => user.value?.role?.nom || null)
  const userRoleUuid = computed(() => user.value?.role?.uuid || null)
  const isAdmin = computed(() => userRoleUuid.value === USER_ROLE_UUIDS.ADMINISTRATEUR)
  const isMechanic = computed(() => userRoleUuid.value === USER_ROLE_UUIDS.MECANICIEN)
  const isUser = computed(() => userRoleUuid.value === USER_ROLE_UUIDS.UTILISATEUR)
  const canToggleViewMode = computed(() => isAdmin.value || isMechanic.value)
  const hasCouchettePermission = computed(() => user.value?.isCouchette === true)

  // Actions
  const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
    try {
      loading.value = true
      error.value = null

      const response = await authService.login(credentials)

      // Le service authService stocke déjà le token via setAuthToken
      // Extraire le token depuis l'objet user ou depuis la racine (compatibilité)
      const authToken = response.user?.token || response.token

      if (authToken && response.user) {
        user.value = response.user
        token.value = authToken

        // Sauvegarder l'utilisateur dans localStorage
        localStorage.setItem('user', JSON.stringify(response.user))
      }

      return response

    } catch (err) {
      if (err instanceof ApiError) {
        error.value = err.message
      } else if (err instanceof Error) {
        error.value = err.message
      } else {
        error.value = 'Erreur lors de la connexion'
      }
      throw err
    } finally {
      loading.value = false
    }
  }

  const logout = (): void => {
    user.value = null
    token.value = null
    error.value = null
    viewAsUser.value = false

    // Supprimer du localStorage
    authService.logout() // Utilise clearAuthToken du service
    localStorage.removeItem('user')
  }

  const toggleViewMode = (): void => {
    if (isAdmin.value || isMechanic.value) {
      viewAsUser.value = !viewAsUser.value
    }
  }

  const setViewMode = (asUser: boolean): void => {
    if (isAdmin.value || isMechanic.value) {
      viewAsUser.value = asUser
    }
  }

  const loadFromStorage = (): void => {
    const storedToken = localStorage.getItem('auth_token') // Nouveau nom cohérent
    const storedUser = localStorage.getItem('user')

    if (storedToken && storedUser) {
      try {
        token.value = storedToken
        user.value = JSON.parse(storedUser)
      } catch (err) {
        console.error('Error loading user from storage:', err)
        logout()
      }
    }
  }

  /**
   * Refresh user data from the API
   * Calls /auth/me to get the latest user information
   * @param showLoading - Si true, affiche l'état loading (false au démarrage pour ne pas bloquer le rendu)
   */
  const refreshUser = async (showLoading = true): Promise<void> => {
    if (!token.value) return

    try {
      if (showLoading) loading.value = true
      const response = await authService.getMe()

      if (response.user) {
        user.value = response.user
        // Update localStorage with fresh data
        localStorage.setItem('user', JSON.stringify(response.user))
      }
    } catch (err) {
      // If refresh fails (e.g., token expired), logout
      if (err instanceof ApiError && err.status === 401) {
        logout()
      } else {
        console.error('Error refreshing user data:', err)
      }
    } finally {
      loading.value = false
    }
  }

  // Charger les données au démarrage
  loadFromStorage()

  // Si un token existe, rafraîchir les données utilisateur en arrière-plan
  // (sans loading=true pour ne pas bloquer le rendu — on a déjà les données du localStorage)
  if (token.value) {
    refreshUser(false)
  }

  return {
    // State
    user,
    token,
    loading,
    error,
    viewAsUser,
    // Getters
    isAuthenticated,
    isEmailVerified,
    isActive,
    userRole,
    userRoleUuid,
    isAdmin,
    isMechanic,
    isUser,
    canToggleViewMode,
    hasCouchettePermission,
    // Actions
    login,
    logout,
    loadFromStorage,
    refreshUser,
    toggleViewMode,
    setViewMode
  }
})
