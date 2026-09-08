<script setup lang="ts">
import type { ServiceDTO } from '@/models'
import { formatDuration } from '@/utils/timeFormatters'
import { ArrowRight, ClipboardList } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  services: ServiceDTO[]
  /** UUID du service en cours : sa durée est calculée en direct à partir de `elapsedMs` */
  activeUuid?: string
  elapsedMs?: number
  emptyText?: string
}>(), {
  activeUuid: undefined,
  elapsedMs: 0,
  emptyText: 'Aucun service enregistré',
})

const toTime = (date?: Date | string): string => {
  if (!date) return '--:--'
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return '--:--'
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

const isActive = (service: ServiceDTO): boolean =>
  !!props.activeUuid && service.uuid === props.activeUuid

const durationOf = (service: ServiceDTO): string => {
  if (service.fin) return formatDuration(service.duree || 0)
  if (isActive(service)) return formatDuration(Math.floor((props.elapsedMs || 0) / 1000))
  return '--'
}
</script>

<template>
  <div v-if="!props.services.length" class="flex flex-col items-center justify-center gap-2 py-6 text-center">
    <ClipboardList class="size-7 text-muted-foreground/70" />
    <p class="text-sm text-muted-foreground">{{ props.emptyText }}</p>
  </div>

  <ol v-else class="relative ml-1.5 border-l border-border pl-5">
    <li
      v-for="service in props.services"
      :key="service.uuid"
      class="relative py-2.5"
    >
      <!-- Point sur la frise -->
      <span
        class="absolute left-[calc(-1.25rem_-_5.5px)] top-[1.05rem] size-2.5 rounded-full ring-4 ring-card"
        :class="[
          service.isBreak ? 'bg-amber-500' : 'bg-green-500',
          isActive(service) && 'animate-pulse',
        ]"
      />

      <div class="flex items-center justify-between gap-3">
        <div class="min-w-0">
          <div class="flex items-center gap-1.5 text-sm font-medium tabular-nums text-foreground">
            <span>{{ toTime(service.debut) }}</span>
            <ArrowRight class="size-3 shrink-0 text-muted-foreground" />
            <span v-if="service.fin">{{ toTime(service.fin) }}</span>
            <span v-else class="text-xs font-normal italic text-muted-foreground">en cours</span>
          </div>
          <p class="text-xs" :class="service.isBreak ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'">
            {{ service.isBreak ? 'Pause' : 'Service' }}
          </p>
        </div>

        <span
          class="shrink-0 font-mono text-sm tabular-nums"
          :class="isActive(service) ? 'font-semibold text-green-600 dark:text-green-400' : 'text-muted-foreground'"
        >
          {{ durationOf(service) }}
        </span>
      </div>
    </li>
  </ol>
</template>
