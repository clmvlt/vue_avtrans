<template>
  <div class="reset-password-container">
    <div class="reset-password-card">
      <div class="header">
        <div class="icon-container">
          <img src="/src/assets/favicon.png" alt="Logo" class="header-icon" />
        </div>
        <h1>Réinitialiser le mot de passe</h1>
        <p class="subtitle">
          Entrez votre nouveau mot de passe.
        </p>
      </div>

      <div v-if="successMessage" class="success-alert">
        <font-awesome-icon :icon="['fas', 'check-circle']" class="success-icon" />
        <div>
          <p class="alert-title">Mot de passe réinitialisé</p>
          <p class="alert-message">{{ successMessage }}</p>
          <p class="redirect-info">
            <font-awesome-icon :icon="['fas', 'clock']" />
            Redirection vers la page de connexion...
          </p>
        </div>
      </div>

      <div v-if="errorMessage" class="error-alert">
        <font-awesome-icon :icon="['fas', 'exclamation-circle']" class="error-icon" />
        <span>{{ errorMessage }}</span>
      </div>

      <div v-if="!token" class="error-alert">
        <font-awesome-icon :icon="['fas', 'exclamation-triangle']" class="error-icon" />
        <span>Token de réinitialisation manquant ou invalide.</span>
      </div>

      <form @submit.prevent="handleSubmit" v-if="!successMessage && token" class="form">
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

      <div class="footer">
        <RouterLink to="/login" class="back-link inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium hover:underline">
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

<style scoped>
.reset-password-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-6);
  background-color: var(--color-bg-secondary);
}

.reset-password-card {
  width: 100%;
  max-width: 480px;
  background-color: var(--color-bg-primary);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--radius-lg);
  padding: var(--space-8);
  box-shadow: var(--shadow-lg);
}

.header {
  text-align: center;
  margin-bottom: var(--space-8);
}

.icon-container {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  border-radius: var(--radius-full);
  margin-bottom: var(--space-4);
}

.header-icon {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: var(--radius-full);
}

.header h1 {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin-bottom: var(--space-2);
  margin-top: 0;
}

.subtitle {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  line-height: 1.5;
  margin: 0;
}

.success-alert {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-4);
  margin-bottom: var(--space-6);
  background-color: var(--color-success-bg);
  border: 1px solid var(--color-success);
  border-radius: var(--radius-md);
  color: var(--color-success);
}

.success-icon {
  font-size: var(--font-size-xl);
  flex-shrink: 0;
  margin-top: 2px;
}

.alert-title {
  font-weight: var(--font-weight-semibold);
  margin: 0 0 var(--space-1) 0;
  font-size: var(--font-size-base);
}

.alert-message {
  margin: 0 0 var(--space-2) 0;
  font-size: var(--font-size-sm);
  line-height: 1.5;
}

.redirect-info {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
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

.form {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  margin-bottom: var(--space-6);
}

.footer {
  text-align: center;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
}

@media (max-width: 640px) {
  .reset-password-container {
    padding: var(--space-4);
  }

  .reset-password-card {
    padding: var(--space-6);
  }

  .icon-container {
    width: 64px;
    height: 64px;
  }

  .header-icon {
    width: 100%;
    height: 100%;
  }

  .header h1 {
    font-size: var(--font-size-xl);
  }
}
</style>
