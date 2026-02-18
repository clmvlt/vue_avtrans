<template>
  <div class="user-edit">
    <header class="navbar">
      <div class="navbar-content">
        <div class="navbar-left">
          <router-link to="/users" class="back-link">←</router-link>
          <h1>Modifier l'utilisateur</h1>
        </div>
      </div>
    </header>

    <main class="main-content">
      <div class="container">
        <div v-if="loading" class="loading-state">
          <span class="spinner"></span>
          <p>Chargement...</p>
        </div>

        <div v-else-if="loadError" class="message message-error">
          {{ loadError }}
        </div>

        <div v-else class="form-card">
          <div v-if="successMessage" class="message message-success">
            {{ successMessage }}
          </div>

          <div v-if="errorMessage" class="message message-error">
            {{ errorMessage }}
          </div>

          <form @submit.prevent="handleSubmit" class="user-form">
          <div class="form-group">
            <label for="firstName">Prénom *</label>
            <input
              type="text"
              id="firstName"
              v-model="formData.firstName"
              required
              :disabled="saving"
            />
          </div>

          <div class="form-group">
            <label for="lastName">Nom *</label>
            <input
              type="text"
              id="lastName"
              v-model="formData.lastName"
              required
              :disabled="saving"
            />
          </div>

          <div class="form-group">
            <label for="email">Email *</label>
            <input
              type="email"
              id="email"
              v-model="formData.email"
              required
              :disabled="saving"
            />
          </div>

          <div class="form-group">
            <label for="roleUuid">Rôle</label>
            <select
              id="roleUuid"
              v-model="formData.roleUuid"
              :disabled="saving"
            >
              <option :value="null">Aucun rôle</option>
              <option value="c10523af-a4ab-47e2-8025-5ef4e241ef08">Administrateur</option>
              <option value="ccbd448a-0eef-4277-b53b-91be340b080f">Mécanicien</option>
              <option value="99127dd5-f7bd-446c-9fd0-c05d4ea135b2">Utilisateur</option>
            </select>
          </div>

          <div class="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                v-model="formData.isActive"
                :disabled="saving"
              />
              Compte actif
            </label>
          </div>

          <div class="info-section">
            <h3>Informations du compte</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Email vérifié</span>
                <span :class="['info-value', user?.isMailVerified ? 'verified' : 'not-verified']">
                  {{ user?.isMailVerified ? '✓ Oui' : '✗ Non' }}
                </span>
              </div>
              <div class="info-item">
                <span class="info-label">Créé le</span>
                <span class="info-value">{{ formatDate(user?.createdAt) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Modifié le</span>
                <span class="info-value">{{ formatDate(user?.updatedAt) }}</span>
              </div>
            </div>
          </div>

          <div class="actions-section">
            <router-link :to="`/users/${route.params.uuid}/services`" class="btn-services">
              📊 Voir les services et heures travaillées
            </router-link>
          </div>

          <div class="form-actions">
            <router-link to="/users" class="btn-secondary">
              Annuler
            </router-link>
            <button type="submit" class="btn-primary" :disabled="saving">
              <span v-if="saving" class="spinner"></span>
              {{ saving ? 'Enregistrement...' : 'Enregistrer' }}
            </button>
          </div>
        </form>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { usersService } from '@/services'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const user = ref(null)
const formData = ref({
  firstName: '',
  lastName: '',
  email: '',
  roleUuid: '',
  isActive: true
})

const loading = ref(true)
const saving = ref(false)
const loadError = ref('')
const errorMessage = ref('')
const successMessage = ref('')

const loadUser = async () => {
  try {
    loading.value = true
    loadError.value = ''
    const data = await usersService.getOne(route.params.uuid, authStore.token)
    user.value = data

    // Remplir le formulaire
    formData.value = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      roleUuid: data.role?.uuid || null,
      isActive: data.isActive
    }
  } catch (err) {
    loadError.value = err.message || 'Erreur lors du chargement de l\'utilisateur'
  } finally {
    loading.value = false
  }
}

const handleSubmit = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  try {
    saving.value = true

    // Préparer les données à envoyer
    const dataToSend = {
      firstName: formData.value.firstName,
      lastName: formData.value.lastName,
      email: formData.value.email,
      isActive: formData.value.isActive
    }

    // Ajouter roleUuid seulement s'il n'est pas null
    if (formData.value.roleUuid) {
      dataToSend.roleUuid = formData.value.roleUuid
    }

    const updatedUser = await usersService.update(
      route.params.uuid,
      dataToSend,
      authStore.token
    )

    user.value = updatedUser
    successMessage.value = 'Utilisateur modifié avec succès !'

    // Redirection après 2 secondes
    setTimeout(() => {
      router.push('/users')
    }, 2000)
  } catch (err) {
    errorMessage.value = err.message || 'Erreur lors de la modification'
  } finally {
    saving.value = false
  }
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  loadUser()
})
</script>

<style scoped>
.user-edit {
  min-height: 100vh;
  background-color: var(--bg-primary);
}

.main-content {
  max-width: 800px;
  margin: 0 auto;
  padding: var(--space-6);
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-8);
  color: var(--text-secondary);
}

.form-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
}

.user-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.form-group label {
  display: block;
  margin-bottom: var(--space-2);
  color: var(--text-primary);
  font-weight: 500;
  font-size: var(--text-sm);
}

.form-group input[type="text"],
.form-group input[type="email"],
.form-group select {
  width: 100%;
  padding: var(--space-3);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: var(--text-base);
  transition: all var(--transition-normal);
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-alpha);
}

.form-group input:disabled,
.form-group select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.checkbox-group {
  padding: var(--space-4) 0;
}

.checkbox-group label {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  cursor: pointer;
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  font-weight: var(--font-weight-medium);
}

.checkbox-group input[type="checkbox"] {
  width: 20px;
  height: 20px;
  margin: 0;
  padding: 0;
  cursor: pointer;
  accent-color: var(--color-primary);
  flex-shrink: 0;
}

.info-section {
  margin-top: var(--space-6);
  padding: var(--space-5);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
}

.info-section h3 {
  margin: 0 0 var(--space-4) 0;
  color: var(--text-primary);
  font-size: var(--text-lg);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-4);
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.info-label {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.info-value {
  font-size: var(--text-base);
  color: var(--text-primary);
  font-weight: 500;
}

.info-value.verified {
  color: var(--success);
}

.info-value.not-verified {
  color: var(--error);
}

.actions-section {
  margin-top: var(--space-6);
}

.btn-services {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: var(--space-4);
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
  color: white;
  border-radius: var(--radius-md);
  text-decoration: none;
  font-size: var(--text-base);
  font-weight: 600;
  transition: all var(--transition-base);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
}

.btn-services:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.form-actions {
  display: flex;
  gap: var(--space-3);
  justify-content: flex-end;
  margin-top: var(--space-6);
}

.form-actions .btn-secondary {
  padding: var(--space-3) var(--space-6);
  background-color: var(--bg-tertiary);
  border: 1px solid var(--border-secondary);
  color: var(--text-primary);
  border-radius: var(--radius-md);
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  transition: all var(--transition-base);
}

.form-actions .btn-secondary:hover {
  background-color: var(--bg-hover);
}

.form-actions .btn-primary {
  padding: var(--space-3) var(--space-6);
  background-color: var(--primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  transition: all var(--transition-base);
}

.form-actions .btn-primary:hover:not(:disabled) {
  background-color: var(--primary-light);
}

.form-actions .btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .main-content {
    padding: var(--space-4);
  }

  .form-card {
    padding: var(--space-4);
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column;
  }

  .form-actions .btn-primary,
  .form-actions .btn-secondary {
    width: 100%;
  }
}
</style>
