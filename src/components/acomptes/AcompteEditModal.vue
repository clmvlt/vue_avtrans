<template>
  <Dialog v-model:open="localOpen">
    <DialogContent class="sm:max-w-md" @interact-outside.prevent>
      <DialogHeader>
        <DialogTitle>Nouvel acompte</DialogTitle>
        <DialogDescription>Créer un nouvel acompte pour un employé</DialogDescription>
      </DialogHeader>

      <div v-if="loading" class="flex flex-col items-center justify-center gap-4 py-12">
        <LoaderCircle class="size-10 animate-spin text-primary" />
        <p class="text-lg text-muted-foreground">Chargement...</p>
      </div>

      <form v-else @submit.prevent="handleSubmit" class="space-y-4">
        <div v-if="error" class="flex items-center gap-2 rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle class="size-4 shrink-0" />
          {{ error }}
        </div>

        <!-- Employé -->
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-foreground">Employé *</label>
          <Select
            :model-value="formData.userUuid"
            :options="userOptions"
            placeholder="Sélectionner un employé"
            :searchable="true"
            :disabled="saving"
            search-placeholder="Rechercher un employé..."
            @update:model-value="(val: string) => formData.userUuid = val"
          />
        </div>

        <!-- Montant -->
        <div class="flex flex-col gap-2">
          <label for="createMontant" class="text-sm font-medium text-foreground">Montant (€) *</label>
          <Input
            type="number"
            id="createMontant"
            v-model.number="formData.montant"
            min="0"
            step="0.01"
            required
            placeholder="Ex: 500"
            :disabled="saving"
          />
        </div>

        <!-- Raison -->
        <div class="flex flex-col gap-2">
          <label for="createRaison" class="text-sm font-medium text-foreground">Raison</label>
          <Textarea
            id="createRaison"
            v-model="formData.raison"
            placeholder="Motif de la demande d'acompte..."
            :disabled="saving"
            class="min-h-20"
          />
        </div>

        <!-- Approuver directement -->
        <label class="flex items-center gap-2 cursor-pointer text-sm">
          <Checkbox
            :checked="formData.approved"
            @update:checked="(val: boolean) => formData.approved = val"
            :disabled="saving"
          />
          <span>Approuver directement</span>
        </label>

        <DialogFooter>
          <Button type="button" variant="outline" @click="handleClose" :disabled="saving">
            Annuler
          </Button>
          <Button
            type="submit"
            :disabled="saving || !isFormValid"
          >
            <LoaderCircle v-if="saving" class="size-4 animate-spin mr-2" />
            Créer l'acompte
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { acomptesService, usersService } from '@/services'
import { useMessages } from '@/composables/useMessages'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { LoaderCircle, AlertCircle } from 'lucide-vue-next'
import type { AcompteDTO, UserDTO } from '@/models'

interface Props {
  modelValue: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'saved': [acompte: AcompteDTO]
  'close': []
}>()

const messages = useMessages()

// Local open state synced with modelValue
const localOpen = computed({
  get: () => props.modelValue,
  set: (val: boolean) => {
    if (!val) handleClose()
  }
})

// États
const loading = ref(false)
const saving = ref(false)
const error = ref('')

// Données
const users = ref<UserDTO[]>([])

// Formulaire
const formData = ref({
  userUuid: '',
  montant: 0,
  raison: '',
  approved: false
})

// Options pour Select
const userOptions = computed(() => {
  return users.value
    .filter(user => user.uuid)
    .map(user => ({
      value: user.uuid!,
      label: `${user.firstName} ${user.lastName}`
    }))
})

// Validation
const isFormValid = computed(() => {
  const hasUser = !!formData.value.userUuid
  const hasMontant = formData.value.montant > 0

  return hasUser && hasMontant
})

// Charger les données quand le modal s'ouvre
watch(() => props.modelValue, async (isOpen) => {
  if (isOpen) {
    resetForm()
    await loadData()
  }
}, { immediate: true })

const loadData = async () => {
  loading.value = true
  error.value = ''

  try {
    const usersResponse = await usersService.getUsers()

    // Utilisateurs
    if (usersResponse && usersResponse.data) {
      users.value = Array.isArray(usersResponse.data) ? usersResponse.data : []
    } else if (Array.isArray(usersResponse)) {
      users.value = usersResponse as unknown as UserDTO[]
    } else {
      users.value = []
    }
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Erreur lors du chargement'
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  formData.value = {
    userUuid: '',
    montant: 0,
    raison: '',
    approved: false
  }
  error.value = ''
}

const handleSubmit = async () => {
  if (!isFormValid.value) return

  try {
    saving.value = true
    error.value = ''

    const response = await acomptesService.createAcompteForUser({
      userUuid: formData.value.userUuid,
      montant: formData.value.montant,
      raison: formData.value.raison || undefined,
      approved: formData.value.approved
    })

    emit('saved', response as unknown as AcompteDTO)
    messages.success('Acompte créé avec succès', 'Succès')
    handleClose()
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Erreur lors de la création'
    messages.error(error.value, 'Erreur')
  } finally {
    saving.value = false
  }
}

const handleClose = () => {
  emit('update:modelValue', false)
  emit('close')
}
</script>
