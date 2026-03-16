<template>
  <div class="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-muted">
    <div class="w-full max-w-[480px] bg-card border border-border rounded-lg p-6 sm:p-8 shadow-lg">
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center size-16 sm:size-20 rounded-full mb-4 overflow-hidden">
          <img src="/src/assets/favicon.png" alt="Logo" class="size-full object-cover rounded-full" />
        </div>
        <h1 class="text-xl sm:text-2xl font-bold text-foreground mb-2 mt-0">Réinitialiser le mot de passe</h1>
        <p class="text-muted-foreground text-sm leading-relaxed m-0">
          Entrez votre nouveau mot de passe.
        </p>
      </div>

      <div v-if="successMessage" class="flex items-start gap-3 p-4 mb-6 bg-success/10 border border-success/30 rounded-md text-success">
        <font-awesome-icon :icon="['fas', 'check-circle']" class="text-xl flex-shrink-0 mt-0.5" />
        <div>
          <p class="font-semibold m-0 mb-1 text-base">Mot de passe réinitialisé</p>
          <p class="m-0 mb-2 text-sm leading-relaxed">{{ successMessage }}</p>
          <p class="flex items-center gap-2 text-sm m-0">
            <font-awesome-icon :icon="['fas', 'clock']" />
            Redirection vers la page de connexion...
          </p>
        </div>
      </div>

      <div v-if="errorMessage" class="flex items-center gap-3 p-4 mb-6 bg-destructive/10 border border-destructive/30 rounded-md text-destructive text-sm">
        <font-awesome-icon :icon="['fas', 'exclamation-circle']" class="text-lg flex-shrink-0" />
        <span>{{ errorMessage }}</span>
      </div>

      <div v-if="!token" class="flex items-center gap-3 p-4 mb-6 bg-destructive/10 border border-destructive/30 rounded-md text-destructive text-sm">
        <font-awesome-icon :icon="['fas', 'exclamation-triangle']" class="text-lg flex-shrink-0" />
        <span>Token de réinitialisation manquant ou invalide.</span>
      </div>

      <form @submit.prevent="handleSubmit" v-if="!successMessage && token" class="flex flex-col gap-5 mb-6">
        <InputField
          v-model="password"
          label="Nouveau mot de passe"
          type="password"
          placeholder="Minimum 6 caractères"
          :icon="Lock"
          :disabled="loading"
          required
          hint="Le mot de passe doit contenir au moins 6 caractères"
          autocomplete="new-password"
          :show-password-toggle="true"
        />

        <InputField
          v-model="confirmPassword"
          label="Confirmer le mot de passe"
          type="password"
          placeholder="Confirmer le mot de passe"
          :icon="Shield"
          :disabled="loading"
          required
          autocomplete="new-password"
          :show-password-toggle="true"
        />

        <Button
          type="submit"
          :disabled="loading"
          class="w-full"
        >
          <LoaderCircle v-if="loading" class="size-4 animate-spin" />
          Réinitialiser le mot de passe
        </Button>
      </form>

      <div class="text-center">
        <RouterLink to="/login" class="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium hover:underline">
          <font-awesome-icon :icon="['fas', 'arrow-left']" />
          Retour à la connexion
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { authService } from '@/services/auth'
import { Button } from '@/components/ui/button'
import { LoaderCircle, Lock, Shield } from 'lucide-vue-next'
import { InputField } from '@/components/ui/input-field'

const route = useRoute()
const router = useRouter()

const token = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

onMounted(() => {
  const queryToken = route.query.token
  token.value = typeof queryToken === 'string' ? queryToken : ''

  if (!token.value) {
    errorMessage.value = 'Token de réinitialisation manquant'
  }
})

const handleSubmit = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  // Validation
  if (password.value.length < 6) {
    errorMessage.value = 'Le mot de passe doit contenir au moins 6 caractères'
    return
  }

  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Les mots de passe ne correspondent pas'
    return
  }

  try {
    loading.value = true
    const response = await authService.confirmPasswordReset({
      token: token.value,
      newPassword: password.value
    })

    if (response.success) {
      successMessage.value = 'Votre mot de passe a été réinitialisé avec succès !'

      // Redirection après 3 secondes
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    }
  } catch (error: any) {
    errorMessage.value = error.message || 'Le token est invalide, expiré ou a déjà été utilisé'
  } finally {
    loading.value = false
  }
}
</script>
