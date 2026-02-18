<template>
  <div
    class="cursor-pointer rounded-lg border-2 border-dashed transition-colors"
    :class="{
      'border-primary bg-primary/5': isDragging,
      'border-border hover:border-primary/50': !isDragging && !uploading,
      'pointer-events-none opacity-50': disabled,
      'p-4': compact,
      'p-0': !compact
    }"
    @dragenter.prevent="handleDragEnter"
    @dragover.prevent="handleDragOver"
    @dragleave.prevent="handleDragLeave"
    @drop.prevent="handleDrop"
    @click="triggerFileInput"
  >
    <input
      ref="fileInput"
      type="file"
      :accept="accept"
      :multiple="multiple"
      class="hidden"
      @change="handleFileInputChange"
    />

    <!-- Upload progress -->
    <div v-if="uploading" :class="compact ? 'space-y-2' : 'space-y-3 p-8'">
      <div class="flex items-center justify-between">
        <span class="flex items-center gap-2 text-sm font-medium text-foreground">
          <CloudUpload class="size-5 text-primary" />
          Envoi en cours...
        </span>
        <span v-if="uploadTotalFiles > 0" class="text-sm text-muted-foreground">
          {{ uploadCurrentIndex }}/{{ uploadTotalFiles }}
        </span>
      </div>
      <div class="h-2 overflow-hidden rounded-full bg-muted">
        <div
          class="h-full bg-primary transition-all duration-300"
          :style="{ width: uploadProgress + '%' }"
        ></div>
      </div>
      <p v-if="uploadCurrentFile" class="truncate text-xs text-muted-foreground">{{ uploadCurrentFile }}</p>
    </div>

    <!-- Idle state -->
    <div v-else :class="compact ? 'flex items-center gap-3 text-center' : 'flex flex-col items-center gap-3 p-8 text-center'">
      <div
        v-if="!compact"
        class="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary"
      >
        <CloudUpload class="size-8" />
      </div>
      <CloudUpload v-else class="size-5 shrink-0 text-primary" />
      <div>
        <p class="text-sm font-medium text-foreground">
          <strong>{{ placeholderTitle }}</strong>
        </p>
        <p class="text-sm text-muted-foreground">
          {{ placeholderSubtitle }}
        </p>
      </div>
      <p v-if="hint && !compact" class="text-xs text-muted-foreground">{{ hint }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { CloudUpload } from 'lucide-vue-next'

interface Props {
  accept?: string
  multiple?: boolean
  disabled?: boolean
  uploading?: boolean
  uploadProgress?: number
  uploadCurrentFile?: string
  uploadTotalFiles?: number
  uploadCurrentIndex?: number
  placeholderTitle?: string
  placeholderSubtitle?: string
  hint?: string
  maxFileSize?: number
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  accept: 'image/*,.pdf,.doc,.docx,.xls,.xlsx',
  multiple: true,
  disabled: false,
  uploading: false,
  uploadProgress: 0,
  uploadCurrentFile: '',
  uploadTotalFiles: 0,
  uploadCurrentIndex: 0,
  placeholderTitle: 'Glissez-deposez vos fichiers ici',
  placeholderSubtitle: 'ou cliquez pour parcourir',
  hint: '',
  compact: false,
})

const emit = defineEmits<{
  (e: 'files-selected', files: FileList): void
  (e: 'error', message: string): void
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)

const handleDragEnter = () => {
  isDragging.value = true
}

const handleDragOver = () => {
  isDragging.value = true
}

const handleDragLeave = (e: DragEvent) => {
  if (e.currentTarget === e.target) {
    isDragging.value = false
  }
}

const validateFiles = (files: FileList): boolean => {
  if (props.maxFileSize) {
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (file && file.size > props.maxFileSize) {
        emit('error', `Le fichier "${file.name}" depasse la taille maximale autorisee`)
        return false
      }
    }
  }
  return true
}

const handleDrop = (e: DragEvent) => {
  isDragging.value = false
  const files = e.dataTransfer?.files
  if (files && files.length > 0) {
    if (validateFiles(files)) {
      emit('files-selected', files)
    }
  }
}

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileInputChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  const files = target.files
  if (files && files.length > 0) {
    if (validateFiles(files)) {
      emit('files-selected', files)
    }
    target.value = ''
  }
}

defineExpose({ triggerFileInput })
</script>
