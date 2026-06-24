<template>
  <div class="flex flex-col gap-2">
    <div
      ref="containerRef"
      class="relative overflow-hidden rounded-lg border-2 border-dashed border-border bg-white"
    >
      <canvas
        ref="canvasRef"
        class="block h-44 w-full touch-none"
        @pointerdown="handlePointerDown"
        @pointermove="handlePointerMove"
        @pointerup="handlePointerUp"
        @pointerleave="handlePointerUp"
        @pointercancel="handlePointerUp"
      ></canvas>

      <!-- Placeholder tant que rien n'est dessiné -->
      <div
        v-if="isEmpty"
        class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1 text-muted-foreground"
      >
        <PenLine class="size-6 opacity-50" />
        <span class="text-sm">Signez ici avec votre doigt ou la souris</span>
      </div>
    </div>

    <button
      type="button"
      class="self-end text-xs font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
      :disabled="isEmpty || disabled"
      @click="clear"
    >
      Effacer
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { PenLine } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  disabled?: boolean
  strokeColor?: string
  lineWidth?: number
}>(), {
  disabled: false,
  strokeColor: '#111827',
  lineWidth: 2.5,
})

const containerRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const isEmpty = ref(true)

let ctx: CanvasRenderingContext2D | null = null
let drawing = false
let lastX = 0
let lastY = 0
let resizeObserver: ResizeObserver | null = null

// Adapte la taille interne du canvas à sa taille CSS (gestion du ratio de pixels).
// Préserve le tracé existant lors d'un redimensionnement.
const resizeCanvas = () => {
  const canvas = canvasRef.value
  const container = containerRef.value
  if (!canvas || !container) return

  const dpr = window.devicePixelRatio || 1
  const { width, height } = container.getBoundingClientRect()
  if (width === 0 || height === 0) return

  // Sauvegarder le tracé courant (si présent) pour le restaurer après resize
  const previous = isEmpty.value ? null : canvas.toDataURL('image/png')

  canvas.width = Math.round(width * dpr)
  canvas.height = Math.round(height * dpr)

  ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.scale(dpr, dpr)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = props.strokeColor
  ctx.lineWidth = props.lineWidth

  if (previous) {
    const img = new Image()
    img.onload = () => {
      ctx?.drawImage(img, 0, 0, width, height)
    }
    img.src = previous
  }
}

const getPoint = (event: PointerEvent): { x: number; y: number } => {
  const canvas = canvasRef.value!
  const rect = canvas.getBoundingClientRect()
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  }
}

const handlePointerDown = (event: PointerEvent) => {
  if (props.disabled || !ctx) return
  drawing = true
  const { x, y } = getPoint(event)
  lastX = x
  lastY = y
  // Point initial (pour permettre un simple "tap")
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x + 0.01, y + 0.01)
  ctx.stroke()
  isEmpty.value = false
  canvasRef.value?.setPointerCapture(event.pointerId)
}

const handlePointerMove = (event: PointerEvent) => {
  if (!drawing || props.disabled || !ctx) return
  const { x, y } = getPoint(event)
  ctx.beginPath()
  ctx.moveTo(lastX, lastY)
  ctx.lineTo(x, y)
  ctx.stroke()
  lastX = x
  lastY = y
}

const handlePointerUp = (event: PointerEvent) => {
  if (!drawing) return
  drawing = false
  try {
    canvasRef.value?.releasePointerCapture(event.pointerId)
  } catch {
    // pointer déjà relâché — ignorer
  }
}

const clear = () => {
  const canvas = canvasRef.value
  if (!canvas || !ctx) return
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  isEmpty.value = true
}

// Exporte la signature en PNG base64 sur fond blanc (pour un rendu lisible
// quel que soit le thème d'affichage). Retourne null si rien n'est dessiné.
const toDataURL = (): string | null => {
  const canvas = canvasRef.value
  if (!canvas || isEmpty.value) return null

  // Composer sur un fond blanc opaque
  const exportCanvas = document.createElement('canvas')
  exportCanvas.width = canvas.width
  exportCanvas.height = canvas.height
  const exportCtx = exportCanvas.getContext('2d')
  if (!exportCtx) return canvas.toDataURL('image/png')
  exportCtx.fillStyle = '#ffffff'
  exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height)
  exportCtx.drawImage(canvas, 0, 0)
  return exportCanvas.toDataURL('image/png')
}

onMounted(() => {
  resizeCanvas()
  resizeObserver = new ResizeObserver(() => resizeCanvas())
  if (containerRef.value) resizeObserver.observe(containerRef.value)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
})

defineExpose({
  clear,
  toDataURL,
  isEmpty,
})
</script>
