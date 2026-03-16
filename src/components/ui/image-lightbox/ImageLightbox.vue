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
        ref="overlayRef"
        class="fixed inset-0 z-[200] flex items-center justify-center bg-black/95"
        @click.self="close"
      >
        <!-- Top controls -->
        <div class="absolute right-4 top-4 z-10 flex items-center gap-2">
          <div
            v-if="allImages.length > 1"
            class="flex items-center rounded-full bg-black/50 px-3 py-1.5 text-sm font-medium text-white"
          >
            {{ currentIndex + 1 }} / {{ allImages.length }}
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            class="bg-black/50 text-white hover:bg-black/70 hover:text-white"
            title="Telecharger"
            @click.stop="download"
          >
            <Download class="size-4" />
          </Button>
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

        <!-- Navigation: previous -->
        <button
          v-if="allImages.length > 1 && currentIndex > 0"
          class="absolute left-3 top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
          @click.stop="prev"
        >
          <ChevronLeft class="size-6" />
        </button>

        <!-- Navigation: next -->
        <button
          v-if="allImages.length > 1 && currentIndex < allImages.length - 1"
          class="absolute right-3 top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
          @click.stop="next"
        >
          <ChevronRight class="size-6" />
        </button>

        <!-- Image -->
        <div
          class="flex max-h-[90vh] max-w-[90vw] items-center justify-center"
          @click.stop
          @wheel.prevent="handleWheel"
          @touchstart.passive="onTouchStart"
          @touchmove.passive="onTouchMove"
          @touchend="onTouchEnd"
        >
          <img
            :src="currentSrc"
            :alt="alt"
            class="max-h-[90vh] max-w-full select-none object-contain"
            :class="{ 'transition-transform duration-200': !isSwiping }"
            :style="imageStyle"
            draggable="false"
          />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { Button } from '@/components/ui/button'
import {
  ZoomIn, ZoomOut, RotateCcw, X, Download,
  ChevronLeft, ChevronRight
} from 'lucide-vue-next'

interface Props {
  open: boolean
  /** Single image URL (backwards-compatible) */
  src?: string
  /** Array of image URLs for gallery mode */
  images?: string[]
  /** Starting index when opening in gallery mode */
  initialIndex?: number
  alt?: string
}

const props = withDefaults(defineProps<Props>(), {
  src: '',
  images: () => [],
  initialIndex: 0,
  alt: '',
})

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
}>()

const overlayRef = ref<HTMLDivElement>()
const zoomLevel = ref(1)
const currentIndex = ref(0)

// Touch / swipe state
const isSwiping = ref(false)
const touchStartX = ref(0)
const touchStartY = ref(0)
const swipeDeltaX = ref(0)
const swipeDeltaY = ref(0)

/** Merged image list: use `images` prop if provided, otherwise wrap `src` */
const allImages = computed(() => {
  if (props.images.length > 0) return props.images
  if (props.src) return [props.src]
  return []
})

const currentSrc = computed(() => allImages.value[currentIndex.value] ?? '')

const imageStyle = computed(() => {
  const transforms: string[] = []
  transforms.push(`scale(${zoomLevel.value})`)
  if (isSwiping.value) {
    transforms.push(`translateX(${swipeDeltaX.value}px)`)
    transforms.push(`translateY(${swipeDeltaY.value}px)`)
  }
  return { transform: transforms.join(' ') }
})

const close = () => {
  emit('update:open', false)
}

const prev = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--
    resetZoom()
  }
}

const next = () => {
  if (currentIndex.value < allImages.value.length - 1) {
    currentIndex.value++
    resetZoom()
  }
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
  if (event.deltaY < 0) zoomIn()
  else zoomOut()
}

// --- Touch / Swipe ---
const onTouchStart = (e: TouchEvent) => {
  if (zoomLevel.value !== 1) return // disable swipe when zoomed
  const touch = e.touches[0]
  if (!touch) return
  touchStartX.value = touch.clientX
  touchStartY.value = touch.clientY
  swipeDeltaX.value = 0
  swipeDeltaY.value = 0
  isSwiping.value = true
}

const onTouchMove = (e: TouchEvent) => {
  if (!isSwiping.value) return
  const touch = e.touches[0]
  if (!touch) return
  swipeDeltaX.value = touch.clientX - touchStartX.value
  swipeDeltaY.value = touch.clientY - touchStartY.value
}

const onTouchEnd = () => {
  if (!isSwiping.value) return
  isSwiping.value = false

  const absX = Math.abs(swipeDeltaX.value)
  const absY = Math.abs(swipeDeltaY.value)

  // Horizontal swipe (navigate)
  if (absX > 50 && absX > absY) {
    if (swipeDeltaX.value < 0) next()
    else prev()
  }
  // Vertical swipe down (close)
  else if (swipeDeltaY.value > 100 && absY > absX) {
    close()
  }

  swipeDeltaX.value = 0
  swipeDeltaY.value = 0
}

// --- Keyboard (capture phase to block Dialog escape) ---
const handleKeydown = (event: KeyboardEvent) => {
  if (!props.open) return

  if (event.key === 'Escape') {
    event.stopImmediatePropagation()
    event.preventDefault()
    close()
  } else if (event.key === 'ArrowLeft') {
    event.stopPropagation()
    prev()
  } else if (event.key === 'ArrowRight') {
    event.stopPropagation()
    next()
  }
}

// --- Download ---
const download = async () => {
  const url = currentSrc.value
  if (!url) return

  try {
    const response = await fetch(url)
    const blob = await response.blob()
    const ext = blob.type.split('/')[1] || 'jpg'
    const blobUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = `photo-${currentIndex.value + 1}.${ext}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(blobUrl)
  } catch {
    // Fallback: open in new tab
    window.open(url, '_blank')
  }
}

// --- Lifecycle ---
watch(() => props.open, (isOpen) => {
  if (isOpen) {
    currentIndex.value = props.initialIndex
    resetZoom()
  }
})

onMounted(() => {
  // capture: true ensures we intercept before Dialog's escape handler
  document.addEventListener('keydown', handleKeydown, true)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown, true)
})
</script>
