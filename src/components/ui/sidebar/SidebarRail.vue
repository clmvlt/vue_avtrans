<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'
import { useSidebar } from './utils'

interface Props {
  class?: HTMLAttributes['class']
}

const props = defineProps<Props>()

const { toggleSidebar } = useSidebar()
</script>

<template>
  <button
    data-slot="sidebar-rail"
    aria-label="Toggle Sidebar"
    :tabindex="-1"
    :class="cn(
      'absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] group-data-[side=left]:left-full group-data-[side=right]:right-full md:flex',
      'hover:after:bg-sidebar-border',
      '[[data-side=left]_&]:cursor-w-resize [[data-side=right]_&]:cursor-e-resize',
      '[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize',
      'group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full group-data-[collapsible=offcanvas]:hover:bg-sidebar',
      '[[data-side=left][data-collapsible=offcanvas]_&]:-right-2 [[data-side=right][data-collapsible=offcanvas]_&]:-left-2',
      props.class,
    )"
    title="Toggle Sidebar"
    @click="toggleSidebar"
  />
</template>
