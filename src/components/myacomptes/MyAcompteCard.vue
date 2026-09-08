<script setup lang="ts">
import { computed } from 'vue'
import type { AcompteDTO } from '@/models'
import { formatMontant, getAcompteStatusClasses, getAcompteStatusLabel } from '@/utils/acompteFormatters'
import { Button } from '@/components/ui/button'
import { ChevronRight, XCircle, CheckCircle2, Hourglass } from 'lucide-vue-next'

const props = defineProps<{
  acompte: AcompteDTO
}>()

const emit = defineEmits<{
  open: [acompte: AcompteDTO]
  cancel: [acompte: AcompteDTO]
}>()

const parseDate = (value?: string | Date): Date | null => {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

// Tuile de date : jour de la demande en grand + mois abrégé
const createdAt = computed(() => parseDate(props.acompte.createdAt))
const createdDay = computed(() => createdAt.value ? String(createdAt.value.getDate()) : '--')
const createdMonth = computed(() =>
  createdAt.value ? createdAt.value.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '') : ''
)

const formatShort = (d: Date | null): string =>
  d ? d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '-'

const montantLabel = computed(() => formatMontant(props.acompte.montant))
const isPending = computed(() => props.acompte.status === 'PENDING')
const isApproved = computed(() => props.acompte.status === 'APPROVED')
const statusLabel = computed(() => getAcompteStatusLabel(props.acompte.status))
const statusClasses = computed(() => getAcompteStatusClasses(props.acompte.status))

// Ligne de paiement (uniquement pour les demandes approuvées)
const paymentLabel = computed(() => {
  if (!isApproved.value) return ''
  if (props.acompte.isPaid) {
    const paid = parseDate(props.acompte.paidDate)
    return paid ? `Payé le ${formatShort(paid)}` : 'Payé'
  }
  return 'En attente de paiement'
})

// Teinte de la tuile selon le statut
const tileClass = computed(() => {
  switch (props.acompte.status) {
    case 'APPROVED': return 'bg-green-500/10 text-green-700 dark:text-green-400'
    case 'REJECTED': return 'bg-destructive/10 text-destructive'
    case 'CANCELLED': return 'bg-muted text-muted-foreground'
    default: return 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
  }
})
</script>

<template>
  <article
    class="flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-colors hover:border-primary/40"
  >
    <button
      type="button"
      class="flex min-w-0 flex-1 items-center gap-3 p-3 text-left transition-colors active:bg-accent/40 sm:p-4"
      :aria-label="`Détails : ${montantLabel}, ${statusLabel}`"
      @click="emit('open', props.acompte)"
    >
      <!-- Tuile de date de demande -->
      <div
        class="flex w-14 shrink-0 flex-col items-center justify-center self-stretch rounded-lg py-1.5"
        :class="tileClass"
      >
        <span class="text-xl font-bold leading-none tabular-nums">{{ createdDay }}</span>
        <span class="mt-1 text-[11px] font-semibold uppercase leading-none">{{ createdMonth }}</span>
      </div>

      <!-- Contenu -->
      <div class="min-w-0 flex-1">
        <div class="flex items-start justify-between gap-2">
          <p class="truncate text-lg font-bold tabular-nums text-foreground">{{ montantLabel }}</p>
          <span
            class="shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold"
            :class="statusClasses"
          >
            {{ statusLabel }}
          </span>
        </div>
        <p class="mt-0.5 truncate text-sm text-muted-foreground">
          {{ props.acompte.raison || 'Sans motif' }}
        </p>
        <p
          v-if="paymentLabel"
          class="mt-1 flex items-center gap-1 text-xs"
          :class="props.acompte.isPaid ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400'"
        >
          <CheckCircle2 v-if="props.acompte.isPaid" class="size-3.5" />
          <Hourglass v-else class="size-3.5" />
          {{ paymentLabel }}
        </p>
        <p
          v-if="props.acompte.status === 'REJECTED' && props.acompte.rejectionReason"
          class="mt-1 line-clamp-1 text-xs text-destructive"
        >
          Refus : {{ props.acompte.rejectionReason }}
        </p>
      </div>

      <ChevronRight class="size-4 shrink-0 text-muted-foreground/60" />
    </button>

    <!-- Pied : uniquement pour les demandes en attente (annulation possible) -->
    <div v-if="isPending" class="flex items-center justify-between border-t bg-muted/30 px-3 py-1.5 sm:px-4">
      <span class="text-xs text-muted-foreground">En attente de validation</span>
      <Button
        variant="ghost"
        size="sm"
        class="h-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
        @click.stop="emit('cancel', props.acompte)"
      >
        <XCircle class="size-4" />
        Annuler
      </Button>
    </div>
  </article>
</template>
