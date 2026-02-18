export type BrowserType = 'chrome-android' | 'chrome-ios' | 'safari' | 'firefox' | 'edge' | 'samsung' | 'unknown'

export interface BrowserInstructions {
  steps: string[]
  icon: [string, string]
}

const BROWSER_NAMES: Record<BrowserType, string> = {
  'chrome-android': 'Chrome (Android)',
  'chrome-ios': 'Chrome (iOS)',
  'safari': 'Safari',
  'firefox': 'Firefox',
  'edge': 'Edge',
  'samsung': 'Samsung Internet',
  'unknown': 'Autre navigateur'
}

const BROWSER_INSTRUCTIONS: Record<BrowserType, BrowserInstructions> = {
  'chrome-android': {
    steps: [
      'Appuyez sur les trois points verticaux (⋮) en haut à droite',
      'Sélectionnez "Ajouter à l\'écran d\'accueil"',
      'Confirmez en appuyant sur "Ajouter"',
      'Le raccourci apparaîtra sur votre écran d\'accueil'
    ],
    icon: ['fas', 'globe']
  },
  'safari': {
    steps: [
      'Appuyez sur le bouton "Partager" (icône carrée avec flèche ↑) en bas de l\'écran',
      'Faites défiler vers le bas et sélectionnez "Sur l\'écran d\'accueil"',
      'Modifiez le nom si souhaité et appuyez sur "Ajouter"',
      'Le raccourci apparaîtra sur votre écran d\'accueil'
    ],
    icon: ['fas', 'compass']
  },
  'chrome-ios': {
    steps: [
      'Appuyez sur le bouton "Partager" (icône carrée avec flèche ↑)',
      'Faites défiler vers le bas et sélectionnez "Sur l\'écran d\'accueil"',
      'Modifiez le nom si souhaité et appuyez sur "Ajouter"',
      'Le raccourci apparaîtra sur votre écran d\'accueil'
    ],
    icon: ['fas', 'globe']
  },
  'firefox': {
    steps: [
      'Appuyez sur les trois points verticaux (⋮) en bas à droite',
      'Sélectionnez "Installer" ou "Ajouter à l\'écran d\'accueil"',
      'Confirmez l\'installation',
      'Le raccourci apparaîtra sur votre écran d\'accueil'
    ],
    icon: ['fas', 'fire']
  },
  'edge': {
    steps: [
      'Appuyez sur les trois points horizontaux (⋯) en bas de l\'écran',
      'Sélectionnez "Ajouter au téléphone"',
      'Choisissez "Ajouter à l\'écran d\'accueil"',
      'Le raccourci apparaîtra sur votre écran d\'accueil'
    ],
    icon: ['fas', 'window-maximize']
  },
  'samsung': {
    steps: [
      'Appuyez sur les trois lignes horizontales (≡) en bas à droite',
      'Sélectionnez "Ajouter la page à" puis "Écran d\'accueil"',
      'Confirmez en appuyant sur "Ajouter"',
      'Le raccourci apparaîtra sur votre écran d\'accueil'
    ],
    icon: ['fas', 'mobile-alt']
  },
  'unknown': {
    steps: [
      'Ouvrez le menu de votre navigateur (généralement ⋮ ou ≡)',
      'Recherchez l\'option "Ajouter à l\'écran d\'accueil" ou "Installer"',
      'Suivez les instructions à l\'écran',
      'Le raccourci apparaîtra sur votre écran d\'accueil'
    ],
    icon: ['fas', 'question-circle']
  }
}

export function useBrowserDetection() {
  /**
   * Détecte le type de navigateur basé sur le User Agent
   */
  const detectBrowser = (): BrowserType => {
    const ua = navigator.userAgent.toLowerCase()

    // Détection iOS
    const isIOS = /iphone|ipad|ipod/.test(ua)

    // Détection Android
    const isAndroid = /android/.test(ua)

    if (isIOS) {
      // Chrome sur iOS
      if (/crios/.test(ua)) {
        return 'chrome-ios'
      }
      // Firefox sur iOS
      if (/fxios/.test(ua)) {
        return 'safari' // Firefox iOS utilise WebKit, mêmes instructions que Safari
      }
      // Safari par défaut sur iOS
      return 'safari'
    }

    if (isAndroid) {
      // Samsung Internet
      if (/samsungbrowser/.test(ua)) {
        return 'samsung'
      }
      // Edge sur Android
      if (/edg/.test(ua)) {
        return 'edge'
      }
      // Firefox sur Android
      if (/firefox/.test(ua)) {
        return 'firefox'
      }
      // Chrome sur Android (par défaut car beaucoup de navigateurs sont basés sur Chrome)
      if (/chrome/.test(ua)) {
        return 'chrome-android'
      }
    }

    // Desktop ou autre - vérifier quand même les navigateurs
    if (/edg/.test(ua)) {
      return 'edge'
    }
    if (/firefox/.test(ua)) {
      return 'firefox'
    }
    if (/chrome/.test(ua)) {
      return 'chrome-android'
    }
    if (/safari/.test(ua)) {
      return 'safari'
    }

    return 'unknown'
  }

  /**
   * Retourne les instructions pour un navigateur donné
   */
  const getInstructions = (browser: BrowserType): BrowserInstructions => {
    return BROWSER_INSTRUCTIONS[browser]
  }

  /**
   * Retourne le nom lisible du navigateur
   */
  const getBrowserName = (browser: BrowserType): string => {
    return BROWSER_NAMES[browser]
  }

  /**
   * Retourne tous les types de navigateurs disponibles
   */
  const getAllBrowserTypes = (): BrowserType[] => {
    return ['chrome-android', 'safari', 'chrome-ios', 'firefox', 'edge', 'samsung', 'unknown']
  }

  /**
   * Vérifie si l'appareil est un mobile
   */
  const isMobileDevice = (): boolean => {
    return /android|iphone|ipad|ipod/i.test(navigator.userAgent)
  }

  return {
    detectBrowser,
    getInstructions,
    getBrowserName,
    getAllBrowserTypes,
    isMobileDevice
  }
}
