<template>
  <div class="group relative overflow-hidden rounded-lg border bg-card transition-colors hover:border-primary/50 hover:shadow-md">
    <div class="relative aspect-square cursor-pointer" @click="handleClick">
      <template v-if="fileIsImage">
        <img :src="fileUrl" :alt="file.originalName" class="size-full object-cover" />
        <div class="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
          <ZoomIn class="size-8 text-white" />
        </div>
      </template>

      <template v-else-if="fileIsPdf">
        <PdfPreview
          :base64="file.fileB64 || ''"
          :url="!file.fileB64 ? file.fileUrl : ''"
          :width="250"
          :alt="file.originalName"
        />
        <div class="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
          <ZoomIn class="size-8 text-white" />
        </div>
      </template>

      <template v-else-if="fileIsWord">
        <div class="flex size-full items-center justify-center bg-violet-600">
          <FileText class="size-16 text-white" />
        </div>
        <div class="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
          <Download class="size-8 text-white" />
        </div>
      </template>

      <template v-else-if="fileIsExcel">
        <div class="flex size-full items-center justify-center bg-green-600">
          <FileSpreadsheet class="size-16 text-white" />
        </div>
        <div class="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
          <Download class="size-8 text-white" />
        </div>
      </template>

      <template v-else>
        <div class="flex size-full items-center justify-center bg-muted">
          <File class="size-16 text-muted-foreground" />
        </div>
        <div class="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
          <Download class="size-8 text-white" />
        </div>
      </template>
    </div>

    <div v-if="showInfo" class="space-y-1 border-t bg-card p-2">
      <p class="truncate text-xs font-medium text-foreground" :title="file.originalName">
        {{ file.originalName }}
      </p>
      <p class="text-xs text-muted-foreground">{{ formattedSize }}</p>
    </div>

    <button
      v-if="deletable && file.id"
      type="button"
      class="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-destructive text-white opacity-0 transition-all hover:scale-110 group-hover:opacity-100"
      title="Supprimer"
      @click.stop="emit('delete', file.id!)"
    >
      <Trash2 class="size-3.5" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { FileData } from '@/types/file'
import { getFileUrl, formatFileSize, isImage, isPdf, isWord, isExcel } from '@/utils/fileUtils'
import { PdfPreview } from '@/components/ui/pdf-preview'
import { ZoomIn, Download, Trash2, FileText, FileSpreadsheet, File } from 'lucide-vue-next'

interface Props {
  file: FileData
  deletable?: boolean
  showInfo?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  deletable: false,
  showInfo: true,
})

const emit = defineEmits<{
  (e: 'view-image', url: string): void
  (e: 'view-pdf', file: FileData): void
  (e: 'download', file: FileData): void
  (e: 'delete', fileId: string): void
}>()

const fileIsImage = computed(() => isImage(props.file))
const fileIsPdf = computed(() => isPdf(props.file))
const fileIsWord = computed(() => isWord(props.file))
const fileIsExcel = computed(() => isExcel(props.file))
const fileUrl = computed(() => getFileUrl(props.file))
const formattedSize = computed(() => formatFileSize(props.file.fileSize))

const handleClick = () => {
  if (fileIsImage.value) {
    emit('view-image', fileUrl.value)
  } else if (fileIsPdf.value) {
    emit('view-pdf', props.file)
  } else {
    emit('download', props.file)
  }
}
</script>
