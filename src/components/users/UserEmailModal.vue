<template>
  <Teleport to="body">
    <div v-if="modelValue" class="modal-overlay" @click="handleOverlayClick">
      <div class="modal modal-email" @click.stop>
        <div class="modal-header">
          <font-awesome-icon :icon="['fas', 'envelope']" class="modal-icon" />
          <h3>Modifier l'email</h3>
          <button type="button" class="btn-close" @click="handleClose" aria-label="Fermer">
            <font-awesome-icon :icon="['fas', 'xmark']" />
          </button>
        </div>

        <form @submit.prevent="handleSubmit" class="modal-form">
          <div v-if="error" class="message message-error">
            <font-awesome-icon :icon="['fas', 'exclamation-circle']" />
            {{ error }}
          </div>

          <!-- Info utilisateur -->
          <div class="user-info-header">
            <span class="user-name">{{ userName }}</span>
            <span class="current-email">Email actuel : {{ currentEmail }}</span>
          </div>

          <!-- Avertissement -->
          <div class="warning-box">
            <font-awesome-icon :icon="['fas', 'info-circle']" class="warning-icon" />
            <div class="warning-content">
              <p class="warning-title">Important</p>
              <template v-if="isSameEmail">
                <p class="warning-text">
                  Cette action va renvoyer un email de vérification à l'adresse actuelle.
                </p>
              </template>
              <template v-else>
                <p class="warning-text">
                  La modification de l'email va :
                </p>
                <ul class="warning-list">
                  <li>Remplacer l'adresse email actuelle</li>
                  <li>Marquer l'email comme <strong>non vérifié</strong></li>
                  <li>Envoyer un nouvel email de vérification</li>
                </ul>
              </template>
            </div>
          </div>

          <!-- Nouveau email -->
          <InputField
            v-model="newEmail"
            label="Nouvel email"
            type="email"
            placeholder="nouveau@example.com"
            required
            :disabled="saving"
            :icon="AtSign"
          />

          <div class="modal-actions">
            <Button type="button" @click="handleClose" variant="ghost" :disabled="saving">
              Annuler
            </Button>
            <Button type="submit" :disabled="saving || !isValid">
              <LoaderCircle v-if="saving" class="size-4 animate-spin" />
              {{ isSameEmail ? 'Renvoyer la vérification' : 'Modifier l\'email' }}
            </Button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { usersService } from '@/services/users'
import { useMessages } from '@/composables/useMessages'
import { Button } from '@/components/ui/button'
import { LoaderCircle, AtSign } from 'lucide-vue-next'
import { InputField } from '@/components/ui/input-field'
import type { UserDTO } from '@/models'

interface Props {
  modelValue: boolean
  userUuid: string | null
  userName: string
  currentEmail: string
}

const props = withDefaults(defineProps<Props>(), {
  userUuid: null,
  userName: '',
  currentEmail: ''
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'saved': [user: UserDTO]
  'close': []
}>()

const messages = useMessages()

// États
const saving = ref(false)
const error = ref('')
const newEmail = ref('')

// Validation simple de l'email
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const isSameEmail = computed(() => {
  return newEmail.value.trim().toLowerCase() === props.currentEmail.toLowerCase()
})

const isValid = computed(() => {
  return newEmail.value.trim() !== '' && isValidEmail(newEmail.value)
})

// Reset quand le modal s'ouvre - pré-remplir avec l'email actuel
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    newEmail.value = props.currentEmail
    error.value = ''
  }
})

// Soumettre le formulaire
const handleSubmit = async () => {
  if (!props.userUuid || !isValid.value) return

  error.value = ''

  try {
    saving.value = true

    const response = await usersService.resendVerificationEmail(props.userUuid, newEmail.value.trim())

    if (!response || !response.user) {
      throw new Error('Aucune donnée utilisateur dans la réponse')
    }

    emit('saved', response.user)
    const successMessage = isSameEmail.value
      ? 'Email de vérification renvoyé avec succès !'
      : 'Email modifié avec succès ! Un email de vérification a été envoyé.'
    messages.success(successMessage, 'Succès')
    handleClose()
  } catch (err: any) {
    if (err.status === 400) {
      error.value = 'Cet email est déjà utilisé par un autre utilisateur'
    } else if (err.status === 404) {
      error.value = 'Utilisateur non trouvé'
    } else {
      error.value = err.message || 'Erreur lors de la modification de l\'email'
    }
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

.modal-email {
  max-width: 480px;
  width: 100%;
  background-color: var(--color-bg-primary);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow-xl);
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

.user-info-header {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-3);
  background-color: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-primary);
}

.user-name {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
}

.current-email {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.warning-box {
  display: flex;
  gap: var(--space-3);
  padding: var(--space-4);
  background-color: var(--color-info-bg);
  border: 1px solid var(--color-info);
  border-radius: var(--radius-md);
}

.warning-icon {
  color: var(--color-info);
  font-size: var(--font-size-lg);
  flex-shrink: 0;
  margin-top: var(--space-1);
}

.warning-content {
  flex: 1;
}

.warning-title {
  margin: 0 0 var(--space-1) 0;
  font-weight: var(--font-weight-semibold);
  color: var(--color-info);
  font-size: var(--font-size-sm);
}

.warning-text {
  margin: 0 0 var(--space-2) 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.warning-list {
  margin: 0;
  padding-left: var(--space-4);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.warning-list li {
  margin-bottom: var(--space-1);
}

.warning-list li:last-child {
  margin-bottom: 0;
}

.modal-actions {
  display: flex;
  gap: var(--space-3);
  justify-content: flex-end;
  margin-top: var(--space-2);
}

@media (max-width: 768px) {
  .modal-email {
    width: 95%;
    padding: var(--space-4);
  }
}
</style>
