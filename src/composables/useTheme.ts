import { ref, watch, onMounted } from 'vue'

type Theme = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'theme-preference'

// État global partagé entre tous les composants
const theme = ref<Theme>('system')
const isDark = ref(false)

// Détecte la préférence système
const getSystemPreference = (): boolean => {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

// Applique le thème sur l'élément html
const applyTheme = (dark: boolean) => {
  isDark.value = dark
  if (dark) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

// Calcule si le mode sombre doit être actif
const computeIsDark = (themeValue: Theme): boolean => {
  if (themeValue === 'system') {
    return getSystemPreference()
  }
  return themeValue === 'dark'
}

// Initialisation (appelée une seule fois)
let initialized = false
const initialize = () => {
  if (initialized) return
  initialized = true

  // Charger la préférence depuis localStorage
  const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
  if (stored && ['light', 'dark', 'system'].includes(stored)) {
    theme.value = stored
  }

  // Synchroniser isDark avec l'état actuel du DOM (défini par le script inline)
  isDark.value = document.documentElement.classList.contains('dark')

  // Écouter les changements de préférence système
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (theme.value === 'system') {
      applyTheme(e.matches)
    }
  })
}

/**
 * Composable pour gérer le thème dark/light
 */
export function useTheme() {
  // Initialiser au premier appel
  onMounted(() => {
    initialize()
  })

  // Watcher pour persister et appliquer les changements
  watch(theme, (newTheme) => {
    localStorage.setItem(STORAGE_KEY, newTheme)
    applyTheme(computeIsDark(newTheme))
  })

  /**
   * Définir le thème
   */
  const setTheme = (newTheme: Theme) => {
    theme.value = newTheme
  }

  /**
   * Basculer entre light et dark (ignore system)
   */
  const toggleTheme = () => {
    theme.value = isDark.value ? 'light' : 'dark'
  }

  return {
    theme,
    isDark,
    setTheme,
    toggleTheme,
  }
}
