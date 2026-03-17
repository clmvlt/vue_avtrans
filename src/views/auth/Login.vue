<template>
  <div class="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-muted">
    <div class="w-full max-w-[440px] bg-card border border-border rounded-lg p-6 sm:p-8 shadow-lg">
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center size-16 sm:size-20 rounded-full mb-4 overflow-hidden">
          <img src="/src/assets/favicon.png" alt="Logo" class="size-full object-cover rounded-full" />
        </div>
        <h1 class="text-xl sm:text-2xl font-bold text-foreground mb-2 mt-0">Connexion</h1>
      </div>

      <div v-if="errorMessage" class="flex items-center gap-3 p-4 mb-6 bg-destructive/10 border border-destructive/30 rounded-md text-destructive text-sm">
        <font-awesome-icon :icon="['fas', 'exclamation-circle']" class="text-lg flex-shrink-0" />
        <span>{{ errorMessage }}</span>
      </div>

      <form @submit.prevent="handleLogin" class="flex flex-col gap-5 mb-6" name="login">
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
          autocomplete="current-password"
          :show-password-toggle="true"
        />

        <Button
          type="submit"
          :disabled="loading"
          class="w-full"
        >
          <LoaderCircle v-if="loading" class="size-4 animate-spin" />
          Se connecter
        </Button>
      </form>

      <div class="flex flex-col items-center gap-4">
        <RouterLink to="/forgot-password" class="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium hover:underline">
          <font-awesome-icon :icon="['fas', 'key']" />
          Mot de passe oublié ?
        </RouterLink>

        <div class="w-full h-px bg-border"></div>

        <p class="text-muted-foreground text-sm m-0">
          Pas encore de compte ?
          <RouterLink to="/register" class="text-sm font-medium text-primary hover:text-primary/80 transition-colors hover:underline">S'inscrire</RouterLink>
        </p>
      </div>
    </div>

    <!-- Home Screen Prompt -->
    <HomeScreenPrompt
      v-model="showHomeScreenPrompt"
      @navigate="handlePromptNavigate"
      @dismiss="handlePromptDismiss"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { LoaderCircle, Mail, Lock } from 'lucide-vue-next'
import { InputField } from '@/components/ui/input-field'
import HomeScreenPrompt from '@/components/home-screen/HomeScreenPrompt.vue'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const loading = ref(false)

const getDefaultRoute = (): string => {
  if (authStore.isAdmin) return '/users'
  if (authStore.isMechanic) return '/vehicules'
  return '/pointage'
}
const errorMessage = ref('')
const showHomeScreenPrompt = ref(false)

/**
 * Vérifie si le prompt d'écran d'accueil doit être affiché
 * - Uniquement sur mobile
 */
const shouldShowHomeScreenPrompt = (): boolean => {
  const isMobile = /android|iphone|ipad|ipod/i.test(navigator.userAgent)
  return isMobile
}

const handleLogin = async () => {
  errorMessage.value = ''

  try {
    loading.value = true

    const response = await authStore.login({
      email: email.value,
      password: password.value
    })

    if (response.success) {
      // Vérifier si l'email est vérifié
      if (!authStore.isEmailVerified) {
        errorMessage.value = 'Veuillez vérifier votre email avant de vous connecter'
        authStore.logout()
        return
      }

      // Vérifier si l'utilisateur est actif (isActif = true)
      if (!authStore.isActive) {
        errorMessage.value = 'Votre compte est désactivé. Veuillez contacter un administrateur.'
        authStore.logout()
        return
      }

      // Afficher le prompt d'écran d'accueil si applicable
      if (shouldShowHomeScreenPrompt()) {
        showHomeScreenPrompt.value = true
      } else {
        // Redirection vers la page par défaut selon le rôle
        router.push(getDefaultRoute())
      }
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      errorMessage.value = error.message
    } else {
      errorMessage.value = 'Identifiants invalides'
    }
  } finally {
    loading.value = false
  }
}

/**
 * Redirige vers la page d'instructions
 */
const handlePromptNavigate = () => {
  router.push('/quick-login?setup=true')
}

/**
 * Ferme le prompt et redirige vers l'accueil
 */
const handlePromptDismiss = () => {
  router.push(getDefaultRoute())
}
</script>
