import { ref, computed } from 'vue'
import { usersService } from '@/services/users'
import type { UserDTO } from '@/models'

/**
 * Fenêtre (en jours) pendant laquelle un compte récemment créé et non activé
 * est considéré « en attente d'activation ».
 */
const PENDING_WINDOW_DAYS = 7
const PENDING_WINDOW_MS = PENDING_WINDOW_DAYS * 24 * 60 * 60 * 1000

// État partagé (singleton au niveau module) — accessible depuis la navbar
// (badge) et la page Utilisateurs (section d'activation).
const pendingUsers = ref<UserDTO[]>([])
const loading = ref(false)
let loaded = false

/**
 * Vrai si le compte a été créé il y a moins de PENDING_WINDOW_DAYS jours.
 */
const isRecentlyCreated = (createdAt?: Date | string): boolean => {
  if (!createdAt) return false
  const created = new Date(createdAt).getTime()
  if (Number.isNaN(created)) return false
  const ageMs = Date.now() - created
  return ageMs >= 0 && ageMs <= PENDING_WINDOW_MS
}

/**
 * Un compte est « en attente d'activation » s'il n'est pas actif et qu'il a
 * été créé récemment.
 */
export const isPendingActivation = (user: UserDTO): boolean =>
  user.isActive === false && isRecentlyCreated(user.createdAt)

/**
 * Composable partagé pour suivre les comptes récemment créés et non activés.
 * - La navbar l'utilise pour afficher un badge sur le lien « Utilisateurs ».
 * - La page Utilisateurs l'utilise pour afficher la section d'activation.
 */
export function usePendingUsers() {
  const pendingCount = computed(() => pendingUsers.value.length)

  /**
   * Charge la liste des utilisateurs (endpoint admin) et en extrait les
   * comptes en attente. Échoue silencieusement : un badge ne doit jamais
   * bloquer l'application.
   * @param force - recharge même si déjà chargé
   */
  const loadPendingUsers = async (force = false) => {
    if (loading.value) return
    if (loaded && !force) return
    loading.value = true
    try {
      const res = await usersService.getUsers()
      const list = Array.isArray(res?.data) ? res.data : []
      pendingUsers.value = list.filter(isPendingActivation)
      loaded = true
    } catch {
      // silencieux
    } finally {
      loading.value = false
    }
  }

  /**
   * Remplace l'état à partir d'une liste déjà récupérée (évite un second
   * appel réseau quand la page Utilisateurs a déjà chargé tous les comptes).
   */
  const setFromUsers = (list: UserDTO[]) => {
    pendingUsers.value = (list ?? []).filter(isPendingActivation)
    loaded = true
  }

  /** Retire un compte de la liste (après activation). */
  const removePending = (uuid?: string) => {
    if (!uuid) return
    pendingUsers.value = pendingUsers.value.filter(u => u.uuid !== uuid)
  }

  /** Réinitialise l'état (déconnexion / perte des droits admin). */
  const reset = () => {
    pendingUsers.value = []
    loaded = false
  }

  return {
    pendingUsers,
    pendingCount,
    loading,
    loadPendingUsers,
    setFromUsers,
    removePending,
    reset,
  }
}
