import { computed, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { USER_ROLE_UUIDS } from '@/enums'
import { changelog, type ChangelogEntry, type ChangeRole, type Change } from '@/data/changelog'

const CHANGELOG_STORAGE_KEY = 'changelog_last_seen_version'

type UserRoleKey = 'admin' | 'mechanic' | 'user'

/**
 * Role hierarchy for changelog visibility
 * - admin sees all changes
 * - mechanic sees mechanic + user + all changes
 * - user sees user + all changes
 */
const ROLE_HIERARCHY: Record<UserRoleKey, ChangeRole[]> = {
  admin: ['all', 'user', 'mechanic', 'admin'],
  mechanic: ['all', 'user', 'mechanic'],
  user: ['all', 'user'],
}

/**
 * Composable for managing changelog display with role-based filtering
 */
export function useChangelog() {
  const authStore = useAuthStore()
  const lastSeenVersion = ref<string | null>(localStorage.getItem(CHANGELOG_STORAGE_KEY))

  /**
   * Get the user's role key for hierarchy lookup
   */
  const getUserRoleKey = (): UserRoleKey => {
    const roleUuid = authStore.userRoleUuid
    if (roleUuid === USER_ROLE_UUIDS.ADMINISTRATEUR) return 'admin'
    if (roleUuid === USER_ROLE_UUIDS.MECANICIEN) return 'mechanic'
    return 'user'
  }

  /**
   * Get allowed roles for the current user
   */
  const allowedRoles = computed<ChangeRole[]>(() => {
    const roleKey = getUserRoleKey()
    return ROLE_HIERARCHY[roleKey] ?? ROLE_HIERARCHY.user
  })

  /**
   * Filter changes based on user's role
   */
  const filterChangesByRole = (changes: Change[]): Change[] => {
    return changes.filter(change => allowedRoles.value.includes(change.role))
  }

  /**
   * Get the latest changelog entry with changes filtered by role
   */
  const latestEntry = computed<ChangelogEntry | null>(() => {
    if (changelog.length === 0) return null

    const latest = changelog[0]
    if (!latest) return null

    const filteredChanges = filterChangesByRole(latest.changes)

    // Return null if no visible changes for this role
    if (filteredChanges.length === 0) return null

    return {
      ...latest,
      changes: filteredChanges
    }
  })

  /**
   * Get the latest version string
   */
  const latestVersion = computed<string | null>(() => {
    return changelog[0]?.version ?? null
  })

  /**
   * Check if there are unseen changes
   * True if: user is authenticated AND latest version differs from last seen
   */
  const hasUnseenChanges = computed<boolean>(() => {
    if (!authStore.isAuthenticated) return false
    if (!latestVersion.value) return false
    if (!latestEntry.value) return false // No visible changes for this role

    return lastSeenVersion.value !== latestVersion.value
  })

  /**
   * Mark the current version as seen
   */
  const markAsSeen = (): void => {
    if (latestVersion.value) {
      localStorage.setItem(CHANGELOG_STORAGE_KEY, latestVersion.value)
      lastSeenVersion.value = latestVersion.value
    }
  }

  return {
    latestEntry,
    latestVersion,
    hasUnseenChanges,
    markAsSeen
  }
}
