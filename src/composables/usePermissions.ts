import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { UserRole, USER_ROLE_UUIDS } from '@/enums'

/**
 * Composable pour gérer les permissions basées sur les rôles
 */
export function usePermissions() {
  const authStore = useAuthStore()

  // Computed properties pour vérifier les rôles
  const isAdmin = computed(() => authStore.userRoleUuid === USER_ROLE_UUIDS.ADMINISTRATEUR)
  const isMechanic = computed(() => authStore.userRoleUuid === USER_ROLE_UUIDS.MECANICIEN)
  const isUser = computed(() => authStore.userRoleUuid === USER_ROLE_UUIDS.UTILISATEUR)
  const userRole = computed(() => authStore.userRole)

  // Mode de vue utilisateur (pour admin/mécanicien)
  const isViewingAsUser = computed(() => authStore.viewAsUser)
  const canToggleViewMode = computed(() => authStore.canToggleViewMode)

  /**
   * Vérifie si l'utilisateur a l'un des rôles requis
   * @param requiredRoles - Liste des rôles autorisés
   * @returns true si l'utilisateur a l'un des rôles requis
   */
  const hasRole = (requiredRoles?: UserRole[]): boolean => {
    if (!requiredRoles || requiredRoles.length === 0) return true
    if (!userRole.value) return false

    // Si en mode "vue utilisateur", simuler le rôle UTILISATEUR
    if (isViewingAsUser.value && (isAdmin.value || isMechanic.value)) {
      return requiredRoles.includes(UserRole.UTILISATEUR)
    }

    return requiredRoles.includes(userRole.value as UserRole)
  }

  /**
   * Vérifie si l'utilisateur a une permission spéciale
   * @param permission - Nom de la permission (ex: 'couchette')
   * @returns true si l'utilisateur a la permission
   */
  const hasPermission = (permission: string): boolean => {
    if (permission === 'couchette') {
      return authStore.user?.isCouchette ?? false
    }
    return false
  }

  /**
   * Vérifie si l'utilisateur peut accéder à une ressource
   * @param requiredRoles - Rôles requis
   * @param requiredPermissions - Permissions spéciales requises
   * @returns true si l'utilisateur a accès
   */
  const canAccess = (
    requiredRoles?: UserRole[],
    requiredPermissions?: string[]
  ): boolean => {
    const hasRequiredRole = hasRole(requiredRoles)
    const hasRequiredPermissions = requiredPermissions
      ? requiredPermissions.every(hasPermission)
      : true

    return hasRequiredRole && hasRequiredPermissions
  }

  // Actions de changement de mode
  const toggleViewMode = () => authStore.toggleViewMode()
  const setViewMode = (asUser: boolean) => authStore.setViewMode(asUser)

  return {
    // Computed
    isAdmin,
    isMechanic,
    isUser,
    userRole,
    isViewingAsUser,
    canToggleViewMode,
    ROLE_UUIDS: USER_ROLE_UUIDS,
    // Functions
    hasRole,
    hasPermission,
    canAccess,
    toggleViewMode,
    setViewMode
  }
}
