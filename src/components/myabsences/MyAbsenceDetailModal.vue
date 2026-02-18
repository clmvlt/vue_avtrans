<template>
  <Dialog v-model:open="localOpen">
    <DialogContent class="max-h-[85dvh] overflow-y-auto sm:max-w-lg" @interact-outside.prevent>
      <DialogHeader>
        <DialogTitle>Détails de la demande</DialogTitle>
        <DialogDescription class="sr-only">Informations détaillées de votre demande d'absence</DialogDescription>
      </DialogHeader>

      <div v-if="absence" class="space-y-5">
        <!-- Type d'absence -->
        <div v-if="absence.absenceType || absence.customType" class="flex flex-col gap-1">
          <span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Type d'absence</span>
          <Badge
            v-if="absence.absenceType"
            variant="outline"
            class="w-fit"
            :style="{
              backgroundColor: absence.absenceType.color + '20',
              color: absence.absenceType.color,
              borderColor: absence.absenceType.color
            }"
          >
            {{ absence.absenceType.name }}
          </Badge>
          <Badge v-else-if="absence.customType" variant="outline" class="w-fit">
            {{ absence.customType }}
          </Badge>
        </div>

        <!-- Période -->
        <div class="grid grid-cols-2 gap-3 sm:gap-4">
          <div class="flex flex-col gap-1">
            <span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Début</span>
            <span class="text-sm font-medium text-foreground">{{ formatDate(absence.startDate) }}</span>
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Fin</span>
            <span class="text-sm font-medium text-foreground">{{ formatDate(absence.endDate) }}</span>
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Durée</span>
            <span class="text-sm font-semibold text-primary">{{ calculateDuration(absence.startDate, absence.endDate) }}</span>
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Statut</span>
            <Badge :variant="getStatusVariant(absence.status)" :class="getStatusClasses(absence.status)" class="w-fit">
              {{ getStatusText(absence.status) }}
            </Badge>
          </div>
        </div>

        <!-- Motif -->
        <div v-if="absence.reason" class="flex flex-col gap-1">
          <span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Motif</span>
          <span class="text-sm font-medium text-foreground">{{ absence.reason }}</span>
        </div>

        <!-- Validation -->
        <div v-if="absence.validatedBy" class="border-t pt-4">
          <h4 class="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Validation</h4>
          <div class="grid grid-cols-2 gap-3 sm:gap-4">
            <div class="flex flex-col gap-1">
              <span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Traité par</span>
              <span class="text-sm font-medium text-foreground">
                {{ absence.validatedBy.firstName }} {{ absence.validatedBy.lastName }}
              </span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Date de traitement</span>
              <span class="text-sm font-medium text-foreground">{{ formatDateTime(absence.validatedAt) }}</span>
            </div>
          </div>
          <div v-if="absence.rejectionReason" class="col-span-2 mt-3 rounded-lg border-l-4 border-destructive bg-destructive/10 p-3">
            <span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Motif du refus</span>
            <p class="mt-1 text-sm font-medium italic text-destructive">{{ absence.rejectionReason }}</p>
          </div>
        </div>

        <!-- Message d'attente -->
        <div v-if="absence.status === 'PENDING'" class="flex items-center gap-3 rounded-lg border-l-4 border-amber-500 bg-amber-500/10 p-3 text-sm text-amber-600 dark:text-amber-400">
          <Clock class="size-4 shrink-0" />
          <span>Votre demande est en attente de validation.</span>
        </div>

        <!-- Dates système -->
        <div class="border-t pt-3 text-xs text-muted-foreground">
          Demandé le {{ formatDateTime(absence.createdAt) }}
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="handleClose">
          Fermer
        </Button>
        <Button
          v-if="absence?.status === 'PENDING'"
          variant="destructive"
          @click="handleCancelRequest"
        >
          Annuler la demande
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge, type BadgeVariants } from '@/components/ui/badge'
import { Clock } from 'lucide-vue-next'
import type { AbsenceDTO } from '@/models'

interface Props {
  modelValue: boolean
  absence: AbsenceDTO | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'close': []
  'cancel': [absence: AbsenceDTO]
}>()

const localOpen = computed({
  get: () => props.modelValue,
  set: (val: boolean) => {
    if (!val) handleClose()
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

const formatDateTime = (dateString?: string | Date): string => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const calculateDuration = (startDate?: string | Date, endDate?: string | Date): string => {
  if (!startDate || !endDate) return '-'
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = Math.abs(end.getTime() - start.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
  return `${diffDays} jour${diffDays > 1 ? 's' : ''}`
}

const getStatusVariant = (status?: string): BadgeVariants['variant'] => {
  switch (status) {
    case 'PENDING': return 'outline'
    case 'APPROVED': return 'outline'
    case 'REJECTED': return 'destructive'
    case 'CANCELLED': return 'secondary'
    default: return 'outline'
  }
}

const getStatusClasses = (status?: string): string => {
  switch (status) {
    case 'PENDING': return 'border-amber-500/50 text-amber-600 dark:text-amber-400'
    case 'APPROVED': return 'border-green-500/50 text-green-600 dark:text-green-400'
    case 'REJECTED': return ''
    case 'CANCELLED': return ''
    default: return 'border-amber-500/50 text-amber-600 dark:text-amber-400'
  }
}

const getStatusText = (status?: string): string => {
  switch (status) {
    case 'PENDING': return 'En attente'
    case 'APPROVED': return 'Approuvée'
    case 'REJECTED': return 'Refusée'
    case 'CANCELLED': return 'Annulée'
    default: return 'Inconnu'
  }
}

const handleClose = () => {
  emit('update:modelValue', false)
  emit('close')
}

const handleCancelRequest = () => {
  if (props.absence) {
    emit('cancel', props.absence)
  }
}
</script>
