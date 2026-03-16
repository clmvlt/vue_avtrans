<template>
  <Dialog :open="open" @update:open="handleOpenChange">
    <DialogContent class="sm:max-w-[520px] max-h-[90dvh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-3">
          <div class="flex size-10 items-center justify-center rounded-full bg-warning/10 text-warning">
            <AlertTriangle class="size-5" />
          </div>
          Complétez votre profil
        </DialogTitle>
        <DialogDescription>
          Certaines informations de votre profil sont manquantes. Veuillez renseigner votre adresse et votre numéro de permis de conduire.
        </DialogDescription>
      </DialogHeader>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div v-if="error" class="flex items-center gap-2 rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle class="size-4 shrink-0" />
          {{ error }}
        </div>

        <!-- Numéro de permis -->
        <InputField
          v-if="!hasDriverLicense"
          v-model="driverLicenseNumber"
          label="Numéro de permis de conduire"
          type="text"
          placeholder="Ex: 12AB34567"
          :disabled="saving"
          :icon="CreditCard"
        />

        <!-- Adresse -->
        <template v-if="!hasAddress">
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
        </template>

        <DialogFooter>
          <Button type="button" variant="outline" @click="handleLater" :disabled="saving">
            Plus tard
          </Button>
          <Button type="submit" :disabled="saving">
            <LoaderCircle v-if="saving" class="size-4 animate-spin" />
            Enregistrer
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, toRef } from 'vue'
import { profileService } from '@/services/profile'
import { useAuthStore } from '@/stores/auth'
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
import { InputField } from '@/components/ui/input-field'
import { LoaderCircle, AlertTriangle, AlertCircle, CreditCard, MapPin } from 'lucide-vue-next'
import type { UpdateProfileRequest } from '@/models'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const authStore = useAuthStore()
const messages = useMessages()

const saving = ref(false)
const error = ref('')

const driverLicenseNumber = ref('')
const addressStreet = ref('')
const addressCity = ref('')
const addressPostalCode = ref('')
const addressCountry = ref('France')

// Pré-remplir les champs avec les données existantes à l'ouverture
watch(toRef(props, 'open'), (isOpen) => {
  if (isOpen) {
    const user = authStore.user
    driverLicenseNumber.value = user?.driverLicenseNumber || ''
    addressStreet.value = user?.address?.street || ''
    addressCity.value = user?.address?.city || ''
    addressPostalCode.value = user?.address?.postalCode || ''
    addressCountry.value = user?.address?.country || 'France'
    error.value = ''
  }
})

const hasDriverLicense = computed(() => !!authStore.user?.driverLicenseNumber)
const hasAddress = computed(() => {
  const addr = authStore.user?.address
  return !!(addr?.street && addr?.city && addr?.postalCode)
})

const handleSubmit = async () => {
  error.value = ''

  try {
    saving.value = true

    const data: UpdateProfileRequest = {}

    if (!hasAddress.value) {
      data.address = {
        street: addressStreet.value,
        city: addressCity.value,
        postalCode: addressPostalCode.value,
        country: addressCountry.value || 'France',
      }
    }

    if (!hasDriverLicense.value) {
      data.driverLicenseNumber = driverLicenseNumber.value
    }

    await profileService.updateProfile(data)
    await authStore.refreshUser()

    messages.success('Profil mis à jour avec succès !', 'Succès')
    emit('update:open', false)
  } catch (err: any) {
    error.value = err.message || 'Erreur lors de la mise à jour du profil'
  } finally {
    saving.value = false
  }
}

const handleLater = () => {
  emit('update:open', false)
}

const handleOpenChange = (value: boolean) => {
  if (!value && !saving.value) {
    emit('update:open', false)
  }
}
</script>
