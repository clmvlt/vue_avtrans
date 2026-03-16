<template>
  <Dialog v-model:open="localOpen">
    <DialogContent class="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Détails de l'acompte</DialogTitle>
        <DialogDescription class="sr-only">Informations détaillées de l'acompte</DialogDescription>
      </DialogHeader>

      <div v-if="acompte" class="space-y-5">
        <!-- Employé -->
        <div class="border-b pb-4">
          <h4 class="mb-3 text-xs uppercase tracking-wider text-muted-foreground">Employé</h4>
          <div class="flex items-center gap-4">
            <div class="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-border bg-muted">
              <img
                v-if="acompte.user?.pictureUrl"
                :src="acompte.user.pictureUrl"
                :alt="`Photo de ${acompte.user?.firstName}`"
                class="size-full object-cover"
              />
              <span v-else class="flex size-full items-center justify-center bg-primary text-lg font-semibold text-primary-foreground">
                {{ getInitials(acompte.user?.firstName, acompte.user?.lastName) }}
              </span>
            </div>
            <div class="flex flex-col gap-1">
              <strong class="text-foreground">{{ acompte.user?.firstName }} {{ acompte.user?.lastName }}</strong>
              <span class="text-sm text-muted-foreground">{{ acompte.user?.email }}</span>
            </div>
          </div>
        </div>

        <!-- Montant, Status, Payment -->
        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-1">
            <span class="text-xs uppercase tracking-wider text-muted-foreground">Montant</span>
            <span class="text-lg font-semibold text-green-600 dark:text-green-400">{{ formatMontant(acompte.montant) }}</span>
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-xs uppercase tracking-wider text-muted-foreground">Statut</span>
            <Badge :variant="getStatusVariant(acompte.status)" :class="getStatusClasses(acompte.status)">
              {{ getStatusText(acompte.status) }}
            </Badge>
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-xs uppercase tracking-wider text-muted-foreground">Paiement</span>
            <Badge
              :variant="acompte.isPaid ? 'outline' : 'outline'"
              :class="acompte.isPaid ? 'border-green-500/50 text-green-600 dark:text-green-400' : 'border-amber-500/50 text-amber-600 dark:text-amber-400'"
            >
              {{ acompte.isPaid ? 'Payé' : 'Non payé' }}
            </Badge>
          </div>
          <div v-if="acompte.isPaid && acompte.paidDate" class="flex flex-col gap-1">
            <span class="text-xs uppercase tracking-wider text-muted-foreground">Date de paiement</span>
            <span class="font-medium text-foreground">{{ formatDateTime(acompte.paidDate) }}</span>
          </div>
        </div>

        <!-- Raison -->
        <div class="flex flex-col gap-1">
          <span class="text-xs uppercase tracking-wider text-muted-foreground">Raison</span>
          <span class="font-medium text-foreground">{{ acompte.raison || '-' }}</span>
        </div>

        <!-- Validation -->
        <div v-if="acompte.validatedBy" class="border-b pb-4">
          <h4 class="mb-3 text-xs uppercase tracking-wider text-muted-foreground">Validation</h4>
          <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-col gap-1">
              <span class="text-xs uppercase tracking-wider text-muted-foreground">Validé par</span>
              <span class="font-medium text-foreground">
                {{ acompte.validatedBy.firstName }} {{ acompte.validatedBy.lastName }}
              </span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-xs uppercase tracking-wider text-muted-foreground">Date de validation</span>
              <span class="font-medium text-foreground">{{ formatDateTime(acompte.validatedAt) }}</span>
            </div>
          </div>
          <div v-if="acompte.rejectionReason" class="mt-4 flex flex-col gap-1">
            <span class="text-xs uppercase tracking-wider text-muted-foreground">Motif du refus</span>
            <span class="font-medium italic text-destructive">{{ acompte.rejectionReason }}</span>
          </div>
        </div>

        <!-- Dates système -->
        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-1">
            <span class="text-xs uppercase tracking-wider text-muted-foreground">Créé le</span>
            <span class="font-medium text-foreground">{{ formatDateTime(acompte.createdAt) }}</span>
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-xs uppercase tracking-wider text-muted-foreground">Modifié le</span>
            <span class="font-medium text-foreground">{{ formatDateTime(acompte.updatedAt) }}</span>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="handleClose">
          Fermer
        </Button>
        <template v-if="acompte?.status === 'PENDING'">
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
import type { AcompteDTO } from '@/models'

interface Props {
  modelValue: boolean
  acompte: AcompteDTO | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'close': []
  'approve': [acompte: AcompteDTO]
  'reject': [acompte: AcompteDTO]
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

const formatMontant = (montant?: number): string => {
  if (montant === null || montant === undefined) return '0,00 €'
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(montant)
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
    case 'REJECTED': return 'destructive'
    case 'CANCELLED': return 'secondary'
    default: return 'outline'
  }
}

const getStatusClasses = (status?: string): string => {
  switch (status) {
    case 'PENDING': return 'border-amber-500/50 text-amber-600 dark:text-amber-400'
    case 'APPROVED': return 'border-green-500/50 text-green-600 dark:text-green-400'
    default: return ''
  }
}

const getStatusText = (status?: string): string => {
  switch (status) {
    case 'PENDING': return 'En attente'
    case 'APPROVED': return 'Approuvé'
    case 'REJECTED': return 'Refusé'
    case 'CANCELLED': return 'Annulé'
    default: return 'Inconnu'
  }
}

const handleClose = () => {
  emit('update:modelValue', false)
  emit('close')
}

const handleApprove = () => {
  emit('approve', props.acompte!)
}

const handleReject = () => {
  emit('reject', props.acompte!)
}
</script>
