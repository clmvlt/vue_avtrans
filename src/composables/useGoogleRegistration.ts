import { ref, readonly } from 'vue'
import type { GoogleProfile } from '@/models'

/**
 * Stockage temporaire (en mémoire) du handoff entre l'étape 1 (POST /auth/google
 * → NEEDS_REGISTRATION) et la page de création de compte /register/google.
 *
 * Volontairement NON persisté (ni URL, ni localStorage) :
 * - l'idToken Google est sensible et valide < 1h ;
 * - un refresh de la page de création doit vider l'état et renvoyer au login
 *   (impossible de régénérer le token sans repasser par le bouton Google).
 *
 * État au niveau module → singleton partagé entre les composants.
 */

const idToken = ref<string | null>(null)
const profile = ref<GoogleProfile | null>(null)

export function useGoogleRegistration() {
  const setRegistration = (token: string, googleProfile: GoogleProfile): void => {
    idToken.value = token
    profile.value = googleProfile
  }

  const clearRegistration = (): void => {
    idToken.value = null
    profile.value = null
  }

  const hasRegistration = (): boolean => !!idToken.value && !!profile.value

  return {
    idToken: readonly(idToken),
    profile: readonly(profile),
    setRegistration,
    clearRegistration,
    hasRegistration,
  }
}
