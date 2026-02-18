<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="show"
        ref="menuElement"
        class="fixed z-50 min-w-[12rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
        :style="{ top: y + 'px', left: x + 'px' }"
        @click.stop
      >
        <div v-if="$slots.header || title" class="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
          <slot name="header">{{ title }}</slot>
        </div>
        <div v-if="$slots.header || title" class="-mx-1 my-1 h-px bg-border" />
        <slot />
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface Props {
  show: boolean
  x: number
  y: number
  title?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'close'): void
}>()

const menuElement = ref<HTMLElement | null>(null)

const handleClickOutside = (event: MouseEvent) => {
  if (props.show && menuElement.value && !menuElement.value.contains(event.target as Node)) {
    emit('close')
  }
}

defineExpose({ menuElement })

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
