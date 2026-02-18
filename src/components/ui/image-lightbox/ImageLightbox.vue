<template>
  <Teleport to="body">
    <Transition
      enter-active-class="duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-[100] flex items-center justify-center bg-black/95"
        @click.self="close"
      >
        <!-- Controls -->
        <div v-if="showControls" class="absolute right-4 top-4 z-10 flex gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            class="bg-black/50 text-white hover:bg-black/70 hover:text-white"
            title="Zoom arriere"
            @click.stop="zoomOut"
          >
            <ZoomOut class="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            class="bg-black/50 text-white hover:bg-black/70 hover:text-white"
            title="Zoom avant"
            @click.stop="zoomIn"
          >
            <ZoomIn class="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            class="bg-black/50 text-white hover:bg-black/70 hover:text-white"
            title="Reinitialiser le zoom"
            @click.stop="resetZoom"
          >
            <RotateCcw class="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            class="bg-black/50 text-white hover:bg-black/70 hover:text-white"
            title="Fermer"
            @click.stop="close"
          >
            <X class="size-4" />
          </Button>
        </div>

        <!-- Image -->
        <div
          class="flex max-h-[90vh] max-w-[90vw] items-center justify-center"
          @click.stop
          @wheel.prevent="handleWheel"
        >
          <img
            :src="src"
            :alt="alt"
            class="max-h-[90vh] max-w-full select-none object-contain transition-transform duration-200"
            :style="{ transform: `scale(${zoomLevel})` }"
            draggable="false"
          />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { Button } from '@/components/ui/button'
import { ZoomIn, ZoomOut, RotateCcw, X } from 'lucide-vue-next'

interface Props {
  src: string
  alt?: string
  open: boolean
  showControls?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  alt: '',
  showControls: true,
})

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
}>()

const zoomLevel = ref(1)

const close = () => {
  emit('update:open', false)
}

const zoomIn = () => {
  zoomLevel.value = Math.min(zoomLevel.value + 0.25, 5)
}

const zoomOut = () => {
  zoomLevel.value = Math.max(zoomLevel.value - 0.25, 0.5)
}

const resetZoom = () => {
  zoomLevel.value = 1
}

const handleWheel = (event: WheelEvent) => {
  if (event.deltaY < 0) {
    zoomIn()
  } else {
    zoomOut()
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && props.open) {
    close()
  }
}

watch(() => props.open, (isOpen) => {
  if (!isOpen) {
    resetZoom()
  }
})

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>
