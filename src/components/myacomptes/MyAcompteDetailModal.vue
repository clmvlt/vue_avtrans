<template>
  <Dialog v-model:open="localOpen">
    <DialogContent class="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Détails de la demande</DialogTitle>
        <DialogDescription class="sr-only">Informations détaillées de votre demande d'acompte</DialogDescription>
      </DialogHeader>

      <div v-if="acompte" class="space-y-5">
        <!-- Montant principal -->
        <div class="flex flex-col items-center gap-2 rounded-lg bg-muted/50 py-5">
          <span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Montant demandé</span>
          <span class="text-3xl font-bold text-green-600 dark:text-green-400">{{ formatMontant(acompte.montant) }}</span>
        </div>

        <!-- Infos principales -->
        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-1">
            <span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Statut</span>
            <Badge :variant="getStatusVariant(acompte.status)" :class="getStatusClasses(acompte.status)">
              {{ getStatusText(acompte.status) }}
            </Badge>
          </div>
          <div v-if="acompte.status === 'APPROVED'" class="flex flex-col gap-1">
            <span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Paiement</span>
            <Badge :variant="acompte.isPaid ? 'outline' : 'outline'" :class="acompte.isPaid ? 'border-green-500/50 text-green-600 dark:text-green-400' : 'border-amber-500/50 text-amber-600 dark:text-amber-400'">
              {{ acompte.isPaid ? 'Payé' : 'Non payé' }}
            </Badge>
          </div>
          <div v-if="acompte.isPaid && acompte.paidDate" class="flex flex-col gap-1">
            <span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Payé le</span>
            <span class="text-sm font-medium text-foreground">{{ formatDateTime(acompte.paidDate) }}</span>
          </div>
        </div>

        <!-- Raison -->
        <div v-if="acompte.raison" class="flex flex-col gap-1">
          <span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Raison</span>
          <span class="text-sm font-medium text-foreground">{{ acompte.raison }}</span>
        </div>

        <!-- Validation -->
        <div v-if="acompte.validatedBy" class="border-t pt-4">
          <h4 class="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Traitement</h4>
          <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-col gap-1">
              <span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Traité par</span>
              <span class="text-sm font-medium text-foreground">
                {{ acompte.validatedBy.firstName }} {{ acompte.validatedBy.lastName }}
              </span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Date de traitement</span>
              <span class="text-sm font-medium text-foreground">{{ formatDateTime(acompte.validatedAt) }}</span>
            </div>
          </div>
          <div v-if="acompte.rejectionReason" class="col-span-2 mt-3 rounded-lg border-l-4 border-destructive bg-destructive/10 p-3">
            <span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Motif du refus</span>
            <p class="mt-1 text-sm font-medium italic text-destructive">{{ acompte.rejectionReason }}</p>
          </div>
        </div>

        <!-- Message d'attente -->
        <div v-if="acompte.status === 'PENDING'" class="flex items-center gap-3 rounded-lg border-l-4 border-amber-500 bg-amber-500/10 p-3 text-sm text-amber-600 dark:text-amber-400">
          <Clock class="size-4 shrink-0" />
          <span>Votre demande est en attente de validation.</span>
        </div>

        <!-- Dates système -->
        <div class="border-t pt-3 text-xs text-muted-foreground">
          Demandé le {{ formatDateTime(acompte.createdAt) }}
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="handleClose">
          Fermer
        </Button>
        <Button
          v-if="acompte?.status === 'PENDING'"
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
import type { AcompteDTO } from '@/models'

interface Props {
  modelValue: boolean
  acompte: AcompteDTO | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'close': []
  'cancel': [acompte: AcompteDTO]
}>()

const localOpen = computed({
  get: () => props.modelValue,
  set: (val: boolean) => {
    if (!val) handleClose()
  }
})

const formatMontant = (montant?: number): string => {
  if (montant === null || montant === undefined) return '0 €'
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
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

const handleCancelRequest = () => {
  if (props.acompte) {
    emit('cancel', props.acompte)
  }
}
</script>
