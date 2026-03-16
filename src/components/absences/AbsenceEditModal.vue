<template>
  <Dialog v-model:open="localOpen">
    <DialogContent class="max-h-[90dvh] overflow-y-auto sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ isEditMode ? "Modifier l'absence" : 'Nouvelle absence' }}</DialogTitle>
        <DialogDescription>
          {{ isEditMode ? "Modifier les informations de l'absence" : 'Créer une nouvelle absence pour un employé' }}
        </DialogDescription>
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

        <!-- Info employé (edit mode) -->
        <div v-if="isEditMode && absence?.user" class="flex items-center gap-3 rounded-lg border border-border bg-muted/50 p-3">
          <div class="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
            <img
              v-if="absence.user.pictureUrl"
              :src="absence.user.pictureUrl"
              :alt="`Photo de ${absence.user.firstName}`"
              class="size-full object-cover"
            />
            <span v-else class="flex size-full items-center justify-center bg-primary text-sm font-semibold text-primary-foreground">
              {{ getInitials(absence.user.firstName, absence.user.lastName) }}
            </span>
          </div>
          <div class="flex flex-col">
            <span class="text-sm font-medium text-foreground">{{ absence.user.firstName }} {{ absence.user.lastName }}</span>
            <span class="text-xs text-muted-foreground">{{ absence.user.email }}</span>
          </div>
        </div>

        <!-- Employé (create mode) -->
        <div v-if="!isEditMode" class="flex flex-col gap-2">
          <label class="text-sm font-medium text-foreground">Employé *</label>
          <Select
            :model-value="formData.userUuid"
            :options="userOptions"
            placeholder="Sélectionner un employé"
            :searchable="true"
            :disabled="saving"
            :teleport="false"
            search-placeholder="Rechercher un employé..."
            @update:model-value="(val: string) => formData.userUuid = val"
          />
        </div>

        <!-- Dates -->
        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-2">
            <label for="editStartDate" class="text-sm font-medium text-foreground">Date de début *</label>
            <Input
              type="date"
              id="editStartDate"
              v-model="formData.startDate"
              required
              :disabled="saving"
            />
          </div>
          <div class="flex flex-col gap-2">
            <label for="editEndDate" class="text-sm font-medium text-foreground">Date de fin *</label>
            <Input
              type="date"
              id="editEndDate"
              v-model="formData.endDate"
              required
              :disabled="saving"
            />
          </div>
        </div>

        <!-- Période -->
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-foreground">Période</label>
          <div class="flex gap-2">
            <Button type="button" size="sm"
              :variant="formData.period === 'FULL_DAY' ? 'default' : 'outline'"
              @click="formData.period = 'FULL_DAY'"
              :disabled="saving"
            >Journée entière</Button>
            <Button type="button" size="sm"
              :variant="formData.period === 'MORNING' ? 'default' : 'outline'"
              @click="formData.period = 'MORNING'"
              :disabled="saving"
            >Matin</Button>
            <Button type="button" size="sm"
              :variant="formData.period === 'AFTERNOON' ? 'default' : 'outline'"
              @click="formData.period = 'AFTERNOON'"
              :disabled="saving"
            >Après-midi</Button>
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
            :teleport="false"
            search-placeholder="Rechercher un type..."
            @update:model-value="(val: string) => formData.absenceTypeUuid = val"
          />
        </div>

        <!-- Type personnalisé -->
        <div v-if="formData.absenceTypeUuid === 'custom'" class="flex flex-col gap-2">
          <label for="editCustomType" class="text-sm font-medium text-foreground">Type personnalisé *</label>
          <Input
            type="text"
            id="editCustomType"
            v-model="formData.customType"
            placeholder="Ex: Formation, Événement familial..."
            :disabled="saving"
          />
        </div>

        <!-- Motif -->
        <div class="flex flex-col gap-2">
          <label for="editReason" class="text-sm font-medium text-foreground">Motif</label>
          <Textarea
            id="editReason"
            v-model="formData.reason"
            placeholder="Motif de l'absence..."
            :disabled="saving"
            class="min-h-20"
          />
        </div>

        <!-- Approuver directement (create mode only) -->
        <label v-if="!isEditMode" class="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-accent/50 has-[[data-state=checked]]:border-primary/30 has-[[data-state=checked]]:bg-primary/5">
          <Checkbox
            :checked="formData.approved"
            @update:checked="(val: boolean) => formData.approved = val"
            :disabled="saving"
          />
          <div class="flex flex-col gap-0.5">
            <span class="text-sm font-medium leading-none">Approuver directement</span>
            <span class="text-xs text-muted-foreground">L'absence sera validée sans attente</span>
          </div>
        </label>

        <!-- Info: REJECTED repasse en PENDING -->
        <div v-if="isEditMode && absence?.status === 'REJECTED'" class="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
          <AlertCircle class="size-4 shrink-0" />
          La modification repassera cette absence en statut « En attente »
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" @click="handleClose" :disabled="saving">
            Annuler
          </Button>
          <Button
            type="submit"
            :disabled="saving || !isFormValid"
          >
            <LoaderCircle v-if="saving" class="size-4 animate-spin mr-2" />
            {{ isEditMode ? "Enregistrer" : "Créer l'absence" }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { absencesService, absenceTypesService, usersService } from '@/services'
import type { AbsenceTypeListResponse } from '@/services/absenceTypes'
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
  absence?: AbsenceDTO | null
}

const props = withDefaults(defineProps<Props>(), {
  absence: null
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'saved': [absence: AbsenceDTO]
  'close': []
}>()

const messages = useMessages()

const isEditMode = computed(() => !!props.absence?.uuid)

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
  period: 'FULL_DAY' as string,
  absenceTypeUuid: '',
  customType: '',
  reason: '',
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
  const hasUser = isEditMode.value || !!formData.value.userUuid
  const hasStartDate = !!formData.value.startDate
  const hasEndDate = !!formData.value.endDate
  const hasType = formData.value.absenceTypeUuid === 'custom'
    ? !!formData.value.customType.trim()
    : !!formData.value.absenceTypeUuid

  return hasUser && hasStartDate && hasEndDate && hasType
})

const getInitials = (firstName?: string, lastName?: string): string => {
  const first = firstName ? firstName.charAt(0).toUpperCase() : ''
  const last = lastName ? lastName.charAt(0).toUpperCase() : ''
  return first + last || '?'
}

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
    if (isEditMode.value) {
      // En mode édition, on charge seulement les types
      const typesResponse = await absenceTypesService.getAbsenceTypes()
      absenceTypes.value = (typesResponse as AbsenceTypeListResponse).types || []
    } else {
      // En mode création, on charge utilisateurs et types en parallèle
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
      absenceTypes.value = (typesResponse as AbsenceTypeListResponse).types || []
    }
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Erreur lors du chargement'
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  error.value = ''

  if (props.absence && isEditMode.value) {
    // Mode édition : pré-remplir avec les données de l'absence
    const a = props.absence
    formData.value = {
      userUuid: a.user?.uuid || '',
      startDate: a.startDate ? String(a.startDate).split('T')[0]! : '',
      endDate: a.endDate ? String(a.endDate).split('T')[0]! : '',
      period: a.period || 'FULL_DAY',
      absenceTypeUuid: a.customType ? 'custom' : (a.absenceType?.uuid || ''),
      customType: a.customType || '',
      reason: a.reason || '',
      approved: false
    }
  } else {
    // Mode création
    const today = new Date().toISOString().split('T')[0] || ''
    formData.value = {
      userUuid: '',
      startDate: today,
      endDate: today,
      period: 'FULL_DAY',
      absenceTypeUuid: '',
      customType: '',
      reason: '',
      approved: false
    }
  }
}

const handleSubmit = async () => {
  if (!isFormValid.value) return

  try {
    saving.value = true
    error.value = ''

    const isCustom = formData.value.absenceTypeUuid === 'custom'

    if (isEditMode.value) {
      // Mode édition — envoyer null pour effacer les champs (mise à jour partielle)
      const response = await absencesService.updateAbsenceByAdmin(props.absence!.uuid!, {
        startDate: formData.value.startDate,
        endDate: formData.value.endDate,
        period: formData.value.period,
        absenceTypeUuid: isCustom ? null : formData.value.absenceTypeUuid,
        customType: isCustom ? formData.value.customType.trim() : null,
        reason: formData.value.reason.trim() || null
      })

      emit('saved', response.absence)
      messages.success('Absence modifiée avec succès', 'Succès')
    } else {
      // Mode création
      const response = await absencesService.createAbsenceForUser({
        userUuid: formData.value.userUuid,
        startDate: formData.value.startDate,
        endDate: formData.value.endDate,
        period: formData.value.period,
        absenceTypeUuid: isCustom ? undefined : formData.value.absenceTypeUuid,
        customType: isCustom ? formData.value.customType.trim() : undefined,
        reason: formData.value.reason || undefined,
        approved: formData.value.approved
      })

      emit('saved', response.absence)
      messages.success('Absence créée avec succès', 'Succès')
    }

    handleClose()
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : (isEditMode.value ? 'Erreur lors de la modification' : 'Erreur lors de la création')
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
