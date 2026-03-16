<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { PanelRight } from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useSidebar } from './utils'

interface Props {
  class?: HTMLAttributes['class']
}

const props = defineProps<Props>()

const { toggleSidebar } = useSidebar()
</script>

<template>
  <Button
    data-slot="sidebar-trigger"
    variant="ghost"
    size="icon"
    :class="cn('size-7', props.class)"
    @click="toggleSidebar"
  >
    <PanelRight class="size-4" />
    <span class="sr-only">Toggle Sidebar</span>
  </Button>
</template>
