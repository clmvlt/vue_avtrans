<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

interface Props {
  class?: HTMLAttributes['class']
}

const props = defineProps<Props>()
</script>

<template>
  <div
    data-slot="sidebar-group"
    :class="cn('relative flex w-full min-w-0 flex-col p-2', props.class)"
  >
    <slot />
  </div>
</template>
