<template>
  <Dialog v-model:open="localOpen">
    <DialogContent class="max-h-[90dvh] overflow-y-auto sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ isApproving ? 'Approuver l\'absence' : 'Refuser l\'absence' }}</DialogTitle>
        <DialogDescription>
          {{ isApproving ? 'Confirmer l\'approbation de cette absence' : 'Indiquer le motif du refus' }}
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4">
        <!-- Résumé de l'absence -->
        <div v-if="absence" class="rounded-lg border bg-muted/50 p-4 space-y-2">
          <div class="flex justify-between py-1.5 border-b border-border last:border-0">
            <span class="text-sm text-muted-foreground">Employé</span>
            <span class="text-sm font-medium text-foreground">
              {{ absence.user?.firstName }} {{ absence.user?.lastName }}
            </span>
          </div>
          <div class="flex justify-between py-1.5 border-b border-border last:border-0">
            <span class="text-sm text-muted-foreground">Période</span>
            <span class="text-sm font-medium text-foreground">
              {{ formatDate(absence.startDate) }}
              <span v-if="absence.startDate !== absence.endDate">
                → {{ formatDate(absence.endDate) }}
              </span>
            </span>
          </div>
          <div v-if="isHalfDay(absence.period)" class="flex justify-between py-1.5 border-b border-border last:border-0">
            <span class="text-sm text-muted-foreground">Période</span>
            <span class="text-sm font-medium text-foreground">{{ getPeriodLabel(absence.period) }}</span>
          </div>
          <div class="flex justify-between py-1.5 border-b border-border last:border-0">
            <span class="text-sm text-muted-foreground">Motif</span>
            <span class="text-sm font-medium text-foreground">{{ absence.reason || '-' }}</span>
          </div>
        </div>

        <!-- Motif du refus (uniquement pour le refus) -->
        <div v-if="!isApproving" class="flex flex-col gap-2">
          <label for="rejectionReason" class="text-sm font-medium text-foreground">Motif du refus *</label>
          <textarea
            id="rejectionReason"
            v-model="rejectionReason"
            placeholder="Indiquez le motif du refus..."
            rows="3"
            :disabled="saving"
            class="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          ></textarea>
        </div>

        <div v-if="error" class="flex items-center gap-2 rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle class="size-4 shrink-0" />
          {{ error }}
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="handleClose" :disabled="saving">
          Annuler
        </Button>
        <Button
          :variant="isApproving ? 'default' : 'destructive'"
          @click="handleValidate"
          :disabled="saving || (!isApproving && !rejectionReason.trim())"
        >
          <LoaderCircle v-if="saving" class="size-4 animate-spin mr-2" />
          {{ isApproving ? 'Approuver' : 'Refuser' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { absencesService } from '@/services'
import { useMessages } from '@/composables/useMessages'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { LoaderCircle, AlertCircle } from 'lucide-vue-next'
import type { AbsenceDTO } from '@/models'
import { isHalfDay, getPeriodLabel } from '@/utils/absenceFormatters'

interface Props {
  modelValue: boolean
  absence: AbsenceDTO | null
  isApproving: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'validated': [absence: AbsenceDTO]
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
const saving = ref(false)
const error = ref('')
const rejectionReason = ref('')

// Réinitialiser quand le modal s'ouvre
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    rejectionReason.value = ''
    error.value = ''
  }
})

const formatDate = (dateString?: string | Date): string => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

const handleValidate = async () => {
  if (!props.absence?.uuid) return

  if (!props.isApproving && !rejectionReason.value.trim()) {
    error.value = 'Veuillez indiquer le motif du refus'
    return
  }

  try {
    saving.value = true
    error.value = ''

    await absencesService.validateAbsence(props.absence.uuid, {
      approved: props.isApproving,
      rejectionReason: !props.isApproving ? rejectionReason.value.trim() : undefined
    })

    emit('validated', props.absence)
    messages.success(
      props.isApproving ? 'Absence approuvée avec succès' : 'Absence refusée',
      'Succès'
    )
    handleClose()
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Erreur lors de la validation'
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
