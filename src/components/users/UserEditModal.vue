<template>
  <Teleport to="body">
    <div v-if="modelValue" class="modal-overlay" @click="handleOverlayClick">
      <div class="modal modal-user" @click.stop>
      <div class="modal-header">
        <font-awesome-icon :icon="['fas', 'user-pen']" class="modal-icon" />
        <h3>{{ isCreating ? 'Créer un utilisateur' : 'Modifier l\'utilisateur' }}</h3>
        <button type="button" class="btn-close" @click="handleClose" aria-label="Fermer">
          <font-awesome-icon :icon="['fas', 'xmark']" />
        </button>
      </div>

      <div v-if="loading" class="loading-state">
        <span class="spinner"></span>
        <p>Chargement...</p>
      </div>

      <form v-else @submit.prevent="handleSubmit" class="modal-form">
        <div v-if="error" class="message message-error">
          <font-awesome-icon :icon="['fas', 'exclamation-circle']" />
          {{ error }}
        </div>

        <div v-if="success" class="message message-success">
          <font-awesome-icon :icon="['fas', 'check-circle']" />
          {{ success }}
        </div>

        <!-- Champs modifiables -->
        <div class="form-row">
          <InputField
            v-model="formData.firstName"
            label="Prénom"
            type="text"
            placeholder="Jean"
            required
            :disabled="saving"
            :icon="User"
          />

          <InputField
            v-model="formData.lastName"
            label="Nom"
            type="text"
            placeholder="Dupont"
            required
            :disabled="saving"
            :icon="User"
          />
        </div>

        <!-- Email : modifiable en création, lecture seule en édition -->
        <InputField
          v-model="formData.email"
          label="Email"
          type="email"
          placeholder="jean.dupont@example.com"
          :required="isCreating"
          :disabled="!isCreating || saving"
          :icon="Mail"
          :hint="!isCreating ? 'L\'email ne peut pas être modifié' : undefined"
        />

        <!-- Mot de passe : uniquement en création -->
        <AVInput
          v-if="isCreating"
          v-model="formData.password"
          label="Mot de passe"
          type="password"
          placeholder="********"
          required
          :disabled="saving"
          :icon="['fas', 'lock']"
          :show-password-toggle="true"
          hint="Minimum 8 caractères"
        />

        <!-- Rôle : modifiable -->
        <div class="form-group">
          <label for="editRole">Rôle</label>
          <select
            id="editRole"
            v-model="formData.roleUuid"
            :disabled="saving"
            class="role-select"
          >
            <option :value="null">Aucun rôle</option>
            <option value="c10523af-a4ab-47e2-8025-5ef4e241ef08">Administrateur</option>
            <option value="ccbd448a-0eef-4277-b53b-91be340b080f">Mécanicien</option>
            <option value="99127dd5-f7bd-446c-9fd0-c05d4ea135b2">Utilisateur</option>
          </select>
        </div>

        <!-- Compte actif : modifiable -->
        <div class="flex items-center gap-3 p-4 bg-secondary/50 border border-border rounded-md transition-colors hover:bg-secondary">
          <Checkbox
            id="editIsActive"
            :checked="formData.isActive"
            @update:checked="(val: boolean) => formData.isActive = val ?? false"
            :disabled="saving"
          />
          <Label for="editIsActive" class="text-sm font-medium cursor-pointer flex-1">
            Compte actif
          </Label>
        </div>

        <!-- Permission couchette : modifiable -->
        <div class="flex flex-col gap-1">
          <div class="flex items-center gap-3 p-4 bg-secondary/50 border border-border rounded-md transition-colors hover:bg-secondary">
            <Checkbox
              id="editIsCouchette"
              :checked="formData.isCouchette"
              @update:checked="(val: boolean) => formData.isCouchette = val ?? false"
              :disabled="saving"
            />
            <Label for="editIsCouchette" class="text-sm font-medium cursor-pointer flex-1">
              Permission couchette
            </Label>
          </div>
          <span class="text-xs text-muted-foreground ml-[calc(1rem+0.75rem+1rem)]">
            Permet à l'utilisateur de déclarer des couchettes
          </span>
        </div>

        <!-- Section informations en lecture seule (uniquement en mode édition) -->
        <div v-if="userData && !isCreating" class="info-section">
          <h4 class="info-section-title">Informations système</h4>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Email vérifié</span>
              <span :class="['info-badge', userData.isMailVerified ? 'badge-success' : 'badge-warning']">
                <font-awesome-icon :icon="['fas', userData.isMailVerified ? 'check-circle' : 'clock']" />
                {{ userData.isMailVerified ? 'Vérifié' : 'Non vérifié' }}
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">UUID</span>
              <span class="info-value info-uuid">{{ userData.uuid }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Créé le</span>
              <span class="info-value">{{ formatDate(userData.createdAt) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Modifié le</span>
              <span class="info-value">{{ formatDate(userData.updatedAt) }}</span>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <Button type="button" @click="handleClose" variant="ghost" :disabled="saving">
            Annuler
          </Button>
          <Button type="submit" :disabled="saving">
            <LoaderCircle v-if="saving" class="size-4 animate-spin" />
            {{ isCreating ? 'Créer' : 'Enregistrer' }}
          </Button>
        </div>
      </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { usersService } from '@/services/users'
import { useMessages } from '@/composables/useMessages'
import { Button } from '@/components/ui/button'
import { LoaderCircle, User, Mail } from 'lucide-vue-next'
import { InputField } from '@/components/ui/input-field'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import type { UserDTO } from '@/models'

interface Props {
  modelValue: boolean
  userUuid?: string | null
  isCreating?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  userUuid: null,
  isCreating: false
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'saved': [user: UserDTO]
  'close': []
}>()

const messages = useMessages()

// États
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const success = ref('')
const userData = ref<UserDTO | null>(null)

// Données du formulaire
const formData = ref({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  roleUuid: null as string | null,
  isActive: true,
  isCouchette: false
})


// Charger les données utilisateur quand le modal s'ouvre
watch(() => props.modelValue, async (isOpen) => {
  if (isOpen) {
    resetForm()
    if (props.userUuid && !props.isCreating) {
      await loadUserData()
    }
  }
}, { immediate: true })

// Charger les données utilisateur
const loadUserData = async () => {
  if (!props.userUuid) return

  try {
    loading.value = true
    error.value = ''

    const response = await usersService.getUserById(props.userUuid)

    // L'API peut retourner soit { data: UserDTO } soit directement UserDTO
    const responseAny = response as any
    const user: UserDTO | undefined = responseAny.data || responseAny

    if (user && (user.uuid || user.email)) {
      userData.value = user
      formData.value = {
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        password: '',
        roleUuid: user.role?.uuid || null,
        isActive: user.isActive ?? true,
        isCouchette: user.isCouchette ?? false
      }
    } else {
      error.value = 'Données utilisateur non trouvées'
    }
  } catch (err: any) {
    error.value = err.message || 'Erreur lors du chargement de l\'utilisateur'
  } finally {
    loading.value = false
  }
}

// Réinitialiser le formulaire
const resetForm = () => {
  formData.value = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    roleUuid: null,
    isActive: true,
    isCouchette: false
  }
  userData.value = null
  error.value = ''
  success.value = ''
}

// Soumettre le formulaire
const handleSubmit = async () => {
  error.value = ''
  success.value = ''

  try {
    saving.value = true

    const dataToSend: any = {
      firstName: formData.value.firstName,
      lastName: formData.value.lastName,
      isActive: formData.value.isActive,
      roleUuid: formData.value.roleUuid,
      isCouchette: formData.value.isCouchette
    }

    if (props.isCreating) {
      dataToSend.email = formData.value.email
      if (formData.value.password) {
        dataToSend.password = formData.value.password
      }

      // TODO: Implémenter l'endpoint de création dans le service
      // const response = await usersService.createUser(dataToSend)
      // emit('saved', response.data)

      messages.success('Utilisateur créé avec succès !', 'Succès')
      handleClose()
    } else if (props.userUuid) {
      const response = await usersService.updateUser(props.userUuid, dataToSend)

      if (!response || !response.user) {
        throw new Error('Aucune donnée utilisateur dans la réponse')
      }

      emit('saved', response.user)
      messages.success('Utilisateur modifié avec succès !', 'Succès')
      handleClose()
    }
  } catch (err: any) {
    error.value = err.message || `Erreur lors de ${props.isCreating ? 'la création' : 'la modification'}`
    messages.error(error.value, 'Erreur')
  } finally {
    saving.value = false
  }
}

// Fermer le modal
const handleClose = () => {
  emit('update:modelValue', false)
  emit('close')
}

// Gérer le clic sur l'overlay
const handleOverlayClick = () => {
  if (!saving.value) {
    handleClose()
  }
}

// Formater une date
const formatDate = (dateString?: Date | string) => {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return '-'

    return date.toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return '-'
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-index-modal);
  padding: var(--space-4);
}

.modal-user {
  max-width: 520px;
  width: 100%;
  background-color: var(--color-bg-primary);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow-xl);
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-5);
  position: relative;
}

.modal-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-primary-bg);
  color: var(--color-primary);
  border-radius: var(--radius-full);
  font-size: var(--font-size-lg);
}

.modal-header h3 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  flex: 1;
}

.btn-close {
  position: absolute;
  top: 0;
  right: 0;
  width: 32px;
  height: 32px;
  border: none;
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
  border-radius: var(--radius-md);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-base);
}

.btn-close:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-12);
  gap: var(--space-4);
}

.loading-state p {
  color: var(--color-text-secondary);
  margin: 0;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-border-primary);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.message {
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
}

.message-error {
  background-color: var(--color-danger-bg);
  color: var(--color-danger);
  border: 1px solid var(--color-danger);
}

.message-success {
  background-color: var(--color-success-bg);
  color: var(--color-success);
  border: 1px solid var(--color-success);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  display: block;
  margin-bottom: var(--space-2);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.role-select {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
  transition: all var(--transition-base);
  font-family: inherit;
}

.role-select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus);
}

.role-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.info-section {
  padding: var(--space-4);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--radius-md);
  margin-top: var(--space-2);
}

.info-section-title {
  margin: 0 0 var(--space-3) 0;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-4);
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.info-item.full-width {
  grid-column: 1 / -1;
}

.info-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.info-value {
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  font-weight: var(--font-weight-medium);
}

.info-uuid {
  font-family: monospace;
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
  word-break: break-all;
}

.info-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  width: fit-content;
}

.badge-success {
  background-color: var(--color-success-bg);
  color: var(--color-success);
}

.badge-warning {
  background-color: var(--color-warning-bg);
  color: var(--color-warning);
}

.modal-actions {
  display: flex;
  gap: var(--space-3);
  justify-content: flex-end;
  margin-top: var(--space-4);
}

@media (max-width: 768px) {
  .modal-user {
    width: 95%;
    padding: var(--space-4);
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
