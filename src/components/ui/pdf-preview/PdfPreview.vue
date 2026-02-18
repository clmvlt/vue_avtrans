<script setup lang="ts">
import { ref, watch } from 'vue'
import { FileText, LoaderCircle } from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import type { HTMLAttributes } from 'vue'
import { generatePdfPreview, generatePdfPreviewFromUrl } from '@/composables/usePdfPreview'

interface Props {
  base64?: string
  url?: string
  width?: number
  alt?: string
  class?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<Props>(), {
  width: 200,
  alt: 'Prévisualisation PDF',
})

const loading = ref(false)
const previewUrl = ref<string | null>(null)

const generatePreview = async () => {
  loading.value = true
  previewUrl.value = null

  try {
    if (props.url) {
      previewUrl.value = await generatePdfPreviewFromUrl(props.url)
    } else if (props.base64) {
      previewUrl.value = await generatePdfPreview(props.base64)
    }
  } catch (error) {
    console.error('PDF preview generation failed:', error)
  } finally {
    loading.value = false
  }
}

watch([() => props.base64, () => props.url], generatePreview, { immediate: true })
</script>

<template>
  <div
    :class="cn(
      'flex items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20',
      props.class
    )"
    :style="{ width: `${width}px`, minHeight: '200px' }"
  >
    <!-- Loading state -->
    <div v-if="loading" class="flex items-center justify-center">
      <LoaderCircle class="size-6 animate-spin text-red-600 dark:text-red-400" />
    </div>

    <!-- Preview image -->
    <img
      v-else-if="previewUrl"
      :src="previewUrl"
      :alt="alt"
      class="size-full object-cover object-top"
    />

    <!-- Fallback/error state -->
    <div v-else class="flex flex-col items-center gap-2 p-4">
      <FileText class="size-12 text-red-600 dark:text-red-400" />
      <span class="text-xs font-bold uppercase tracking-wide text-red-600 dark:text-red-400">
        PDF
      </span>
    </div>
  </div>
</template>
