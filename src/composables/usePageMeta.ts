import { onMounted, onUnmounted } from 'vue'
import { SITE_URL } from '@/config/seo'

export interface PageMeta {
  /** Titre complet de l'onglet et du résultat de recherche */
  title?: string
  /** Meta description ; sans valeur, celle d'index.html est conservée */
  description?: string
  /** Directive robots, ex. 'noindex, follow' ; sans valeur, celle d'index.html est conservée */
  robots?: string
  /**
   * Chemin canonique de la page (ex. '/login'). Sans valeur, la canonique d'index.html
   * (la landing) est conservée : à renseigner sur toute page indexable autre que « / ».
   */
  canonicalPath?: string
}

type Restore = () => void

const setMeta = (selector: string, create: () => HTMLElement, attr: string, value: string): Restore => {
  const existing = document.head.querySelector<HTMLElement>(selector)
  if (existing) {
    const previous = existing.getAttribute(attr)
    existing.setAttribute(attr, value)
    return () => {
      if (previous === null) existing.removeAttribute(attr)
      else existing.setAttribute(attr, previous)
    }
  }
  const el = create()
  el.setAttribute(attr, value)
  document.head.appendChild(el)
  return () => el.remove()
}

const meta = (name: string) => () => {
  const el = document.createElement('meta')
  el.name = name
  return el
}

const link = (rel: string) => () => {
  const el = document.createElement('link')
  el.rel = rel
  return el
}

/**
 * Applique le titre et les balises meta SEO d'une page (SPA), puis restaure les valeurs
 * d'index.html — celles de la landing — quand le composant est démonté.
 *
 * Google exécute le JavaScript : un `noindex` ou une canonique posés ici sont pris en compte.
 * Toujours appeler ce composable dans `<script setup>` d'une vue.
 */
export function usePageMeta(page: PageMeta): void {
  const restores: Restore[] = []

  onMounted(() => {
    if (page.title !== undefined) {
      const previousTitle = document.title
      document.title = page.title
      restores.push(() => {
        document.title = previousTitle
      })
    }
    if (page.description !== undefined) {
      restores.push(setMeta('meta[name="description"]', meta('description'), 'content', page.description))
    }
    if (page.robots !== undefined) {
      restores.push(setMeta('meta[name="robots"]', meta('robots'), 'content', page.robots))
    }
    if (page.canonicalPath !== undefined) {
      restores.push(setMeta('link[rel="canonical"]', link('canonical'), 'href', `${SITE_URL}${page.canonicalPath}`))
    }
  })

  onUnmounted(() => {
    // Restauration dans l'ordre inverse pour retrouver exactement l'état initial
    while (restores.length) restores.pop()?.()
  })
}
