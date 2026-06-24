<template>
  <div class="relative w-full">
    <!-- Conteneur du bouton officiel Google (rendu par GIS) -->
    <div ref="buttonContainer" class="flex w-full justify-center" :class="{ 'pointer-events-none opacity-50': loading }"></div>

    <!-- Spinner pendant l'appel API (piloté par le parent) -->
    <div
      v-if="loading"
      class="absolute inset-0 flex items-center justify-center"
    >
      <LoaderCircle class="size-5 animate-spin text-muted-foreground" />
    </div>

    <!-- Fallback si GIS ne peut pas être chargé (réseau, bloqueur) -->
    <p v-if="scriptError" class="mt-2 text-center text-xs text-muted-foreground">
      Connexion Google indisponible pour le moment.
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { LoaderCircle } from 'lucide-vue-next'
import { loadGoogleIdentity, GOOGLE_CLIENT_ID } from '@/composables/useGoogleIdentity'
import type { GoogleCredentialResponse } from '@/types/google-identity'

const props = withDefaults(defineProps<{
  /** Texte du bouton Google. */
  text?: 'signin_with' | 'signup_with' | 'continue_with'
  /** Activer le One Tap (prompt automatique). Désactivé par défaut. */
  oneTap?: boolean
  /** Affiche l'overlay de chargement (appel API en cours côté parent). */
  loading?: boolean
}>(), {
  text: 'continue_with',
  oneTap: false,
  loading: false,
})

const emit = defineEmits<{
  /** ID token JWT Google (response.credential) à transmettre à la logique d'auth. */
  (e: 'credential', idToken: string): void
  /** Erreur GIS (script indisponible, credential manquant). */
  (e: 'error', message: string): void
}>()

const buttonContainer = ref<HTMLElement | null>(null)
const scriptError = ref(false)

const handleCredential = (response: GoogleCredentialResponse) => {
  if (!response?.credential) {
    emit('error', 'Aucun identifiant Google reçu. Veuillez réessayer.')
    return
  }
  emit('credential', response.credential)
}

onMounted(async () => {
  if (!GOOGLE_CLIENT_ID) {
    scriptError.value = true
    console.warn('VITE_GOOGLE_CLIENT_ID manquant — bouton Google désactivé.')
    return
  }

  try {
    const googleId = await loadGoogleIdentity()

    googleId.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleCredential,
      cancel_on_tap_outside: true,
      ux_mode: 'popup',
    })

    await nextTick()
    if (!buttonContainer.value) return

    const isDark = document.documentElement.classList.contains('dark')
    const width = Math.min(buttonContainer.value.offsetWidth || 360, 400)

    googleId.renderButton(buttonContainer.value, {
      type: 'standard',
      theme: isDark ? 'filled_blue' : 'outline',
      size: 'large',
      text: props.text,
      shape: 'rectangular',
      logo_alignment: 'center',
      width,
    })

    // One Tap optionnel
    if (props.oneTap) {
      googleId.prompt()
    }
  } catch (err) {
    scriptError.value = true
    console.error('Google Identity Services:', err)
  }
})
</script>
