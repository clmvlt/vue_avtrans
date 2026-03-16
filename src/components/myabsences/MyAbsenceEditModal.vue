<template>
  <Dialog v-model:open="localOpen">
    <DialogContent class="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Nouvelle demande d'absence</DialogTitle>
        <DialogDescription>Envoyer une demande d'absence à votre responsable</DialogDescription>
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

        <!-- Dates -->
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
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
          <label for="createCustomType" class="text-sm font-medium text-foreground">Type personnalisé *</label>
          <Input
            type="text"
            id="createCustomType"
            v-model="formData.customType"
            placeholder="Ex: Formation, Événement familial..."
            :disabled="saving"
          />
        </div>

        <!-- Motif -->
        <div class="flex flex-col gap-2">
          <label for="createReason" class="text-sm font-medium text-foreground">Motif</label>
          <Textarea
            id="createReason"
            v-model="formData.reason"
            placeholder="Décrivez la raison de votre absence..."
            :disabled="saving"
            class="min-h-20"
          />
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
            Envoyer la demande
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { absencesService, absenceTypesService } from '@/services'
import type { AbsenceTypeListResponse } from '@/services/absenceTypes'
import { useMessages } from '@/composables/useMessages'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { LoaderCircle, AlertCircle } from 'lucide-vue-next'
import type { AbsenceDTO, AbsenceTypeDTO } from '@/models'

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
const absenceTypes = ref<AbsenceTypeDTO[]>([])

// Formulaire
const formData = ref({
  startDate: '',
  endDate: '',
  period: 'FULL_DAY' as string,
  absenceTypeUuid: '',
  customType: '',
  reason: ''
})

// Options pour Select
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
  const hasStartDate = !!formData.value.startDate
  const hasEndDate = !!formData.value.endDate
  const hasType = formData.value.absenceTypeUuid === 'custom'
    ? !!formData.value.customType.trim()
    : !!formData.value.absenceTypeUuid

  // Vérifier que la date de fin n'est pas avant la date de début
  const datesValid = !hasStartDate || !hasEndDate ||
    new Date(formData.value.endDate) >= new Date(formData.value.startDate)

  return hasStartDate && hasEndDate && hasType && datesValid
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
    const typesResponse: AbsenceTypeListResponse = await absenceTypesService.getAbsenceTypes()
    absenceTypes.value = typesResponse.types || []
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Erreur lors du chargement'
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  const today = new Date().toISOString().split('T')[0] || ''
  formData.value = {
    startDate: today,
    endDate: today,
    period: 'FULL_DAY',
    absenceTypeUuid: '',
    customType: '',
    reason: ''
  }
  error.value = ''
}

const handleSubmit = async () => {
  if (!isFormValid.value) return

  try {
    saving.value = true
    error.value = ''

    const isCustom = formData.value.absenceTypeUuid === 'custom'

    const response = await absencesService.createAbsenceRequest({
      startDate: formData.value.startDate,
      endDate: formData.value.endDate,
      period: formData.value.period,
      absenceTypeUuid: isCustom ? undefined : formData.value.absenceTypeUuid,
      customType: isCustom ? formData.value.customType.trim() : undefined,
      reason: formData.value.reason || undefined
    })

    emit('saved', response.absence)
    messages.success('Demande d\'absence envoyée avec succès', 'Succès')
    handleClose()
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : "Erreur lors de l'envoi de la demande"
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
