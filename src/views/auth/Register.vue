<template>
  <div class="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-muted">
    <div class="w-full max-w-[520px] bg-card border border-border rounded-lg p-6 sm:p-8 shadow-lg">
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center size-16 sm:size-20 rounded-full mb-4 overflow-hidden">
          <img src="/src/assets/favicon.png" alt="Logo" class="size-full object-cover rounded-full" />
        </div>
        <h1 class="text-xl sm:text-2xl font-bold text-foreground mb-2 mt-0">Inscription</h1>
        <p class="text-muted-foreground text-sm leading-relaxed m-0">
          Créez votre compte pour accéder à l'application de pointage
        </p>
      </div>

      <div v-if="successMessage" class="text-center">
        <div class="inline-flex items-center justify-center size-[100px] bg-gradient-to-br from-success to-success/80 rounded-full mb-5">
          <font-awesome-icon :icon="['fas', 'check-circle']" class="text-[56px] text-white" />
        </div>
        <h2 class="text-2xl font-bold text-foreground mb-6 mt-0">Inscription réussie !</h2>

        <div class="flex flex-col gap-4 mb-6 text-left">
          <div class="flex gap-4 p-4 bg-muted border border-border rounded-md transition-colors hover:border-primary hover:shadow-sm">
            <div class="flex items-center justify-center size-8 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-full font-bold text-sm flex-shrink-0">1</div>
            <div class="flex-1">
              <h3 class="flex items-center gap-2 text-base font-semibold text-foreground mb-2 mt-0">
                <font-awesome-icon :icon="['fas', 'envelope']" />
                Vérifiez votre email
              </h3>
              <p class="text-sm text-muted-foreground leading-relaxed m-0">
                Un email de vérification a été envoyé à <strong class="text-primary font-semibold">{{ email }}</strong>
              </p>
            </div>
          </div>

          <div class="flex gap-4 p-4 bg-muted border border-border rounded-md transition-colors hover:border-primary hover:shadow-sm">
            <div class="flex items-center justify-center size-8 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-full font-bold text-sm flex-shrink-0">2</div>
            <div class="flex-1">
              <h3 class="flex items-center gap-2 text-base font-semibold text-foreground mb-2 mt-0">
                <font-awesome-icon :icon="['fas', 'mouse-pointer']" />
                Activez votre compte
              </h3>
              <p class="text-sm text-muted-foreground leading-relaxed m-0">
                Cliquez sur le lien de vérification dans l'email pour confirmer votre adresse
              </p>
            </div>
          </div>

          <div class="flex gap-4 p-4 bg-muted border border-border rounded-md transition-colors hover:border-primary hover:shadow-sm">
            <div class="flex items-center justify-center size-8 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-full font-bold text-sm flex-shrink-0">3</div>
            <div class="flex-1">
              <h3 class="flex items-center gap-2 text-base font-semibold text-foreground mb-2 mt-0">
                <font-awesome-icon :icon="['fas', 'user-shield']" />
                Attendez l'activation par l'administrateur
              </h3>
              <p class="text-sm text-muted-foreground leading-relaxed m-0">
                Après vérification de votre email, un administrateur doit activer votre compte pour vous permettre de vous connecter
              </p>
            </div>
          </div>
        </div>

        <div class="flex gap-3 p-4 bg-info/10 border border-info/30 rounded-md mb-6 text-left">
          <font-awesome-icon :icon="['fas', 'info-circle']" class="text-xl text-info flex-shrink-0 mt-0.5" />
          <div class="flex-1">
            <p class="font-semibold text-info text-sm m-0 mb-1">Email non reçu ?</p>
            <p class="text-sm text-muted-foreground m-0 leading-relaxed">Vérifiez votre dossier spam ou courrier indésirable</p>
          </div>
        </div>

        <Button variant="outline" @click="$router.push('/login')" class="w-full">
          Retour à la connexion
        </Button>
      </div>

      <div v-if="errorMessage" class="flex items-center gap-3 p-4 mb-6 bg-destructive/10 border border-destructive/30 rounded-md text-destructive text-sm">
        <font-awesome-icon :icon="['fas', 'exclamation-circle']" class="text-lg flex-shrink-0" />
        <span>{{ errorMessage }}</span>
      </div>

      <form @submit.prevent="handleRegister" v-if="!successMessage" class="flex flex-col gap-5 mb-6" name="register">
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

        <InputField
          v-model="email"
          label="Adresse email"
          type="email"
          placeholder="votre@email.com"
          :icon="Mail"
          :disabled="loading"
          required
          autocomplete="username email"
        />

        <InputField
          v-model="password"
          label="Mot de passe"
          type="password"
          placeholder="••••••••"
          :icon="Lock"
          :disabled="loading"
          required
          :hint="passwordTooShort ? '' : 'Le mot de passe doit contenir au moins 6 caractères'"
          :error="passwordTooShort ? 'Le mot de passe doit contenir au moins 6 caractères' : ''"
          autocomplete="new-password"
          :show-password-toggle="true"
        />

        <InputField
          v-model="confirmPassword"
          label="Confirmer le mot de passe"
          type="password"
          placeholder="••••••••"
          :icon="Shield"
          :disabled="loading"
          required
          :error="passwordMismatch ? 'Les mots de passe ne correspondent pas' : ''"
          autocomplete="new-password"
          :show-password-toggle="true"
        />

        <Button
          type="submit"
          :disabled="loading"
          class="w-full"
        >
          <LoaderCircle v-if="loading" class="size-4 animate-spin" />
          S'inscrire
        </Button>
      </form>

      <div class="text-center pt-4 border-t border-border" v-if="!successMessage">
        <p class="text-muted-foreground text-sm m-0">
          Déjà un compte ?
          <RouterLink to="/login" class="text-sm font-medium text-primary hover:text-primary/80 transition-colors hover:underline">Se connecter</RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { authService } from '@/services'
import { Button } from '@/components/ui/button'
import { LoaderCircle, User, Mail, Lock, Shield } from 'lucide-vue-next'
import { InputField } from '@/components/ui/input-field'

const firstName = ref('')
const lastName = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

// Validation en temps réel des mots de passe
const passwordMismatch = computed(() => {
  // Afficher l'erreur seulement si l'utilisateur a commencé à taper dans le champ de confirmation
  if (confirmPassword.value.length === 0) return false
  return password.value !== confirmPassword.value
})

const passwordTooShort = computed(() => {
  if (password.value.length === 0) return false
  return password.value.length < 6
})

const handleRegister = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Les mots de passe ne correspondent pas'
    return
  }

  if (password.value.length < 6) {
    errorMessage.value = 'Le mot de passe doit contenir au moins 6 caractères'
    return
  }

  try {
    loading.value = true
    const response = await authService.register({
      email: email.value,
      password: password.value,
      firstName: firstName.value,
      lastName: lastName.value
    })

    if (response.success) {
      successMessage.value = response.message || 'Inscription réussie ! Veuillez vérifier votre email.'
      // L'utilisateur doit d'abord vérifier son email, pas de redirection automatique
    }
  } catch (error: any) {
    errorMessage.value = error.message || 'Une erreur s\'est produite lors de l\'inscription'
  } finally {
    loading.value = false
  }
}
</script>
