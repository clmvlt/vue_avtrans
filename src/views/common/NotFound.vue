<template>
  <div class="not-found">
    <div class="content">
      <div class="error-section">
        <h1 class="error-code">404</h1>
        <div class="error-text">
          <h2>Page non trouvée</h2>
          <p class="message">
            La page que vous recherchez n'existe pas ou a été déplacée.
          </p>
        </div>
      </div>

      <div class="details">
        <h3>Suggestions :</h3>
        <ul>
          <li>Vérifiez l'URL dans la barre d'adresse</li>
          <li>Retournez à la page précédente</li>
          <li v-if="isAuthenticated">Accédez au tableau de bord</li>
          <li v-else>Connectez-vous à votre compte</li>
        </ul>
      </div>

      <div class="actions">
        <Button
          @click="handleGoBack"
        >
          <ArrowLeft class="size-4" />
          Retour
        </Button>

        <Button
          v-if="isAuthenticated"
          variant="secondary"
          @click="$router.push('/vehicules')"
        >
          <Home class="size-4" />
          Tableau de bord
        </Button>

        <Button
          v-else
          variant="secondary"
          @click="$router.push('/login')"
        >
          <LogIn class="size-4" />
          Se connecter
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Home, LogIn } from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()
const isAuthenticated = computed(() => authStore.isAuthenticated)

const handleGoBack = () => {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push(isAuthenticated.value ? '/vehicules' : '/login')
  }
}
</script>

<style scoped>
.not-found {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: var(--color-bg-primary);
  padding: var(--space-6);
}

.content {
  max-width: 600px;
  width: 100%;
  text-align: center;
}

.error-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-6);
  margin-bottom: var(--space-8);
}

.error-code {
  font-size: 120px;
  font-weight: var(--font-weight-extrabold);
  color: var(--color-primary);
  margin: 0;
  line-height: 1;
}

.error-text h2 {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin: 0 0 var(--space-3) 0;
}

.message {
  font-size: var(--font-size-lg);
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.6;
}

.details {
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--radius-md);
  padding: var(--space-6);
  margin-bottom: var(--space-8);
  text-align: left;
}

.details h3 {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0 0 var(--space-4) 0;
}

.details ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.details li {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  padding-left: var(--space-6);
  position: relative;
}

.details li::before {
  content: '•';
  position: absolute;
  left: var(--space-3);
  color: var(--color-primary);
  font-weight: var(--font-weight-bold);
}

.actions {
  display: flex;
  gap: var(--space-3);
  justify-content: center;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .not-found {
    padding: var(--space-4);
  }

  .error-code {
    font-size: 80px;
  }

  .error-text h2 {
    font-size: var(--font-size-2xl);
  }

  .message {
    font-size: var(--font-size-base);
  }

  .details {
    padding: var(--space-4);
  }

  .actions {
    flex-direction: column;
    width: 100%;
  }

  .actions :deep(button) {
    width: 100%;
  }
}
</style>
