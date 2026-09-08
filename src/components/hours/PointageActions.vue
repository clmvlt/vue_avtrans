<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Play, Pause, Square, LoaderCircle } from 'lucide-vue-next'

export type PointageStatus = 'off' | 'working' | 'break'

const props = withDefaults(defineProps<{
  status: PointageStatus
  loading?: boolean
  /** `row` : boutons côte à côte (barre mobile). `column` : empilés (carte PC). */
  layout?: 'row' | 'column'
}>(), {
  loading: false,
  layout: 'column',
})

const emit = defineEmits<{
  start: []
  pause: []
  resume: []
  end: []
}>()
</script>

<template>
  <div :class="props.layout === 'row' ? 'flex gap-2' : 'flex flex-col gap-3'">
    <!-- Hors service -->
    <Button
      v-if="props.status === 'off'"
      class="h-14 flex-1 rounded-xl bg-green-600 text-base font-semibold text-white shadow-sm hover:bg-green-700"
      :disabled="props.loading"
      @click="emit('start')"
    >
      <LoaderCircle v-if="props.loading" class="size-5 animate-spin" />
      <Play v-else class="size-5" />
      Démarrer le service
    </Button>

    <!-- En service -->
    <template v-else-if="props.status === 'working'">
      <Button
        variant="outline"
        class="h-14 flex-1 rounded-xl border-amber-500/60 bg-amber-500/5 text-base font-semibold text-amber-700 hover:bg-amber-500/15 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300"
        :disabled="props.loading"
        @click="emit('pause')"
      >
        <LoaderCircle v-if="props.loading" class="size-5 animate-spin" />
        <Pause v-else class="size-5" />
        {{ props.layout === 'row' ? 'Pause' : 'Commencer une pause' }}
      </Button>
      <Button
        class="h-14 flex-1 rounded-xl bg-rose-600 text-base font-semibold text-white shadow-sm hover:bg-rose-700"
        :disabled="props.loading"
        @click="emit('end')"
      >
        <LoaderCircle v-if="props.loading" class="size-5 animate-spin" />
        <Square v-else class="size-5" />
        {{ props.layout === 'row' ? 'Terminer' : 'Terminer le service' }}
      </Button>
    </template>

    <!-- En pause -->
    <Button
      v-else
      class="h-14 flex-1 rounded-xl bg-green-600 text-base font-semibold text-white shadow-sm hover:bg-green-700"
      :disabled="props.loading"
      @click="emit('resume')"
    >
      <LoaderCircle v-if="props.loading" class="size-5 animate-spin" />
      <Play v-else class="size-5" />
      Reprendre le service
    </Button>
  </div>
</template>
