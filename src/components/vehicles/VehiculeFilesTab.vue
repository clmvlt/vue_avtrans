<template>
  <div class="space-y-4">
    <div v-if="fileUploadError" class="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
      {{ fileUploadError }}
    </div>

    <FileDropzone
      v-if="isMecanicien"
      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      :uploading="uploadingFiles"
      :upload-progress="uploadProgress"
      :upload-current-file="uploadCurrentFile"
      :upload-total-files="uploadTotalFiles"
      :upload-current-index="uploadCurrentIndex"
      :disabled="uploadingFiles"
      placeholder-title="Glissez-deposez vos fichiers ici"
      placeholder-subtitle="ou cliquez pour parcourir"
      hint="Images, PDF, Word, Excel jusqu'a 500MB"
      @files-selected="$emit('files-selected', $event)"
    />

    <div v-if="loadingFiles" class="flex flex-col items-center justify-center gap-4 py-8">
      <LoaderCircle class="size-8 animate-spin text-primary" />
      <p class="text-sm text-muted-foreground">Chargement des fichiers...</p>
    </div>

    <div v-else-if="files.length === 0 && !isMecanicien" class="flex flex-col items-center justify-center gap-4 py-16 text-muted-foreground">
      <FolderOpen class="size-12 opacity-50" />
      <p>Aucun fichier disponible</p>
    </div>

    <div v-else-if="files.length === 0 && isMecanicien" class="py-4 text-center">
      <p class="text-sm text-muted-foreground">Aucun fichier pour le moment</p>
    </div>

    <div v-else class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      <VehiculeFileCard
        v-for="file in files"
        :key="file.id"
        :file="file"
        :is-mecanicien="isMecanicien"
        @view-image="$emit('view-image', $event)"
        @view-pdf="$emit('view-pdf', $event)"
        @download="$emit('download', $event)"
        @delete="$emit('delete-file', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { VehiculeFileDTO } from '@/models'
import VehiculeFileCard from './VehiculeFileCard.vue'
import { FileDropzone } from '@/components/ui/file-dropzone'
import { LoaderCircle, FolderOpen } from 'lucide-vue-next'

interface Props {
  files: VehiculeFileDTO[]
  loadingFiles: boolean
  isMecanicien: boolean
  uploadingFiles: boolean
  fileUploadError: string
  uploadProgress: number
  uploadCurrentFile: string
  uploadTotalFiles: number
  uploadCurrentIndex: number
}

defineProps<Props>()

defineEmits<{
  (e: 'files-selected', files: FileList): void
  (e: 'view-image', url: string): void
  (e: 'view-pdf', file: VehiculeFileDTO): void
  (e: 'download', file: VehiculeFileDTO): void
  (e: 'delete-file', fileId: string): void
}>()
</script>
