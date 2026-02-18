/**
 * Composable pour afficher un badge de notification sur le favicon
 * Utilise un canvas pour dessiner dynamiquement le badge sur l'icône
 */

const FAVICON_SIZE = 32
const BADGE_SIZE = 14
const BADGE_FONT_SIZE = 10

// Stocker le favicon original pour pouvoir le restaurer
let originalFaviconUrl: string | null = null
let faviconCanvas: HTMLCanvasElement | null = null
let faviconCtx: CanvasRenderingContext2D | null = null
let faviconImage: HTMLImageElement | null = null
let isInitialized = false

/**
 * Initialise le canvas et charge le favicon original
 */
const initFavicon = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (isInitialized && faviconImage?.complete) {
      resolve()
      return
    }

    // Créer le canvas
    faviconCanvas = document.createElement('canvas')
    faviconCanvas.width = FAVICON_SIZE
    faviconCanvas.height = FAVICON_SIZE
    faviconCtx = faviconCanvas.getContext('2d')

    if (!faviconCtx) {
      reject(new Error('Cannot get canvas context'))
      return
    }

    // Récupérer le favicon actuel
    const linkElement = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
    if (linkElement) {
      originalFaviconUrl = linkElement.href
    } else {
      // Fallback au favicon par défaut
      originalFaviconUrl = '/src/assets/favicon.png'
    }

    // Charger l'image du favicon
    faviconImage = new Image()
    faviconImage.crossOrigin = 'anonymous'

    faviconImage.onload = () => {
      isInitialized = true
      resolve()
    }

    faviconImage.onerror = () => {
      // En cas d'erreur, essayer avec le chemin relatif
      if (faviconImage && originalFaviconUrl !== '/favicon.png') {
        originalFaviconUrl = '/favicon.png'
        faviconImage.src = originalFaviconUrl
      } else {
        reject(new Error('Cannot load favicon image'))
      }
    }

    faviconImage.src = originalFaviconUrl
  })
}

/**
 * Met à jour le favicon avec le nombre de notifications
 */
const updateFavicon = (count: number): void => {
  if (!faviconCanvas || !faviconCtx || !faviconImage) {
    console.warn('[useFaviconBadge] Favicon not initialized')
    return
  }

  // Effacer le canvas
  faviconCtx.clearRect(0, 0, FAVICON_SIZE, FAVICON_SIZE)

  // Dessiner le favicon original
  faviconCtx.drawImage(faviconImage, 0, 0, FAVICON_SIZE, FAVICON_SIZE)

  // Si count > 0, dessiner le badge
  if (count > 0) {
    const displayCount = count > 99 ? '99+' : String(count)

    // Position du badge (coin supérieur droit)
    const badgeX = FAVICON_SIZE - BADGE_SIZE
    const badgeY = 0

    // Largeur dynamique pour les grands nombres
    const badgeWidth = displayCount.length > 2 ? BADGE_SIZE + 4 : BADGE_SIZE
    const badgeXAdjusted = FAVICON_SIZE - badgeWidth

    // Dessiner le fond du badge (cercle rouge)
    faviconCtx.beginPath()
    if (displayCount.length > 2) {
      // Forme pilule pour "99+"
      const radius = BADGE_SIZE / 2
      faviconCtx.roundRect(badgeXAdjusted, badgeY, badgeWidth, BADGE_SIZE, radius)
    } else {
      // Cercle pour les petits nombres
      faviconCtx.arc(
        badgeX + BADGE_SIZE / 2,
        badgeY + BADGE_SIZE / 2,
        BADGE_SIZE / 2,
        0,
        Math.PI * 2
      )
    }
    faviconCtx.fillStyle = '#ef4444' // Rouge (danger)
    faviconCtx.fill()

    // Bordure blanche pour meilleure visibilité
    faviconCtx.strokeStyle = '#ffffff'
    faviconCtx.lineWidth = 1
    faviconCtx.stroke()

    // Dessiner le texte
    faviconCtx.fillStyle = '#ffffff'
    faviconCtx.font = `bold ${BADGE_FONT_SIZE}px Arial, sans-serif`
    faviconCtx.textAlign = 'center'
    faviconCtx.textBaseline = 'middle'

    const textX = displayCount.length > 2
      ? badgeXAdjusted + badgeWidth / 2
      : badgeX + BADGE_SIZE / 2
    const textY = badgeY + BADGE_SIZE / 2

    faviconCtx.fillText(displayCount, textX, textY)
  }

  // Mettre à jour le favicon dans le DOM
  const dataUrl = faviconCanvas.toDataURL('image/png')
  let linkElement = document.querySelector<HTMLLinkElement>('link[rel="icon"]')

  if (!linkElement) {
    linkElement = document.createElement('link')
    linkElement.rel = 'icon'
    linkElement.type = 'image/png'
    document.head.appendChild(linkElement)
  }

  linkElement.href = dataUrl
}

/**
 * Restaure le favicon original (sans badge)
 */
const restoreFavicon = (): void => {
  if (originalFaviconUrl) {
    const linkElement = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
    if (linkElement) {
      linkElement.href = originalFaviconUrl
    }
  }
}

/**
 * Composable pour gérer le badge sur le favicon
 */
export function useFaviconBadge() {
  let currentCount = 0

  /**
   * Met à jour le badge avec le nombre spécifié
   */
  const setBadgeCount = async (count: number): Promise<void> => {
    currentCount = count

    try {
      await initFavicon()
      updateFavicon(count)
    } catch (error) {
      console.error('[useFaviconBadge] Error updating favicon:', error)
    }
  }

  /**
   * Efface le badge (remet le favicon original)
   */
  const clearBadge = (): void => {
    currentCount = 0
    restoreFavicon()
  }

  /**
   * Retourne le nombre actuel affiché
   */
  const getCurrentCount = (): number => {
    return currentCount
  }

  return {
    setBadgeCount,
    clearBadge,
    getCurrentCount
  }
}

// Export d'une instance singleton pour utilisation globale
let singletonInstance: ReturnType<typeof useFaviconBadge> | null = null

export function getFaviconBadgeInstance(): ReturnType<typeof useFaviconBadge> {
  if (!singletonInstance) {
    singletonInstance = useFaviconBadge()
  }
  return singletonInstance
}
