<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

interface Props {
  class?: HTMLAttributes['class']
}

const props = defineProps<Props>()
</script>

<template>
  <li
    data-slot="sidebar-menu-item"
    :class="cn('group/menu-item relative', props.class)"
  >
    <slot />
  </li>
</template>
