<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { useSidebar, SIDEBAR_WIDTH } from './utils'

interface Props {
  side?: 'left' | 'right'
  variant?: 'sidebar' | 'floating' | 'inset'
  collapsible?: 'offcanvas' | 'icon' | 'none'
  class?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<Props>(), {
  side: 'right',
  variant: 'sidebar',
  collapsible: 'icon',
})

const { isMobile, state, openMobile, setOpenMobile } = useSidebar()
</script>

<template>
  <div
    v-if="collapsible === 'none'"
    data-slot="sidebar"
    :class="cn(
      'flex h-full w-[--sidebar-width] flex-col bg-sidebar text-sidebar-foreground',
      props.class,
    )"
  >
    <slot />
  </div>

  <template v-else>
    <!-- Mobile: Sheet overlay -->
    <Sheet v-if="isMobile" :open="openMobile" @update:open="setOpenMobile">
      <SheetContent
        data-slot="sidebar"
        data-mobile="true"
        :side="side"
        class="w-[--sidebar-width] bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden"
        :style="{ '--sidebar-width': SIDEBAR_WIDTH }"
      >
        <div class="flex h-full w-full flex-col">
          <slot />
        </div>
      </SheetContent>
    </Sheet>

    <!-- Desktop: fixed sidebar -->
    <div
      v-else
      class="group peer hidden md:block text-sidebar-foreground"
      :data-state="state"
      :data-collapsible="state === 'collapsed' ? collapsible : ''"
      :data-variant="variant"
      :data-side="side"
    >
      <!-- Gap element that takes space in the layout flow -->
      <div
        :class="cn(
          'relative w-[--sidebar-width] bg-transparent transition-[width] duration-200 ease-linear',
          'group-data-[collapsible=offcanvas]:w-0',
          'group-data-[side=right]:rotate-180',
          variant === 'floating' || variant === 'inset'
            ? 'group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4))]'
            : 'group-data-[collapsible=icon]:w-[--sidebar-width-icon]',
        )"
      />
      <!-- Actual sidebar container -->
      <div
        :class="cn(
          'fixed inset-y-0 z-10 hidden h-svh w-[--sidebar-width] transition-[left,right,width] duration-200 ease-linear md:flex',
          side === 'left'
            ? 'left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]'
            : 'right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]',
          variant === 'floating' || variant === 'inset'
            ? 'p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4)_+2px)]'
            : 'group-data-[collapsible=icon]:w-[--sidebar-width-icon]',
          props.class,
        )"
      >
        <div
          data-slot="sidebar"
          :class="cn(
            'flex h-full w-full flex-col bg-sidebar group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:border-sidebar-border group-data-[variant=floating]:shadow',
            side === 'left' ? 'border-r' : 'border-l',
          )"
        >
          <slot />
        </div>
      </div>
    </div>
  </template>
</template>
