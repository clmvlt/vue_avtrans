<template>
  <div class="verify-container">
    <div class="verify-card">
      <!-- Loading State -->
      <div v-if="loading" class="state-content">
        <div class="icon-container loading-icon">
          <font-awesome-icon :icon="['fas', 'spinner']" spin class="header-icon" />
        </div>
        <h1>Vérification en cours...</h1>
        <p class="subtitle">
          Veuillez patienter pendant que nous vérifions votre email.
        </p>
      </div>

      <!-- Success State -->
      <div v-else-if="successMessage" class="state-content">
        <div class="icon-container success-icon">
          <font-awesome-icon :icon="['fas', 'check-circle']" class="header-icon" />
        </div>
        <h1>Email vérifié avec succès !</h1>
        <p class="subtitle">{{ successMessage }}</p>

        <div class="warning-box">
          <div class="warning-icon-container">
            <font-awesome-icon :icon="['fas', 'user-shield']" />
          </div>
          <div class="warning-content">
            <h3 class="warning-title">Activation du compte requise</h3>
            <p class="warning-text">
              Votre adresse email a été vérifiée, mais un <strong>administrateur doit activer votre compte</strong> avant que vous puissiez vous connecter.
            </p>
            <p class="warning-text">
              Vous recevrez une notification par email dès que votre compte sera activé.
            </p>
          </div>
        </div>

        <p class="redirect-info">
          <font-awesome-icon :icon="['fas', 'clock']" />
          Redirection automatique dans quelques secondes...
        </p>
        <Button
          @click="router.push('/login')"
          class="w-full"
        >
          Retour à la connexion
        </Button>
      </div>

      <!-- Error State -->
      <div v-else-if="errorMessage" class="state-content">
        <div class="icon-container error-icon">
          <font-awesome-icon :icon="['fas', 'times-circle']" class="header-icon" />
        </div>
        <h1>Erreur de vérification</h1>
        <p class="subtitle error-text">{{ errorMessage }}</p>
        <div class="button-group">
          <Button
            @click="router.push('/register')"
            class="w-full"
          >
            Retour à l'inscription
          </Button>
          <Button
            variant="outline"
            @click="router.push('/login')"
            class="w-full"
          >
            Se connecter
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { authService } from '@/services/auth'
import { Button } from '@/components/ui/button'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const successMessage = ref('')
const errorMessage = ref('')

onMounted(async () => {
  const token = route.query.token

  if (!token || typeof token !== 'string') {
    errorMessage.value = 'Token de vérification manquant'
    loading.value = false
    return
  }

  try {
    const response = await authService.verifyEmail(token)

    if (response.success) {
      successMessage.value = response.message || 'Votre email a été vérifié avec succès.'

      // Redirection automatique après 3 secondes
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    }
  } catch (error: any) {
    errorMessage.value = error.message || 'Token invalide ou expiré'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.verify-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-6);
  background-color: var(--color-bg-secondary);
}

.verify-card {
  width: 100%;
  max-width: 480px;
  background-color: var(--color-bg-primary);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--radius-lg);
  padding: var(--space-8);
  box-shadow: var(--shadow-lg);
}

.state-content {
  text-align: center;
}

.icon-container {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100px;
  height: 100px;
  border-radius: var(--radius-full);
  margin-bottom: var(--space-5);
}

.loading-icon {
  background: linear-gradient(135deg, var(--color-info), var(--color-info-hover));
}

.success-icon {
  background: linear-gradient(135deg, var(--color-success), var(--color-success-hover));
}

.error-icon {
  background: linear-gradient(135deg, var(--color-danger), var(--color-danger-hover));
}

.header-icon {
  font-size: 48px;
  color: white;
}

.state-content h1 {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin-bottom: var(--space-3);
  margin-top: 0;
}

.subtitle {
  color: var(--color-text-secondary);
  font-size: var(--font-size-base);
  line-height: 1.5;
  margin: 0 0 var(--space-6) 0;
}

.error-text {
  color: var(--color-danger);
}

.warning-box {
  display: flex;
  gap: var(--space-4);
  padding: var(--space-5);
  background-color: var(--color-warning-bg);
  border: 2px solid var(--color-warning);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-5);
  text-align: left;
}

.warning-icon-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, var(--color-warning), var(--color-warning-hover));
  border-radius: var(--radius-full);
  color: var(--color-white);
  font-size: var(--font-size-xl);
  flex-shrink: 0;
}

.warning-content {
  flex: 1;
}

.warning-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-bold);
  color: var(--color-warning);
  margin: 0 0 var(--space-2) 0;
}

.warning-text {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin: 0 0 var(--space-2) 0;
}

.warning-text:last-child {
  margin-bottom: 0;
}

.warning-text strong {
  color: var(--color-warning);
  font-weight: var(--font-weight-semibold);
}

.redirect-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  color: var(--color-text-tertiary);
  font-size: var(--font-size-sm);
  margin: 0 0 var(--space-4) 0;
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

@media (max-width: 640px) {
  .verify-container {
    padding: var(--space-4);
  }

  .verify-card {
    padding: var(--space-6);
  }

  .icon-container {
    width: 80px;
    height: 80px;
  }

  .header-icon {
    font-size: 40px;
  }

  .state-content h1 {
    font-size: var(--font-size-xl);
  }
}
</style>
