<template>
  <div class="register-container">
    <div class="register-card">
      <div class="header">
        <div class="icon-container">
          <img src="/src/assets/favicon.png" alt="Logo" class="header-icon" />
        </div>
        <h1>Inscription</h1>
        <p class="subtitle">
          Créez votre compte pour accéder à l'application de pointage
        </p>
      </div>

      <div v-if="successMessage" class="success-state">
        <div class="success-icon-container">
          <font-awesome-icon :icon="['fas', 'check-circle']" class="success-icon-large" />
        </div>
        <h2 class="success-title">Inscription réussie !</h2>

        <div class="success-steps">
          <div class="step">
            <div class="step-number">1</div>
            <div class="step-content">
              <h3 class="step-title">
                <font-awesome-icon :icon="['fas', 'envelope']" />
                Vérifiez votre email
              </h3>
              <p class="step-description">
                Un email de vérification a été envoyé à <strong>{{ email }}</strong>
              </p>
            </div>
          </div>

          <div class="step">
            <div class="step-number">2</div>
            <div class="step-content">
              <h3 class="step-title">
                <font-awesome-icon :icon="['fas', 'mouse-pointer']" />
                Activez votre compte
              </h3>
              <p class="step-description">
                Cliquez sur le lien de vérification dans l'email pour confirmer votre adresse
              </p>
            </div>
          </div>

          <div class="step">
            <div class="step-number">3</div>
            <div class="step-content">
              <h3 class="step-title">
                <font-awesome-icon :icon="['fas', 'user-shield']" />
                Attendez l'activation par l'administrateur
              </h3>
              <p class="step-description">
                Après vérification de votre email, un administrateur doit activer votre compte pour vous permettre de vous connecter
              </p>
            </div>
          </div>
        </div>

        <div class="info-box">
          <font-awesome-icon :icon="['fas', 'info-circle']" class="info-icon" />
          <div class="info-content">
            <p class="info-title">Email non reçu ?</p>
            <p class="info-text">Vérifiez votre dossier spam ou courrier indésirable</p>
          </div>
        </div>

        <Button variant="outline" @click="$router.push('/login')" class="w-full">
          Retour à la connexion
        </Button>
      </div>

      <div v-if="errorMessage" class="error-alert">
        <font-awesome-icon :icon="['fas', 'exclamation-circle']" class="error-icon" />
        <span>{{ errorMessage }}</span>
      </div>

      <form @submit.prevent="handleRegister" v-if="!successMessage" class="form" name="register">
        <div class="name-row">
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

      <div class="footer" v-if="!successMessage">
        <p class="login-prompt">
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

<style scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-6);
  background-color: var(--color-bg-secondary);
}

.register-card {
  width: 100%;
  max-width: 520px;
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

/* Success State */
.success-state {
  text-align: center;
}

.success-icon-container {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100px;
  height: 100px;
  background: linear-gradient(135deg, var(--color-success), var(--color-success-hover));
  border-radius: var(--radius-full);
  margin-bottom: var(--space-5);
}

.success-icon-large {
  font-size: 56px;
  color: var(--color-white);
}

.success-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin: 0 0 var(--space-6) 0;
}

.success-steps {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
  text-align: left;
}

.step {
  display: flex;
  gap: var(--space-4);
  padding: var(--space-4);
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--radius-md);
  transition: all var(--transition-base);
}

.step:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-sm);
}

.step-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  color: var(--color-white);
  border-radius: var(--radius-full);
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-sm);
  flex-shrink: 0;
}

.step-content {
  flex: 1;
}

.step-title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0 0 var(--space-2) 0;
}

.step-description {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: 1.5;
  margin: 0;
}

.step-description strong {
  color: var(--color-primary);
  font-weight: var(--font-weight-semibold);
}

.info-box {
  display: flex;
  gap: var(--space-3);
  padding: var(--space-4);
  background-color: var(--color-info-bg);
  border: 1px solid var(--color-info);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-6);
  text-align: left;
}

.info-icon {
  font-size: var(--font-size-xl);
  color: var(--color-info);
  flex-shrink: 0;
  margin-top: 2px;
}

.info-content {
  flex: 1;
}

.info-title {
  font-weight: var(--font-weight-semibold);
  color: var(--color-info);
  font-size: var(--font-size-sm);
  margin: 0 0 var(--space-1) 0;
}

.info-text {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: 0;
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

.name-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}

.footer {
  text-align: center;
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-border-primary);
}

.login-prompt {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  margin: 0;
}

@media (max-width: 640px) {
  .register-container {
    padding: var(--space-4);
  }

  .register-card {
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

  .name-row {
    grid-template-columns: 1fr;
    gap: var(--space-5);
  }
}
</style>
