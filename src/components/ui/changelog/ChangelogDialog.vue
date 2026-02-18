<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <Sparkles class="size-5 text-primary" />
          Nouveautés v{{ entry?.version }}
        </DialogTitle>
        <DialogDescription v-if="entry?.date">
          {{ formatDate(entry.date) }}
        </DialogDescription>
      </DialogHeader>

      <div v-if="entry && entry.changes.length > 0" class="space-y-3 py-2">
        <div
          v-for="(change, index) in entry.changes"
          :key="index"
          class="flex items-start gap-3"
        >
          <Badge
            :variant="getBadgeVariant(change.type)"
            :class="getBadgeClass(change.type)"
            class="mt-0.5 shrink-0"
          >
            {{ getTypeLabel(change.type) }}
          </Badge>
          <span class="text-sm text-foreground">{{ change.description }}</span>
        </div>
      </div>

      <div v-else class="py-4 text-center text-sm text-muted-foreground">
        Aucune nouveauté pour le moment.
      </div>

      <DialogFooter>
        <Button @click="handleClose">Fermer</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Sparkles } from 'lucide-vue-next'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { ChangelogEntry, ChangeType } from '@/data/changelog'

interface Props {
  open: boolean
  entry: ChangelogEntry | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'close'): void
}>()

const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value)
})

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

const getTypeLabel = (type: ChangeType): string => {
  const labels: Record<ChangeType, string> = {
    feature: 'Nouveau',
    fix: 'Correction',
    improvement: 'Amélioration'
  }
  return labels[type]
}

const getBadgeVariant = (type: ChangeType): 'default' | 'destructive' | 'outline' => {
  if (type === 'fix') return 'destructive'
  if (type === 'improvement') return 'outline'
  return 'default'
}

const getBadgeClass = (type: ChangeType): string => {
  if (type === 'improvement') {
    return 'border-green-500/50 text-green-600 dark:text-green-400'
  }
  return ''
}

const handleClose = () => {
  isOpen.value = false
  emit('close')
}
</script>
