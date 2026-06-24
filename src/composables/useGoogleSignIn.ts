import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useGoogleRegistration } from '@/composables/useGoogleRegistration'
import { ApiError } from '@/api'

/**
 * Résultat de l'étape 1 Google, à traiter par la page appelante.
 * - `authenticated` : l'utilisateur est connecté (store + token déjà appliqués),
 *   la page doit rediriger (page par défaut / prompt écran d'accueil).
 * - `redirected` : compte inexistant, on a déjà navigué vers /register/google.
 * - `error` : message à afficher.
 */
export type GoogleSignInResult =
  | { kind: 'authenticated' }
  | { kind: 'redirected' }
  | { kind: 'error'; message: string }

/**
 * Orchestration de l'étape 1 (POST /auth/google) partagée par Login et Register.
 * Centralise le branchement AUTHENTICATED / NEEDS_REGISTRATION pour éviter la
 * duplication entre les deux pages.
 */
export function useGoogleSignIn() {
  const router = useRouter()
  const authStore = useAuthStore()
  const { setRegistration } = useGoogleRegistration()

  /** Vrai si une requête Google est en cours (pour griser le bouton). */
  const submitting = ref(false)

  const signIn = async (idToken: string): Promise<GoogleSignInResult> => {
    submitting.value = true
    try {
      const response = await authStore.loginWithGoogle(idToken)

      if (response.status === 'AUTHENTICATED') {
        return { kind: 'authenticated' }
      }

      if (response.status === 'NEEDS_REGISTRATION' && response.googleProfile) {
        // Transmet idToken + profil à la page de création via un store temporaire
        setRegistration(idToken, response.googleProfile)
        await router.push('/register/google')
        return { kind: 'redirected' }
      }

      return {
        kind: 'error',
        message: response.message || 'Réponse inattendue du serveur Google.',
      }
    } catch (err) {
      return { kind: 'error', message: extractMessage(err) }
    } finally {
      submitting.value = false
    }
  }

  return { submitting, signIn }
}

/** Extrait un message lisible d'une erreur d'authentification Google. */
function extractMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.code === 'NETWORK_ERROR' || err.code === 'TIMEOUT') {
      return 'Problème de connexion au serveur. Vérifiez votre réseau et réessayez.'
    }
    return err.message
  }
  if (err instanceof Error) return err.message
  return 'Erreur lors de la connexion avec Google.'
}
