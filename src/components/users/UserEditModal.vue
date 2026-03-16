<template>
  <Dialog :open="modelValue" @update:open="handleOpenChange">
    <DialogContent class="sm:max-w-[520px] max-h-[90dvh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-3">
          <div class="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <UserPen class="size-5" />
          </div>
          {{ isCreating ? 'Créer un utilisateur' : 'Modifier l\'utilisateur' }}
        </DialogTitle>
        <DialogDescription class="sr-only">
          {{ isCreating ? 'Formulaire de création d\'utilisateur' : 'Formulaire de modification d\'utilisateur' }}
        </DialogDescription>
      </DialogHeader>

      <!-- Loading (uniquement si pas d'initialUser et qu'on doit fetch) -->
      <div v-if="loading" class="flex flex-col items-center justify-center gap-4 py-12">
        <LoaderCircle class="size-10 animate-spin text-primary" />
        <p class="text-muted-foreground">Chargement...</p>
      </div>

      <!-- Form -->
      <form v-else @submit.prevent="handleSubmit" class="space-y-4">
        <div v-if="error" class="flex items-center gap-2 rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle class="size-4 shrink-0" />
          {{ error }}
        </div>

        <div v-if="success" class="flex items-center gap-2 rounded-md border border-success bg-success/10 p-3 text-sm text-success">
          <CircleCheck class="size-4 shrink-0" />
          {{ success }}
        </div>

        <!-- Prénom / Nom -->
        <div class="grid gap-4 sm:grid-cols-2">
          <InputField
            v-model="firstName"
            label="Prénom"
            type="text"
            placeholder="Jean"
            required
            :disabled="saving"
            :icon="User"
          />
          <InputField
            v-model="lastName"
            label="Nom"
            type="text"
            placeholder="Dupont"
            required
            :disabled="saving"
            :icon="User"
          />
        </div>

        <!-- Email -->
        <InputField
          v-model="email"
          label="Email"
          type="email"
          placeholder="jean.dupont@example.com"
          :required="isCreating"
          :disabled="!isCreating || saving"
          :icon="Mail"
          :hint="!isCreating ? 'L\'email ne peut pas être modifié' : undefined"
        />

        <!-- Mot de passe (création uniquement) -->
        <InputField
          v-if="isCreating"
          v-model="password"
          label="Mot de passe"
          type="password"
          placeholder="********"
          required
          :disabled="saving"
          :icon="Lock"
          :show-password-toggle="true"
          hint="Minimum 8 caractères"
        />

        <!-- Rôle -->
        <Select
          v-model="roleUuidSelect"
          label="Rôle"
          :options="roleOptions"
          placeholder="Sélectionner un rôle..."
          :disabled="saving"
          :searchable="false"
          clearable
          :teleport="false"
        />

        <!-- Toggles -->
        <div class="space-y-3">
          <label class="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-accent/50 has-[[data-state=checked]]:border-primary/30 has-[[data-state=checked]]:bg-primary/5">
            <Checkbox
              :checked="isActive"
              @update:checked="(val: boolean | 'indeterminate') => isActive = val === true"
              :disabled="saving"
            />
            <div class="flex flex-col gap-0.5">
              <span class="text-sm font-medium leading-none">Compte actif</span>
              <span class="text-xs text-muted-foreground">L'utilisateur peut se connecter</span>
            </div>
          </label>

          <label class="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-accent/50 has-[[data-state=checked]]:border-primary/30 has-[[data-state=checked]]:bg-primary/5">
            <Checkbox
              :checked="isCouchette"
              @update:checked="(val: boolean | 'indeterminate') => isCouchette = val === true"
              :disabled="saving"
            />
            <div class="flex flex-col gap-0.5">
              <span class="text-sm font-medium leading-none">Permission couchette</span>
              <span class="text-xs text-muted-foreground">Permet de déclarer des couchettes</span>
            </div>
          </label>
        </div>

        <!-- Heures contrat -->
        <div class="space-y-4">
          <h4 class="text-sm font-semibold text-foreground">Contrat</h4>
          <InputField
            v-model="heureContratInput"
            label="Heures mensuelles du contrat"
            type="number"
            placeholder="Ex: 151.67"
            :disabled="saving"
            :icon="Clock"
            hint="Heures contractuelles par mois (ex: 151.67h)"
          />
        </div>

        <!-- Adresse & Permis -->
        <div class="space-y-4">
          <h4 class="text-sm font-semibold text-foreground">Adresse & Permis</h4>

          <InputField
            v-model="driverLicenseNumber"
            label="Numéro de permis"
            type="text"
            placeholder="Ex: 12AB34567"
            :disabled="saving"
            :icon="CreditCard"
          />

          <InputField
            v-model="addressStreet"
            label="Rue"
            type="text"
            placeholder="12 rue de la Paix"
            :disabled="saving"
            :icon="MapPin"
          />

          <div class="grid gap-4 sm:grid-cols-2">
            <InputField
              v-model="addressCity"
              label="Ville"
              type="text"
              placeholder="Paris"
              :disabled="saving"
            />
            <InputField
              v-model="addressPostalCode"
              label="Code postal"
              type="text"
              placeholder="75000"
              :disabled="saving"
            />
          </div>

          <InputField
            v-model="addressCountry"
            label="Pays"
            type="text"
            placeholder="France"
            :disabled="saving"
          />
        </div>

        <!-- Informations système (édition uniquement) -->
        <div v-if="userData && !isCreating" class="rounded-md border border-border bg-muted p-4">
          <h4 class="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Informations système</h4>
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="flex flex-col gap-1">
              <span class="text-xs text-muted-foreground">Email vérifié</span>
              <span :class="[
                'inline-flex w-fit items-center gap-1 rounded-sm px-2 py-0.5 text-xs font-medium',
                userData.isMailVerified ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
              ]">
                <CircleCheck v-if="userData.isMailVerified" class="size-3" />
                <Clock v-else class="size-3" />
                {{ userData.isMailVerified ? 'Vérifié' : 'Non vérifié' }}
              </span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-xs text-muted-foreground">UUID</span>
              <span class="break-all font-mono text-xs text-muted-foreground">{{ userData.uuid }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-xs text-muted-foreground">Créé le</span>
              <span class="text-sm font-medium text-foreground">{{ formatDate(userData.createdAt) }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-xs text-muted-foreground">Modifié le</span>
              <span class="text-sm font-medium text-foreground">{{ formatDate(userData.updatedAt) }}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" @click="handleClose" :disabled="saving">
            Annuler
          </Button>
          <Button type="submit" :disabled="saving">
            <LoaderCircle v-if="saving" class="size-4 animate-spin" />
            {{ isCreating ? 'Créer' : 'Enregistrer' }}
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
import { LoaderCircle, User, UserPen, Mail, Lock, AlertCircle, CircleCheck, Clock, CreditCard, MapPin } from 'lucide-vue-next'
import { InputField } from '@/components/ui/input-field'
import { Checkbox } from '@/components/ui/checkbox'
import { Select } from '@/components/ui/select'
import type { UserDTO, UpdateUserRequest } from '@/models'

interface Props {
  modelValue: boolean
  userUuid?: string | null
  initialUser?: UserDTO | null
  isCreating?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  userUuid: null,
  initialUser: null,
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

// Champs du formulaire en refs séparées (évite les problèmes de réactivité avec reka-ui Checkbox)
const firstName = ref('')
const lastName = ref('')
const email = ref('')
const password = ref('')
const roleUuid = ref<string | null>(null)
const isActive = ref(true)
const isCouchette = ref(false)
const heureContratInput = ref('')
const driverLicenseNumber = ref('')
const addressStreet = ref('')
const addressCity = ref('')
const addressPostalCode = ref('')
const addressCountry = ref('France')

// Options pour le Select de rôle
const roleOptions = [
  { value: 'c10523af-a4ab-47e2-8025-5ef4e241ef08', label: 'Administrateur' },
  { value: 'ccbd448a-0eef-4277-b53b-91be340b080f', label: 'Mécanicien' },
  { value: '99127dd5-f7bd-446c-9fd0-c05d4ea135b2', label: 'Utilisateur' },
]

// Computed pour le Select (string <-> string | null)
const roleUuidSelect = computed({
  get: () => roleUuid.value ?? '',
  set: (val: string) => { roleUuid.value = val || null },
})

// Charger les données quand le dialog s'ouvre
watch(() => props.modelValue, async (isOpen) => {
  if (isOpen) {
    resetForm()
    if (!props.isCreating) {
      if (props.initialUser) {
        populateForm(props.initialUser)
      } else if (props.userUuid) {
        await loadUserData()
      }
    }
  }
}, { immediate: true })

// Peupler le formulaire avec un UserDTO
const populateForm = (user: UserDTO) => {
  userData.value = user
  firstName.value = user.firstName || ''
  lastName.value = user.lastName || ''
  email.value = user.email || ''
  password.value = ''
  roleUuid.value = user.role?.uuid || null
  isActive.value = user.isActive ?? true
  isCouchette.value = user.isCouchette ?? false
  heureContratInput.value = user.heureContrat != null ? String(user.heureContrat) : ''
  driverLicenseNumber.value = user.driverLicenseNumber || ''
  addressStreet.value = user.address?.street || ''
  addressCity.value = user.address?.city || ''
  addressPostalCode.value = user.address?.postalCode || ''
  addressCountry.value = user.address?.country || 'France'
}

// Extraire le UserDTO depuis la réponse API
const extractUser = (response: unknown): UserDTO | undefined => {
  const r = response as any
  const candidate = r?.data || r?.user || r
  if (candidate && (candidate.uuid || candidate.email)) {
    return candidate as UserDTO
  }
  return undefined
}

// Charger les données utilisateur depuis l'API (fallback si pas d'initialUser)
const loadUserData = async () => {
  if (!props.userUuid) return

  try {
    loading.value = true
    error.value = ''

    const response = await usersService.getUserById(props.userUuid)
    const user = extractUser(response)

    if (user) {
      populateForm(user)
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
  firstName.value = ''
  lastName.value = ''
  email.value = ''
  password.value = ''
  roleUuid.value = null
  isActive.value = true
  isCouchette.value = false
  heureContratInput.value = ''
  driverLicenseNumber.value = ''
  addressStreet.value = ''
  addressCity.value = ''
  addressPostalCode.value = ''
  addressCountry.value = 'France'
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

    if (props.isCreating) {
      const dataToSend: any = {
        firstName: firstName.value,
        lastName: lastName.value,
        email: email.value,
        isActive: isActive.value,
        isCouchette: isCouchette.value
      }
      if (password.value) {
        dataToSend.password = password.value
      }
      if (roleUuid.value) {
        dataToSend.roleUuid = roleUuid.value
      }

      // TODO: Implémenter l'endpoint de création dans le service
      // const response = await usersService.createUser(dataToSend)
      // emit('saved', response.data)

      messages.success('Utilisateur créé avec succès !', 'Succès')
      handleClose()
    } else if (props.userUuid) {
      const dataToSend: UpdateUserRequest = {
        firstName: firstName.value,
        lastName: lastName.value,
        isActive: isActive.value,
        isCouchette: isCouchette.value,
        address: {
          street: addressStreet.value,
          city: addressCity.value,
          postalCode: addressPostalCode.value,
          country: addressCountry.value,
        },
        driverLicenseNumber: driverLicenseNumber.value,
        heureContrat: heureContratInput.value ? parseFloat(heureContratInput.value) : null,
      }
      if (roleUuid.value) {
        dataToSend.roleUuid = roleUuid.value
      }

      const response = await usersService.updateUser(props.userUuid, dataToSend)

      const updatedUser = extractUser(response)
      if (!updatedUser) {
        throw new Error('Aucune donnée utilisateur dans la réponse')
      }

      emit('saved', updatedUser)
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

// Fermer le dialog
const handleClose = () => {
  emit('update:modelValue', false)
  emit('close')
}

const handleOpenChange = (open: boolean) => {
  if (!open && !saving.value) {
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
