<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <div class="logo-container">
          <img src="/src/assets/favicon.png" alt="Logo" class="logo-icon" />
        </div>
        <h1>Connexion</h1>
      </div>

      <div v-if="errorMessage" class="error-alert">
        <font-awesome-icon :icon="['fas', 'exclamation-circle']" class="error-icon" />
        <span>{{ errorMessage }}</span>
      </div>

      <form @submit.prevent="handleLogin" class="login-form" name="login">
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

      <div class="login-footer">
        <RouterLink to="/forgot-password" class="forgot-link inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium hover:underline">
          <font-awesome-icon :icon="['fas', 'key']" />
          Mot de passe oublié ?
        </RouterLink>

        <div class="divider"></div>

        <p class="register-prompt">
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
        // Redirection vers la page d'accueil
        router.push('/')
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
  router.push('/')
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-6);
  background-color: var(--color-bg-secondary);
}

.login-card {
  width: 100%;
  max-width: 440px;
  background-color: var(--color-bg-primary);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--radius-lg);
  padding: var(--space-8);
  box-shadow: var(--shadow-lg);
}

.login-header {
  text-align: center;
  margin-bottom: var(--space-8);
}

.logo-container {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  border-radius: var(--radius-full);
  margin-bottom: var(--space-4);
}

.logo-icon {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: var(--radius-full);
}

.login-header h1 {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin-bottom: var(--space-2);
  margin-top: 0;
}

.subtitle {
  color: var(--color-text-secondary);
  font-size: var(--font-size-base);
  margin: 0;
}

.error-alert {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  margin-bottom: var(--space-6);
  background-color: var(--color-danger-bg);
  border: 1px solid var(--color-danger);
  border-radius: var(--radius-md);
  color: var(--color-danger);
  font-size: var(--font-size-sm);
}

.error-icon {
  font-size: var(--font-size-lg);
  flex-shrink: 0;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  margin-bottom: var(--space-6);
}

.login-footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
}

.forgot-link {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
}

.divider {
  width: 100%;
  height: 1px;
  background-color: var(--color-border-primary);
}

.register-prompt {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  margin: 0;
}

@media (max-width: 640px) {
  .login-container {
    padding: var(--space-4);
  }

  .login-card {
    padding: var(--space-6);
  }

  .logo-container {
    width: 64px;
    height: 64px;
  }

  .logo-icon {
    width: 100%;
    height: 100%;
  }

  .login-header h1 {
    font-size: var(--font-size-xl);
  }
}
</style>
