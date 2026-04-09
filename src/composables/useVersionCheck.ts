import { ref, onMounted, onUnmounted } from 'vue'

const VERSION_CHECK_INTERVAL = 300000 // 5 minutes
const VERSION_STORAGE_KEY = 'app_version'
const DISMISSED_VERSION_KEY = 'dismissed_update_version'

interface VersionInfo {
  version: string
  buildTime: string
}

// État global partagé entre les instances
const newVersionAvailable = ref(false)
const newVersion = ref<string | null>(null)
const currentVersion = ref<string | null>(null)

let checkInterval: ReturnType<typeof setInterval> | null = null
let isInitialized = false

/**
 * Récupère la version depuis le serveur (avec cache-busting)
 */
const fetchVersion = async (): Promise<VersionInfo | null> => {
  try {
    const response = await fetch(`/version.json?t=${Date.now()}`, {
      cache: 'no-store'
    })
    if (!response.ok) return null
    return await response.json()
  } catch {
    console.warn('[VersionCheck] Impossible de récupérer la version')
    return null
  }
}

/**
 * Effectue la mise à jour : vide le cache et recharge la page
 */
const performUpdate = async () => {
  // Mettre à jour la version stockée avant le refresh
  if (newVersion.value) {
    localStorage.setItem(VERSION_STORAGE_KEY, newVersion.value)
  }

  // Nettoyer la version ignorée
  sessionStorage.removeItem(DISMISSED_VERSION_KEY)

  // Vider tous les caches (Service Worker, Cache API)
  if ('caches' in window) {
    try {
      const cacheNames = await caches.keys()
      await Promise.all(cacheNames.map(name => caches.delete(name)))
    } catch {
      console.warn('[VersionCheck] Impossible de vider le cache')
    }
  }

  // Hard refresh
  window.location.reload()
}

/**
 * Vérifie si une nouvelle version est disponible
 * @param isInitialCheck - true si c'est la vérification au chargement de la page
 */
const checkVersion = async (isInitialCheck = false) => {
  const versionInfo = await fetchVersion()
  if (!versionInfo) return

  const storedVersion = localStorage.getItem(VERSION_STORAGE_KEY)

  if (!storedVersion) {
    // Première visite : stocker la version actuelle
    localStorage.setItem(VERSION_STORAGE_KEY, versionInfo.version)
    currentVersion.value = versionInfo.version
  } else if (storedVersion !== versionInfo.version) {
    // Nouvelle version détectée
    if (isInitialCheck) {
      // Chargement initial : mise à jour automatique
      console.log('[VersionCheck] Nouvelle version détectée au chargement, mise à jour automatique...')
      newVersion.value = versionInfo.version
      await performUpdate()
    } else {
      // Polling : vérifier si l'utilisateur n'a pas déjà ignoré cette version
      const dismissedVersion = sessionStorage.getItem(DISMISSED_VERSION_KEY)
      if (dismissedVersion !== versionInfo.version) {
        newVersionAvailable.value = true
        newVersion.value = versionInfo.version
        currentVersion.value = storedVersion
      }
    }
  }
}

/**
 * Ignorer la mise à jour pour cette session
 */
const dismissUpdate = () => {
  if (newVersion.value) {
    sessionStorage.setItem(DISMISSED_VERSION_KEY, newVersion.value)
  }
  newVersionAvailable.value = false
}

/**
 * Démarre la vérification périodique
 */
const startVersionCheck = async () => {
  if (isInitialized) return
  isInitialized = true

  // Vérification initiale (avec auto-update si nouvelle version)
  await checkVersion(true)

  // Vérification périodique (affiche le bandeau sans auto-update)
  checkInterval = setInterval(() => checkVersion(false), VERSION_CHECK_INTERVAL)
}

/**
 * Arrête la vérification périodique
 */
const stopVersionCheck = () => {
  if (checkInterval) {
    clearInterval(checkInterval)
    checkInterval = null
  }
}

/**
 * Composable pour la vérification de version
 * Active uniquement en production
 */
export function useVersionCheck() {
  onMounted(() => {
    // Actif uniquement en production
    if (import.meta.env.PROD) {
      startVersionCheck()
    }
  })

  onUnmounted(() => {
    stopVersionCheck()
  })

  return {
    newVersionAvailable,
    newVersion,
    currentVersion,
    performUpdate,
    dismissUpdate
  }
}
