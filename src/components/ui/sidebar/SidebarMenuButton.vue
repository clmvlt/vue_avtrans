<script setup lang="ts">
import type { PrimitiveProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { computed } from 'vue'
import { Primitive } from 'reka-ui'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useSidebar } from './utils'

interface Props extends PrimitiveProps {
  class?: HTMLAttributes['class']
  isActive?: boolean
  tooltip?: string
  size?: 'sm' | 'default' | 'lg'
  variant?: 'default' | 'outline'
}

const props = withDefaults(defineProps<Props>(), {
  as: 'button',
  isActive: false,
  size: 'default',
  variant: 'default',
})

const { isMobile, state } = useSidebar()

const showTooltip = computed(() => {
  return state.value === 'collapsed' && props.tooltip && !isMobile.value
})

const buttonClass = computed(() => cn(
  'peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-slot=sidebar-menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground data-[active=true]:font-medium [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0',
  props.size === 'sm' && 'h-7 text-xs',
  props.size === 'default' && 'h-8 text-sm',
  props.size === 'lg' && 'h-12 text-sm group-data-[collapsible=icon]:!p-0',
  'group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 [&>span:last-child]:group-data-[collapsible=icon]:hidden',
  props.variant === 'outline' && 'bg-background shadow-[0_0_0_1px_hsl(var(--sidebar-border))] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_hsl(var(--sidebar-accent))]',
  props.class,
))
</script>

<template>
  <Tooltip v-if="showTooltip">
    <TooltipTrigger as-child>
      <Primitive
        data-slot="sidebar-menu-button"
        :as="as"
        :as-child="asChild"
        :data-size="size"
        :data-active="isActive"
        :class="buttonClass"
      >
        <slot />
      </Primitive>
    </TooltipTrigger>
    <TooltipContent side="left" :side-offset="8">
      {{ tooltip }}
    </TooltipContent>
  </Tooltip>
  <Primitive
    v-else
    data-slot="sidebar-menu-button"
    :as="as"
    :as-child="asChild"
    :data-size="size"
    :data-active="isActive"
    :class="buttonClass"
  >
    <slot />
  </Primitive>
</template>
