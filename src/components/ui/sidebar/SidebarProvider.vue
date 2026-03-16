<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { computed } from 'vue'
import { TooltipProvider } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { provideSidebar, SIDEBAR_WIDTH, SIDEBAR_WIDTH_ICON } from './utils'

interface Props {
  defaultOpen?: boolean
  class?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<Props>(), {
  defaultOpen: true,
})

const { state, isMobile } = provideSidebar(props.defaultOpen)

const style = computed(() => ({
  '--sidebar-width': SIDEBAR_WIDTH,
  '--sidebar-width-icon': SIDEBAR_WIDTH_ICON,
}))
</script>

<template>
  <TooltipProvider :delay-duration="0">
    <div
      data-slot="sidebar-provider"
      :style="style"
      :class="cn(
        'group/sidebar-wrapper flex min-h-svh w-full has-[[data-variant=inset]]:bg-sidebar',
        props.class,
      )"
      :data-sidebar-state="state"
      :data-sidebar-mobile="isMobile ? 'true' : undefined"
    >
      <slot />
    </div>
  </TooltipProvider>
</template>
