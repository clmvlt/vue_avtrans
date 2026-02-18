<template>
  <div class="unauthorized-container">
    <div class="unauthorized-card">
      <div class="icon-container">
        <span class="icon">🚫</span>
      </div>

      <h1>Accès refusé</h1>

      <p class="error-message">
        Vous n'avez pas les permissions nécessaires pour accéder à cette application.
      </p>

      <div v-if="userRole" class="role-badge">
        <span class="role-label">Votre rôle actuel</span>
        <span class="role-value">{{ userRole }}</span>
      </div>

      <div class="info-section">
        <p class="info-text">
          Seuls les <strong>Administrateurs</strong> et les <strong>Mécaniciens</strong> peuvent accéder à ce site.
        </p>
        <p class="info-text">
          Si vous êtes un <strong>Utilisateur</strong>, veuillez utiliser l'application mobile pour accéder à vos pointages.
        </p>
        <p class="info-text muted">
          Si vous pensez qu'il s'agit d'une erreur, veuillez contacter votre administrateur système.
        </p>
      </div>

      <button @click="handleLogout" class="btn-logout">
        Se déconnecter
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const userRole = computed(() => authStore.userRole)

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.unauthorized-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-6);
  background: linear-gradient(135deg, var(--bg-primary) 0%, #1a1d2e 100%);
}

.unauthorized-card {
  width: 100%;
  max-width: 480px;
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-xl);
  padding: var(--space-10);
  box-shadow: var(--shadow-xl);
  text-align: center;
}

.icon-container {
  margin-bottom: var(--space-6);
}

.icon {
  font-size: 64px;
  display: inline-block;
  filter: grayscale(20%);
}

h1 {
  font-size: var(--font-size-3xl);
  color: var(--error);
  margin-bottom: var(--space-4);
  font-weight: 600;
}

.error-message {
  color: var(--text-secondary);
  font-size: var(--font-size-lg);
  margin-bottom: var(--space-6);
  line-height: 1.5;
}

.role-badge {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  background-color: var(--warning-bg);
  border: 1px solid var(--warning);
  border-radius: var(--radius-lg);
  padding: var(--space-4) var(--space-6);
  margin-bottom: var(--space-6);
}

.role-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.role-value {
  font-size: var(--font-size-lg);
  color: var(--warning);
  font-weight: 600;
}

.info-section {
  margin-bottom: var(--space-8);
}

.info-text {
  color: var(--text-secondary);
  font-size: var(--font-size-base);
  line-height: 1.6;
  margin-bottom: var(--space-3);
}

.info-text:last-child {
  margin-bottom: 0;
}

.info-text strong {
  color: var(--text-primary);
  font-weight: 500;
}

.info-text.muted {
  color: var(--text-muted);
  font-size: var(--font-size-sm);
  margin-top: var(--space-4);
}

.btn-logout {
  width: 100%;
  padding: var(--space-4) var(--space-6);
  background-color: var(--primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-base);
}

.btn-logout:hover {
  background-color: var(--primary-light);
  transform: scale(1.02);
}

.btn-logout:active {
  background-color: var(--primary-dark);
  transform: scale(0.98);
}

@media (max-width: 480px) {
  .unauthorized-card {
    padding: var(--space-6);
  }

  .icon {
    font-size: 48px;
  }

  h1 {
    font-size: var(--font-size-2xl);
  }
}
</style>
