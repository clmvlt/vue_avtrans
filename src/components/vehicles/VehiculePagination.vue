<template>
  <div v-if="totalPages > 1" class="flex items-center justify-center gap-2 py-4">
    <Button
      variant="ghost"
      size="sm"
      :disabled="page === 0"
      @click="$emit('update:page', page - 1)"
    >
      <ChevronLeft class="size-4" />
    </Button>
    <span class="text-sm text-muted-foreground">
      Page {{ page + 1 }} / {{ totalPages }}
    </span>
    <Button
      variant="ghost"
      size="sm"
      :disabled="page >= totalPages - 1"
      @click="$emit('update:page', page + 1)"
    >
      <ChevronRight class="size-4" />
    </Button>
  </div>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

interface Props {
  page: number
  totalPages: number
}

defineProps<Props>()

defineEmits<{
  (e: 'update:page', page: number): void
}>()
</script>
