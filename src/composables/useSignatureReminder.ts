import { ref } from 'vue'
import { signaturesService } from '@/services'

/**
 * Gère le rappel de signature des heures.
 *
 * La signature doit apparaître dès l'arrivée sur l'app lorsque l'utilisateur
 * a réalisé des heures le mois dernier (> 0) et n'a pas encore signé ce mois-ci,
 * quel que soit son rôle. Le backend encode ces deux conditions dans `needsToSign`.
 */
const showSignatureReminder = ref(false)
const heuresLastMonth = ref(0)
let alreadyChecked = false

export function useSignatureReminder() {
  /**
   * Interroge le backend et ouvre le rappel si une signature est requise.
   * Silencieux en cas d'erreur : on ne bloque jamais l'accès à l'app.
   */
  const checkSignature = async (force = false) => {
    if (alreadyChecked && !force) return
    alreadyChecked = true

    try {
      const summary = await signaturesService.getLastSignatureSummary()
      if (summary?.needsToSign && (summary.heuresLastMonth ?? 0) > 0) {
        heuresLastMonth.value = summary.heuresLastMonth ?? 0
        showSignatureReminder.value = true
      } else {
        showSignatureReminder.value = false
      }
    } catch {
      // Erreur réseau / API : on n'affiche pas le rappel
      showSignatureReminder.value = false
    }
  }

  /** Appelé après une signature réussie : ferme le rappel. */
  const markSigned = () => {
    showSignatureReminder.value = false
  }

  /** Réinitialise l'état (ex. à la déconnexion). */
  const reset = () => {
    showSignatureReminder.value = false
    heuresLastMonth.value = 0
    alreadyChecked = false
  }

  return {
    showSignatureReminder,
    heuresLastMonth,
    checkSignature,
    markSigned,
    reset,
  }
}
