<template>
  <div class="forgot-password-container">
    <div class="forgot-password-card">
      <div class="header">
        <div class="icon-container">
          <img src="/src/assets/favicon.png" alt="Logo" class="header-icon" />
        </div>
        <h1>Mot de passe oublié</h1>
        <p class="subtitle">
          Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
        </p>
      </div>

      <div v-if="successMessage" class="success-alert">
        <font-awesome-icon :icon="['fas', 'check-circle']" class="success-icon" />
        <div>
          <p class="alert-title">Email envoyé avec succès</p>
          <p class="alert-message">{{ successMessage }}</p>
        </div>
      </div>

      <div v-if="errorMessage" class="error-alert">
        <font-awesome-icon :icon="['fas', 'exclamation-circle']" class="error-icon" />
        <span>{{ errorMessage }}</span>
      </div>

      <form @submit.prevent="handleSubmit" v-if="!successMessage" class="form">
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

<style scoped>
.forgot-password-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-6);
  background-color: var(--color-bg-secondary);
}

.forgot-password-card {
  width: 100%;
  max-width: 440px;
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
  margin: 0;
  font-size: var(--font-size-sm);
  line-height: 1.5;
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
  .forgot-password-container {
    padding: var(--space-4);
  }

  .forgot-password-card {
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
