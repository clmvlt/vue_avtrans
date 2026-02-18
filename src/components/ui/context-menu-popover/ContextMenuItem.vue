<template>
  <button
    :class="[
      'flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors',
      'hover:bg-accent hover:text-accent-foreground',
      'focus:bg-accent focus:text-accent-foreground focus:outline-none',
      disabled && 'pointer-events-none opacity-50',
      destructive && 'text-destructive hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10',
    ]"
    :disabled="disabled"
    @click="$emit('click')"
  >
    <slot name="icon" />
    <slot />
  </button>
</template>

<script setup lang="ts">
defineProps<{
  disabled?: boolean
  destructive?: boolean
}>()

defineEmits<{
  (e: 'click'): void
}>()
</script>
