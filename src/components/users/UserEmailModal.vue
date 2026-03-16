<template>
  <Dialog v-model:open="localOpen">
    <DialogContent class="max-h-[90dvh] overflow-y-auto sm:max-w-md">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-3">
          <div class="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Mail class="size-5" />
          </div>
          Modifier l'email
        </DialogTitle>
        <DialogDescription class="sr-only">
          Modifier l'adresse email de l'utilisateur
        </DialogDescription>
      </DialogHeader>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div v-if="error" class="flex items-center gap-2 rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle class="size-4 shrink-0" />
          {{ error }}
        </div>

        <!-- Info utilisateur -->
        <div class="flex flex-col gap-1 rounded-md border border-border bg-muted p-3">
          <span class="text-base font-semibold text-foreground">{{ userName }}</span>
          <span class="text-sm text-muted-foreground">Email actuel : {{ currentEmail }}</span>
        </div>

        <!-- Avertissement -->
        <div class="flex gap-3 rounded-md border border-info bg-info/10 p-4">
          <Info class="mt-0.5 size-5 shrink-0 text-info" />
          <div class="flex-1">
            <p class="mb-1 text-sm font-semibold text-info">Important</p>
            <template v-if="isSameEmail">
              <p class="text-sm text-muted-foreground">
                Cette action va renvoyer un email de vérification à l'adresse actuelle.
              </p>
            </template>
            <template v-else>
              <p class="mb-2 text-sm text-muted-foreground">
                La modification de l'email va :
              </p>
              <ul class="list-disc space-y-1 pl-4 text-sm text-muted-foreground">
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

        <DialogFooter>
          <Button type="button" variant="outline" @click="handleClose" :disabled="saving">
            Annuler
          </Button>
          <Button type="submit" :disabled="saving || !isValid">
            <LoaderCircle v-if="saving" class="size-4 animate-spin" />
            {{ isSameEmail ? 'Renvoyer la vérification' : 'Modifier l\'email' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { usersService } from '@/services/users'
import { useMessages } from '@/composables/useMessages'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { LoaderCircle, AtSign, AlertCircle, Mail, Info } from 'lucide-vue-next'
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

// Local open state synced with modelValue
const localOpen = computed({
  get: () => props.modelValue,
  set: (val) => {
    if (!val && !saving.value) {
      handleClose()
    }
  }
})

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

// Reset quand le dialog s'ouvre - pré-remplir avec l'email actuel
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

// Fermer le dialog
const handleClose = () => {
  emit('update:modelValue', false)
  emit('close')
}
</script>
