<template>
  <Dialog v-model:open="localOpen">
    <DialogContent class="sm:max-w-md" @interact-outside.prevent>
      <DialogHeader>
        <DialogTitle>Nouvelle absence</DialogTitle>
        <DialogDescription>Créer une nouvelle absence pour un employé</DialogDescription>
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

        <!-- Dates -->
        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-2">
            <label for="createStartDate" class="text-sm font-medium text-foreground">Date de début *</label>
            <Input
              type="date"
              id="createStartDate"
              v-model="formData.startDate"
              required
              :disabled="saving"
            />
          </div>
          <div class="flex flex-col gap-2">
            <label for="createEndDate" class="text-sm font-medium text-foreground">Date de fin *</label>
            <Input
              type="date"
              id="createEndDate"
              v-model="formData.endDate"
              required
              :disabled="saving"
            />
          </div>
        </div>

        <!-- Type d'absence -->
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-foreground">Type d'absence *</label>
          <Select
            :model-value="formData.absenceTypeUuid"
            :options="absenceTypeOptions"
            placeholder="Sélectionner un type"
            :searchable="true"
            :disabled="saving"
            search-placeholder="Rechercher un type..."
            @update:model-value="(val: string) => formData.absenceTypeUuid = val"
          />
        </div>

        <!-- Type personnalisé -->
        <div v-if="formData.absenceTypeUuid === 'custom'" class="flex flex-col gap-2">
          <label for="createCustomType" class="text-sm font-medium text-foreground">Type personnalisé *</label>
          <Input
            type="text"
            id="createCustomType"
            v-model="formData.customType"
            placeholder="Ex: Formation, Événement familial..."
            :disabled="saving"
          />
        </div>

        <!-- Commentaire -->
        <div class="flex flex-col gap-2">
          <label for="createComment" class="text-sm font-medium text-foreground">Commentaire</label>
          <Textarea
            id="createComment"
            v-model="formData.comment"
            placeholder="Commentaire sur l'absence..."
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
            Créer l'absence
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { absencesService, absenceTypesService, usersService } from '@/services'
import { useMessages } from '@/composables/useMessages'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select } from '@/components/ui/select'
import { LoaderCircle, AlertCircle } from 'lucide-vue-next'
import type { AbsenceDTO, AbsenceTypeDTO, UserDTO } from '@/models'

interface Props {
  modelValue: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'saved': [absence: AbsenceDTO]
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
const absenceTypes = ref<AbsenceTypeDTO[]>([])

// Formulaire
const formData = ref({
  userUuid: '',
  startDate: '',
  endDate: '',
  absenceTypeUuid: '',
  customType: '',
  comment: '',
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

const absenceTypeOptions = computed(() => {
  const options = absenceTypes.value
    .filter(type => type.uuid && type.name)
    .map(type => ({
      value: type.uuid!,
      label: type.name!
    }))
  // Ajouter l'option personnalisée
  options.push({ value: 'custom', label: 'Autre (personnalisé)' })
  return options
})

// Validation
const isFormValid = computed(() => {
  const hasUser = !!formData.value.userUuid
  const hasStartDate = !!formData.value.startDate
  const hasEndDate = !!formData.value.endDate
  const hasType = formData.value.absenceTypeUuid === 'custom'
    ? !!formData.value.customType.trim()
    : !!formData.value.absenceTypeUuid

  return hasUser && hasStartDate && hasEndDate && hasType
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
    // Charger utilisateurs et types en parallèle
    const [usersResponse, typesResponse] = await Promise.all([
      usersService.getUsers(),
      absenceTypesService.getAbsenceTypes()
    ])

    // Utilisateurs
    if (usersResponse && usersResponse.data) {
      users.value = Array.isArray(usersResponse.data) ? usersResponse.data : []
    } else if (Array.isArray(usersResponse)) {
      users.value = usersResponse as unknown as UserDTO[]
    } else {
      users.value = []
    }

    // Types d'absence
    absenceTypes.value = (typesResponse as any).types || []
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Erreur lors du chargement'
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  const today = new Date().toISOString().split('T')[0] || ''
  formData.value = {
    userUuid: '',
    startDate: today,
    endDate: today,
    absenceTypeUuid: '',
    customType: '',
    comment: '',
    approved: false
  }
  error.value = ''
}

const handleSubmit = async () => {
  if (!isFormValid.value) return

  try {
    saving.value = true
    error.value = ''

    const absenceTypeUuid = formData.value.absenceTypeUuid === 'custom'
      ? ''
      : formData.value.absenceTypeUuid

    const response = await absencesService.createAbsenceForUser({
      userUuid: formData.value.userUuid,
      startDate: formData.value.startDate,
      endDate: formData.value.endDate,
      absenceTypeUuid,
      comment: formData.value.comment || undefined,
      approved: formData.value.approved
    })

    emit('saved', response as AbsenceDTO)
    messages.success('Absence créée avec succès', 'Succès')
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
