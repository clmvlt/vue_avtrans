<template>
  <FileCard
    :file="file"
    :deletable="isMecanicien"
    @view-image="emit('view-image', $event)"
    @view-pdf="emit('view-pdf', $event)"
    @download="emit('download', $event)"
    @delete="emit('delete', $event)"
  />
</template>

<script setup lang="ts">
import type { VehiculeFileDTO } from '@/models'
import { FileCard } from '@/components/ui/file-card'

interface Props {
  file: VehiculeFileDTO
  isMecanicien: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'view-image', url: string): void
  (e: 'view-pdf', file: VehiculeFileDTO): void
  (e: 'download', file: VehiculeFileDTO): void
  (e: 'delete', fileId: string): void
}>()
</script>
