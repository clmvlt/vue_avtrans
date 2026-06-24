<template>
  <div class="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-muted">
    <div class="w-full max-w-[480px] bg-card border border-border rounded-lg p-6 sm:p-8 shadow-lg">
      <!-- État succès : compte créé, en attente d'activation -->
      <div v-if="pendingMessage" class="text-center">
        <div class="inline-flex items-center justify-center size-[88px] bg-gradient-to-br from-info to-info/80 rounded-full mb-5">
          <font-awesome-icon :icon="['fas', 'user-shield']" class="text-[44px] text-white" />
        </div>
        <h2 class="text-2xl font-bold text-foreground mb-4 mt-0">Compte créé !</h2>

        <div class="flex gap-3 p-4 bg-info/10 border border-info/30 rounded-md mb-6 text-left">
          <font-awesome-icon :icon="['fas', 'info-circle']" class="text-xl text-info flex-shrink-0 mt-0.5" />
          <p class="text-sm text-foreground m-0 leading-relaxed">{{ pendingMessage }}</p>
        </div>

        <Button class="w-full" @click="goToLogin">
          Aller à la connexion
        </Button>
      </div>

      <!-- Formulaire de création -->
      <template v-else>
        <div class="text-center mb-8">
          <!-- Aperçu avatar Google -->
          <div class="inline-flex items-center justify-center size-20 rounded-full mb-4 overflow-hidden bg-primary/10 border border-border">
            <img
              v-if="pictureUrl && !avatarError"
              :src="pictureUrl"
              alt="Photo de profil Google"
              class="size-full object-cover"
              referrerpolicy="no-referrer"
              @error="avatarError = true"
            />
            <span v-else class="text-2xl font-bold text-primary">{{ initials }}</span>
          </div>
          <h1 class="text-xl sm:text-2xl font-bold text-foreground mb-2 mt-0">Créer mon compte</h1>
          <p class="text-muted-foreground text-sm leading-relaxed m-0">
            Vérifiez vos informations puis créez votre compte Google.
          </p>
        </div>

        <div v-if="errorMessage" class="flex items-center gap-3 p-4 mb-6 bg-destructive/10 border border-destructive/30 rounded-md text-destructive text-sm">
          <font-awesome-icon :icon="['fas', 'exclamation-circle']" class="text-lg flex-shrink-0" />
          <span>{{ errorMessage }}</span>
        </div>

        <form @submit.prevent="handleSubmit" class="flex flex-col gap-5 mb-6" name="google-register">
          <InputField
            v-model="email"
            label="Adresse email"
            type="email"
            :icon="Mail"
            disabled
            hint="Vérifiée par Google — non modifiable"
            autocomplete="username email"
          />

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-4">
            <InputField
              v-model="firstName"
              label="Prénom"
              type="text"
              placeholder="Jean"
              :icon="User"
              :disabled="loading"
              required
              autocomplete="given-name"
            />

            <InputField
              v-model="lastName"
              label="Nom"
              type="text"
              placeholder="Dupont"
              :icon="User"
              :disabled="loading"
              required
              autocomplete="family-name"
            />
          </div>

          <Button type="submit" :disabled="loading" class="w-full">
            <LoaderCircle v-if="loading" class="size-4 animate-spin" />
            Créer mon compte
          </Button>

          <Button type="button" variant="outline" :disabled="loading" class="w-full" @click="goToLogin">
            Annuler
          </Button>
        </form>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '@/services'
import { useGoogleRegistration } from '@/composables/useGoogleRegistration'
import { ApiError } from '@/api'
import { Button } from '@/components/ui/button'
import { LoaderCircle, User, Mail } from 'lucide-vue-next'
import { InputField } from '@/components/ui/input-field'

const router = useRouter()
const { idToken, profile, hasRegistration, clearRegistration } = useGoogleRegistration()

// Pré-remplissage depuis le profil Google (email/photo en lecture seule)
const email = ref(profile.value?.email ?? '')
const firstName = ref(profile.value?.firstName ?? '')
const lastName = ref(profile.value?.lastName ?? '')
const pictureUrl = profile.value?.pictureUrl ?? ''

const loading = ref(false)
const errorMessage = ref('')
const pendingMessage = ref('')
const avatarError = ref(false)

const initials = computed(() => {
  const f = firstName.value.trim()[0] ?? ''
  const l = lastName.value.trim()[0] ?? ''
  return (f + l).toUpperCase() || '?'
})

/**
 * Sans idToken/profil en mémoire (ex. accès direct ou refresh de la page),
 * impossible de poursuivre : on renvoie vers le login.
 */
onMounted(() => {
  if (!hasRegistration()) {
    router.replace('/login')
  }
})

const goToLogin = () => {
  clearRegistration()
  router.push('/login')
}

const handleSubmit = async () => {
  errorMessage.value = ''

  if (!firstName.value.trim() || !lastName.value.trim()) {
    errorMessage.value = 'Le prénom et le nom sont obligatoires.'
    return
  }

  if (!idToken.value) {
    // Sécurité : le token a expiré ou a été perdu
    router.replace('/login')
    return
  }

  try {
    loading.value = true
    const response = await authService.registerWithGoogle({
      idToken: idToken.value,
      firstName: firstName.value.trim(),
      lastName: lastName.value.trim(),
    })

    if (response.success && response.status === 'PENDING_ACTIVATION') {
      // Compte créé, en attente d'activation admin (pas de connexion à ce stade)
      pendingMessage.value =
        response.message ||
        "Votre compte a été créé via Google. Il doit être activé par un administrateur avant la première connexion."
      clearRegistration()
    } else {
      errorMessage.value = response.message || 'La création du compte a échoué.'
    }
  } catch (err) {
    if (err instanceof ApiError) {
      errorMessage.value =
        err.code === 'NETWORK_ERROR' || err.code === 'TIMEOUT'
          ? 'Problème de connexion au serveur. Vérifiez votre réseau et réessayez.'
          : err.message
    } else if (err instanceof Error) {
      errorMessage.value = err.message
    } else {
      errorMessage.value = 'Une erreur est survenue lors de la création du compte.'
    }
  } finally {
    loading.value = false
  }
}
</script>
