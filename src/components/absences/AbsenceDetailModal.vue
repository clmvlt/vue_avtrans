<template>
  <Dialog v-model:open="localOpen">
    <DialogContent class="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Détails de l'absence</DialogTitle>
        <DialogDescription class="sr-only">Informations détaillées de l'absence</DialogDescription>
      </DialogHeader>

      <div v-if="absence" class="space-y-5">
        <!-- Employé -->
        <div class="border-b pb-4">
          <h4 class="mb-3 text-xs uppercase tracking-wider text-muted-foreground">Employé</h4>
          <div class="flex items-center gap-4">
            <div class="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-border bg-muted">
              <img
                v-if="absence.user?.pictureUrl"
                :src="absence.user.pictureUrl"
                :alt="`Photo de ${absence.user?.firstName}`"
                class="size-full object-cover"
              />
              <span v-else class="flex size-full items-center justify-center bg-primary text-lg font-semibold text-primary-foreground">
                {{ getInitials(absence.user?.firstName, absence.user?.lastName) }}
              </span>
            </div>
            <div class="flex flex-col gap-1">
              <strong class="text-foreground">{{ absence.user?.firstName }} {{ absence.user?.lastName }}</strong>
              <span class="text-sm text-muted-foreground">{{ absence.user?.email }}</span>
            </div>
          </div>
        </div>

        <!-- Type d'absence -->
        <div v-if="absence.absenceType || absence.customType" class="flex flex-col gap-1">
          <span class="text-xs uppercase tracking-wider text-muted-foreground">Type d'absence</span>
          <span
            v-if="absence.absenceType"
            class="inline-block w-fit rounded-md border px-2.5 py-0.5 text-xs font-medium"
            :style="{
              backgroundColor: absence.absenceType.color + '20',
              color: absence.absenceType.color,
              borderColor: absence.absenceType.color
            }"
          >
            {{ absence.absenceType.name }}
          </span>
          <span v-else-if="absence.customType" class="inline-block w-fit rounded-md border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            {{ absence.customType }}
          </span>
        </div>

        <!-- Période -->
        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-1">
            <span class="text-xs uppercase tracking-wider text-muted-foreground">Date de début</span>
            <span class="font-medium text-foreground">{{ formatDate(absence.startDate) }}</span>
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-xs uppercase tracking-wider text-muted-foreground">Date de fin</span>
            <span class="font-medium text-foreground">{{ formatDate(absence.endDate) }}</span>
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-xs uppercase tracking-wider text-muted-foreground">Durée</span>
            <span class="font-medium text-foreground">{{ calculateAbsenceDuration(absence.startDate, absence.endDate, absence.period) }}</span>
          </div>
          <div v-if="isHalfDay(absence.period)" class="flex flex-col gap-1">
            <span class="text-xs uppercase tracking-wider text-muted-foreground">Période</span>
            <span class="font-medium text-foreground">{{ getPeriodLabel(absence.period) }}</span>
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-xs uppercase tracking-wider text-muted-foreground">Statut</span>
            <Badge :variant="getStatusVariant(absence.status)" :class="getStatusClasses(absence.status)">
              {{ getStatusText(absence.status) }}
            </Badge>
          </div>
        </div>

        <!-- Motif -->
        <div class="flex flex-col gap-1">
          <span class="text-xs uppercase tracking-wider text-muted-foreground">Motif</span>
          <span class="font-medium text-foreground">{{ absence.reason || '-' }}</span>
        </div>

        <!-- Validation -->
        <div v-if="absence.validatedBy" class="border-b pb-4">
          <h4 class="mb-3 text-xs uppercase tracking-wider text-muted-foreground">Validation</h4>
          <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-col gap-1">
              <span class="text-xs uppercase tracking-wider text-muted-foreground">Validé par</span>
              <span class="font-medium text-foreground">
                {{ absence.validatedBy.firstName }} {{ absence.validatedBy.lastName }}
              </span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-xs uppercase tracking-wider text-muted-foreground">Date de validation</span>
              <span class="font-medium text-foreground">{{ formatDateTime(absence.validatedAt) }}</span>
            </div>
          </div>
          <div v-if="absence.rejectionReason" class="mt-4 flex flex-col gap-1">
            <span class="text-xs uppercase tracking-wider text-muted-foreground">Motif du refus</span>
            <span class="font-medium italic text-destructive">{{ absence.rejectionReason }}</span>
          </div>
        </div>

        <!-- Dates système -->
        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-1">
            <span class="text-xs uppercase tracking-wider text-muted-foreground">Créé le</span>
            <span class="font-medium text-foreground">{{ formatDateTime(absence.createdAt) }}</span>
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-xs uppercase tracking-wider text-muted-foreground">Modifié le</span>
            <span class="font-medium text-foreground">{{ formatDateTime(absence.updatedAt) }}</span>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="handleClose">
          Fermer
        </Button>
        <template v-if="absence?.status === 'PENDING'">
          <Button variant="default" @click="handleApprove">
            Approuver
          </Button>
          <Button variant="destructive" @click="handleReject">
            Refuser
          </Button>
        </template>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge, type BadgeVariants } from '@/components/ui/badge'
import type { AbsenceDTO } from '@/models'
import { calculateAbsenceDuration, isHalfDay, getPeriodLabel } from '@/utils/absenceFormatters'

interface Props {
  modelValue: boolean
  absence: AbsenceDTO | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'close': []
  'approve': [absence: AbsenceDTO]
  'reject': [absence: AbsenceDTO]
}>()

const localOpen = computed({
  get: () => props.modelValue,
  set: (val: boolean) => {
    if (!val) handleClose()
  }
})

const getInitials = (firstName?: string, lastName?: string): string => {
  const first = firstName ? firstName.charAt(0).toUpperCase() : ''
  const last = lastName ? lastName.charAt(0).toUpperCase() : ''
  return first + last || '?'
}

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

const handleApprove = () => {
  emit('approve', props.absence!)
}

const handleReject = () => {
  emit('reject', props.absence!)
}
</script>
