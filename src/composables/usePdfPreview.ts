import * as pdfjsLib from 'pdfjs-dist'
import type { PDFDocumentProxy } from 'pdfjs-dist'

// Configure le worker PDF.js - utiliser le worker local ou CDN
const PDFJS_VERSION = '4.0.379'
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.mjs`

/**
 * Cache des prévisualisations PDF pour éviter de les recalculer
 */
const previewCache = new Map<string, string>()

/**
 * Génère une prévisualisation d'un PDF à partir de son contenu base64
 * @param base64Data - Contenu du PDF en base64
 * @param width - Largeur souhaitée de la prévisualisation (défaut: 200)
 * @returns Promise avec l'URL data de l'image de prévisualisation
 */
export async function generatePdfPreview(base64Data: string, width = 200): Promise<string> {
  // Vérifier le cache
  const cacheKey = `${base64Data.substring(0, 100)}_${width}`
  if (previewCache.has(cacheKey)) {
    return previewCache.get(cacheKey)!
  }

  let pdf: PDFDocumentProxy | null = null

  try {
    // Convertir base64 en Uint8Array
    const binaryString = atob(base64Data)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    // Charger le document PDF avec options
    const loadingTask = pdfjsLib.getDocument({
      data: bytes,
      useSystemFonts: true,
      disableFontFace: false
    })

    pdf = await loadingTask.promise

    // Obtenir la première page
    const page = await pdf.getPage(1)

    // Calculer l'échelle pour la largeur souhaitée
    const viewport = page.getViewport({ scale: 1 })
    const scale = width / viewport.width
    const scaledViewport = page.getViewport({ scale })

    // Créer un canvas pour le rendu
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')

    if (!context) {
      throw new Error('Impossible de créer le contexte canvas')
    }

    canvas.width = Math.floor(scaledViewport.width)
    canvas.height = Math.floor(scaledViewport.height)

    // Fond blanc pour le canvas
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, canvas.width, canvas.height)

    // Rendre la page sur le canvas
    const renderContext = {
      canvasContext: context,
      viewport: scaledViewport,
      background: 'white'
    }

    await page.render(renderContext).promise

    // Convertir en image
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.85)

    // Mettre en cache
    previewCache.set(cacheKey, imageDataUrl)

    return imageDataUrl
  } catch (error) {
    console.error('Erreur lors de la génération de la prévisualisation PDF:', error)
    throw error
  } finally {
    // Nettoyer les ressources
    if (pdf) {
      await pdf.destroy()
    }
  }
}

/**
 * Génère une prévisualisation d'un PDF à partir de son URL
 * @param url - URL du PDF
 * @param width - Largeur souhaitée de la prévisualisation (défaut: 200)
 * @returns Promise avec l'URL data de l'image de prévisualisation
 */
export async function generatePdfPreviewFromUrl(url: string, width = 200): Promise<string> {
  // Vérifier le cache
  const cacheKey = `url_${url}_${width}`
  if (previewCache.has(cacheKey)) {
    return previewCache.get(cacheKey)!
  }

  let pdf: PDFDocumentProxy | null = null

  try {
    // Charger le document PDF depuis l'URL
    const loadingTask = pdfjsLib.getDocument({
      url,
      useSystemFonts: true,
      disableFontFace: false
    })

    pdf = await loadingTask.promise

    // Obtenir la première page
    const page = await pdf.getPage(1)

    // Calculer l'échelle pour la largeur souhaitée
    const viewport = page.getViewport({ scale: 1 })
    const scale = width / viewport.width
    const scaledViewport = page.getViewport({ scale })

    // Créer un canvas pour le rendu
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')

    if (!context) {
      throw new Error('Impossible de créer le contexte canvas')
    }

    canvas.width = Math.floor(scaledViewport.width)
    canvas.height = Math.floor(scaledViewport.height)

    // Fond blanc pour le canvas
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, canvas.width, canvas.height)

    // Rendre la page sur le canvas
    const renderContext = {
      canvasContext: context,
      viewport: scaledViewport,
      background: 'white'
    }

    await page.render(renderContext).promise

    // Convertir en image
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.85)

    // Mettre en cache
    previewCache.set(cacheKey, imageDataUrl)

    return imageDataUrl
  } catch (error) {
    console.error('Erreur lors de la génération de la prévisualisation PDF depuis URL:', error)
    throw error
  } finally {
    // Nettoyer les ressources
    if (pdf) {
      await pdf.destroy()
    }
  }
}

/**
 * Nettoie le cache des prévisualisations
 */
export function clearPreviewCache(): void {
  previewCache.clear()
}
