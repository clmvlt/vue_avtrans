<script setup lang="ts">
import { computed } from 'vue'
import type { AbsenceDTO } from '@/models'
import {
  calculateAbsenceDuration,
  getAbsenceStatusClasses,
  getAbsenceStatusLabel,
} from '@/utils/absenceFormatters'
import { Button } from '@/components/ui/button'
import { ChevronRight, XCircle } from 'lucide-vue-next'

const props = defineProps<{
  absence: AbsenceDTO
}>()

const emit = defineEmits<{
  open: [absence: AbsenceDTO]
  cancel: [absence: AbsenceDTO]
}>()

const parseDate = (value?: string | Date): Date | null => {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

const start = computed(() => parseDate(props.absence.startDate))
const end = computed(() => parseDate(props.absence.endDate))
const isSameDay = computed(() => props.absence.startDate === props.absence.endDate)

// Tuile de date : jour en grand + mois abrégé
const startDay = computed(() => start.value ? String(start.value.getDate()) : '--')
const startMonth = computed(() =>
  start.value ? start.value.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '') : ''
)

const formatShort = (d: Date | null): string =>
  d ? d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '-'

const formatLong = (d: Date | null): string =>
  d ? d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) : '-'

const rangeLabel = computed(() => {
  if (isSameDay.value) return formatLong(start.value)
  return `${formatShort(start.value)} → ${formatShort(end.value)}`
})

const durationLabel = computed(() =>
  calculateAbsenceDuration(props.absence.startDate, props.absence.endDate, props.absence.period)
)

const typeName = computed(() =>
  props.absence.absenceType?.name || props.absence.customType || 'Absence'
)

// Couleur du type d'absence appliquée à la tuile de date (repli : couleur primaire)
const tileStyle = computed(() => {
  const color = props.absence.absenceType?.color
  return color ? { backgroundColor: `${color}1f`, color } : undefined
})

const isPending = computed(() => props.absence.status === 'PENDING')
const statusLabel = computed(() => getAbsenceStatusLabel(props.absence.status))
const statusClasses = computed(() => getAbsenceStatusClasses(props.absence.status))

const requestedAt = computed(() => {
  const d = parseDate(props.absence.createdAt)
  return d ? d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : ''
})
</script>

<template>
  <article
    class="flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-colors hover:border-primary/40"
  >
    <button
      type="button"
      class="flex min-w-0 flex-1 items-center gap-3 p-3 text-left transition-colors active:bg-accent/40 sm:p-4"
      :aria-label="`Détails : ${typeName}, ${rangeLabel}`"
      @click="emit('open', props.absence)"
    >
      <!-- Tuile de date -->
      <div
        class="flex w-14 shrink-0 flex-col items-center justify-center self-stretch rounded-lg bg-primary/10 py-1.5 text-primary"
        :style="tileStyle"
      >
        <span class="text-xl font-bold leading-none tabular-nums">{{ startDay }}</span>
        <span class="mt-1 text-[11px] font-semibold uppercase leading-none">{{ startMonth }}</span>
      </div>

      <!-- Contenu -->
      <div class="min-w-0 flex-1">
        <div class="flex items-start justify-between gap-2">
          <p class="truncate font-semibold text-foreground">{{ typeName }}</p>
          <span
            class="shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold"
            :class="statusClasses"
          >
            {{ statusLabel }}
          </span>
        </div>
        <p class="mt-0.5 truncate text-sm text-muted-foreground">
          <span class="capitalize">{{ rangeLabel }}</span> · {{ durationLabel }}
        </p>
        <p v-if="props.absence.reason" class="mt-1 line-clamp-1 text-xs text-muted-foreground">
          {{ props.absence.reason }}
        </p>
        <p
          v-if="props.absence.status === 'REJECTED' && props.absence.rejectionReason"
          class="mt-1 line-clamp-1 text-xs text-destructive"
        >
          Refus : {{ props.absence.rejectionReason }}
        </p>
      </div>

      <ChevronRight class="size-4 shrink-0 text-muted-foreground/60" />
    </button>

    <!-- Pied : uniquement pour les demandes en attente (annulation possible) -->
    <div v-if="isPending" class="flex items-center justify-between border-t bg-muted/30 px-3 py-1.5 sm:px-4">
      <span class="text-xs text-muted-foreground">
        <template v-if="requestedAt">Demandé le {{ requestedAt }}</template>
      </span>
      <Button
        variant="ghost"
        size="sm"
        class="h-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
        @click.stop="emit('cancel', props.absence)"
      >
        <XCircle class="size-4" />
        Annuler
      </Button>
    </div>
  </article>
</template>
