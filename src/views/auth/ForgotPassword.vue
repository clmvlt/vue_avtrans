<template>
  <div class="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-muted">
    <div class="w-full max-w-[440px] bg-card border border-border rounded-lg p-6 sm:p-8 shadow-lg">
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center size-16 sm:size-20 rounded-full mb-4 overflow-hidden">
          <img src="/src/assets/favicon.png" alt="Logo" class="size-full object-cover rounded-full" />
        </div>
        <h1 class="text-xl sm:text-2xl font-bold text-foreground mb-2 mt-0">Mot de passe oublié</h1>
        <p class="text-muted-foreground text-sm leading-relaxed m-0">
          Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
        </p>
      </div>

      <div v-if="successMessage" class="flex items-start gap-3 p-4 mb-6 bg-success/10 border border-success/30 rounded-md text-success">
        <font-awesome-icon :icon="['fas', 'check-circle']" class="text-xl flex-shrink-0 mt-0.5" />
        <div>
          <p class="font-semibold m-0 mb-1 text-base">Email envoyé avec succès</p>
          <p class="m-0 text-sm leading-relaxed">{{ successMessage }}</p>
        </div>
      </div>

      <div v-if="errorMessage" class="flex items-center gap-3 p-4 mb-6 bg-destructive/10 border border-destructive/30 rounded-md text-destructive text-sm">
        <font-awesome-icon :icon="['fas', 'exclamation-circle']" class="text-lg flex-shrink-0" />
        <span>{{ errorMessage }}</span>
      </div>

      <form @submit.prevent="handleSubmit" v-if="!successMessage" class="flex flex-col gap-5 mb-6">
        <InputField
          v-model="email"
          label="Adresse email"
          type="email"
          placeholder="votre@email.com"
          :icon="Mail"
          :disabled="loading"
          required
          autocomplete="email"
        />

        <Button
          type="submit"
          :disabled="loading"
          class="w-full"
        >
          <LoaderCircle v-if="loading" class="size-4 animate-spin" />
          Envoyer le lien
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
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { authService } from '@/services/auth'
import { Button } from '@/components/ui/button'
import { LoaderCircle, Mail } from 'lucide-vue-next'
import { InputField } from '@/components/ui/input-field'

const email = ref('')
const loading = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

const handleSubmit = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  if (!email.value) {
    errorMessage.value = 'Veuillez entrer votre adresse email'
    return
  }

  try {
    loading.value = true
    const response = await authService.requestPasswordReset(email.value)

    if (response.success) {
      successMessage.value = 'Un email de réinitialisation a été envoyé à votre adresse. Veuillez vérifier votre boîte de réception.'
      email.value = ''
    }
  } catch (error: any) {
    errorMessage.value = error.message || 'Une erreur s\'est produite. Veuillez réessayer.'
  } finally {
    loading.value = false
  }
}
</script>
