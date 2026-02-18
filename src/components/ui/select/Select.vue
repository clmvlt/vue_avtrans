<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { cn } from '@/lib/utils'
import { ChevronDown, Search, X, Check } from 'lucide-vue-next'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface Props {
  modelValue?: string
  label?: string
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
  required?: boolean
  error?: string
  hint?: string
  searchable?: boolean
  searchPlaceholder?: string
  noResultsText?: string
  clearable?: boolean
  class?: string
  id?: string
  /** Set to false to disable teleport (useful inside dialogs) */
  teleport?: boolean | string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '',
  disabled: false,
  required: false,
  searchable: true,
  searchPlaceholder: 'Rechercher...',
  noResultsText: 'Aucun résultat',
  clearable: false,
  teleport: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

// DOM refs
const wrapperRef = ref<HTMLElement | null>(null)
const triggerRef = ref<HTMLButtonElement | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)
const searchInputRef = ref<HTMLInputElement | null>(null)
const optionsRef = ref<HTMLElement | null>(null)

// State
const isOpen = ref(false)
const searchQuery = ref('')
const highlightedIndex = ref(-1)
const dropdownPosition = ref({ top: 0, left: 0, width: 0, openAbove: false })

// Unique IDs for accessibility
const uniqueId = Math.random().toString(36).substring(2, 9)
const triggerId = props.id || `select-trigger-${uniqueId}`
const labelId = `select-label-${uniqueId}`
const listboxId = `select-listbox-${uniqueId}`

// Filtered options
const filteredOptions = computed(() => {
  if (!props.searchable || !searchQuery.value.trim()) {
    return props.options
  }
  const query = searchQuery.value.toLowerCase().trim()
  return props.options.filter(option =>
    option.label.toLowerCase().includes(query)
  )
})

// Selected label
const selectedLabel = computed(() => {
  const selected = props.options.find(opt => opt.value === props.modelValue)
  return selected?.label ?? ''
})

// Dropdown style (position)
const dropdownStyle = computed(() => {
  // When teleport is disabled, use absolute positioning relative to parent
  if (props.teleport === false) {
    return {
      position: 'absolute' as const,
      top: '100%',
      left: '0',
      right: '0',
      marginTop: '4px',
      zIndex: 50,
      pointerEvents: 'auto' as const,
    }
  }
  // When teleported, use fixed positioning with calculated coordinates
  return {
    position: 'fixed' as const,
    top: dropdownPosition.value.openAbove ? 'auto' : `${dropdownPosition.value.top}px`,
    bottom: dropdownPosition.value.openAbove ? `${window.innerHeight - dropdownPosition.value.top + 8}px` : 'auto',
    left: `${dropdownPosition.value.left}px`,
    width: `${dropdownPosition.value.width}px`,
    zIndex: 9999,
    pointerEvents: 'auto' as const,
  }
})

// Calculate dropdown position
const calculateDropdownPosition = () => {
  if (!triggerRef.value) return

  const rect = triggerRef.value.getBoundingClientRect()
  const spaceBelow = window.innerHeight - rect.bottom
  const spaceAbove = rect.top
  const dropdownHeight = 300

  const openAbove = spaceBelow < dropdownHeight && spaceAbove > spaceBelow

  dropdownPosition.value = {
    top: openAbove ? rect.top : rect.bottom + 4,
    left: rect.left,
    width: rect.width,
    openAbove,
  }
}

// Open dropdown
const openDropdown = () => {
  if (props.disabled) return

  calculateDropdownPosition()
  isOpen.value = true
  highlightedIndex.value = -1

  nextTick(() => {
    if (props.searchable && searchInputRef.value) {
      searchInputRef.value.focus()
    }
  })
}

// Close dropdown
const closeDropdown = () => {
  isOpen.value = false
  searchQuery.value = ''
  highlightedIndex.value = -1

  nextTick(() => {
    triggerRef.value?.focus()
  })
}

// Toggle dropdown
const toggleDropdown = () => {
  if (isOpen.value) {
    closeDropdown()
  } else {
    openDropdown()
  }
}

// Select an option
const selectOption = (option: SelectOption) => {
  if (option.disabled) return
  emit('update:modelValue', option.value)
  closeDropdown()
}

// Clear selection
const clearSelection = () => {
  emit('update:modelValue', '')
  closeDropdown()
}

// Clear search
const clearSearch = () => {
  searchQuery.value = ''
  highlightedIndex.value = -1
  searchInputRef.value?.focus()
}

// Handle search input
const handleSearchInput = () => {
  highlightedIndex.value = filteredOptions.value.length > 0 ? 0 : -1
}

// Scroll to highlighted option
const scrollToHighlighted = () => {
  if (highlightedIndex.value < 0 || !optionsRef.value) return
  const optionElements = optionsRef.value.querySelectorAll('[role="option"]')
  const highlightedElement = optionElements[highlightedIndex.value] as HTMLElement
  if (highlightedElement) {
    highlightedElement.scrollIntoView({ block: 'nearest' })
  }
}

// Keyboard navigation on trigger
const handleTriggerKeydown = (event: KeyboardEvent) => {
  switch (event.key) {
    case 'Enter':
    case ' ':
    case 'ArrowDown':
    case 'ArrowUp':
      event.preventDefault()
      if (!isOpen.value) {
        openDropdown()
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          nextTick(() => {
            highlightedIndex.value = 0
          })
        }
      }
      break
    case 'Escape':
      if (isOpen.value) {
        event.preventDefault()
        closeDropdown()
      }
      break
  }
}

// Keyboard navigation in dropdown
const handleDropdownKeydown = (event: KeyboardEvent) => {
  const optionsCount = filteredOptions.value.length

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      if (optionsCount > 0) {
        highlightedIndex.value = (highlightedIndex.value + 1) % optionsCount
        scrollToHighlighted()
      }
      break
    case 'ArrowUp':
      event.preventDefault()
      if (optionsCount > 0) {
        highlightedIndex.value = highlightedIndex.value <= 0
          ? optionsCount - 1
          : highlightedIndex.value - 1
        scrollToHighlighted()
      }
      break
    case 'Enter':
      event.preventDefault()
      if (highlightedIndex.value >= 0 && highlightedIndex.value < optionsCount) {
        const option = filteredOptions.value[highlightedIndex.value]
        if (option && !option.disabled) {
          selectOption(option)
        }
      }
      break
    case 'Escape':
      event.preventDefault()
      closeDropdown()
      break
    case 'Tab':
      closeDropdown()
      break
    case 'Home':
      event.preventDefault()
      if (optionsCount > 0) {
        highlightedIndex.value = 0
        scrollToHighlighted()
      }
      break
    case 'End':
      event.preventDefault()
      if (optionsCount > 0) {
        highlightedIndex.value = optionsCount - 1
        scrollToHighlighted()
      }
      break
  }
}

// Click outside
const handleClickOutside = (event: MouseEvent) => {
  if (!isOpen.value) return
  const target = event.target as Node
  const isOutsideWrapper = wrapperRef.value && !wrapperRef.value.contains(target)
  const isOutsideDropdown = dropdownRef.value && !dropdownRef.value.contains(target)
  if (isOutsideWrapper && isOutsideDropdown) {
    closeDropdown()
  }
}

// Handle resize / scroll
const handleResize = () => {
  if (isOpen.value) calculateDropdownPosition()
}
const handleScroll = () => {
  if (isOpen.value) calculateDropdownPosition()
}

// Lifecycle
onMounted(() => {
  document.addEventListener('click', handleClickOutside, true)
  window.addEventListener('resize', handleResize)
  window.addEventListener('scroll', handleScroll, true)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside, true)
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('scroll', handleScroll, true)
})

// Reset search when options change
watch(() => props.options, () => {
  searchQuery.value = ''
  highlightedIndex.value = -1
})
</script>

<template>
  <div ref="wrapperRef" :class="cn('relative w-full', props.class)">
    <label
      v-if="label"
      :id="labelId"
      :for="triggerId"
      class="mb-2 block text-sm font-medium text-foreground"
    >
      {{ label }}
      <span v-if="required" class="ml-1 text-destructive">*</span>
    </label>

    <button
      ref="triggerRef"
      :id="triggerId"
      type="button"
      role="combobox"
      :aria-expanded="isOpen"
      :aria-haspopup="'listbox'"
      :aria-controls="listboxId"
      :aria-labelledby="label ? labelId : undefined"
      :aria-activedescendant="highlightedIndex >= 0 ? `${listboxId}-option-${highlightedIndex}` : undefined"
      :disabled="disabled"
      :class="cn(
        'flex h-9 w-full cursor-pointer items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors',
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none',
        'disabled:cursor-not-allowed disabled:opacity-50',
        isOpen && 'border-ring ring-ring/50 ring-[3px]',
        error && 'border-destructive',
        !modelValue && 'text-muted-foreground',
      )"
      @click="toggleDropdown"
      @keydown="handleTriggerKeydown"
    >
      <span class="flex-1 truncate text-left">
        {{ selectedLabel || placeholder || 'Sélectionner...' }}
      </span>
      <ChevronDown
        :class="cn(
          'size-4 shrink-0 text-muted-foreground transition-transform',
          isOpen && 'rotate-180 text-foreground',
        )"
      />
    </button>

    <p v-if="error" class="mt-2 flex items-center gap-1.5 text-sm text-destructive">
      {{ error }}
    </p>
    <p v-else-if="hint" class="mt-2 text-sm text-muted-foreground">
      {{ hint }}
    </p>

    <!-- Dropdown (teleported by default, can be disabled for use inside dialogs) -->
    <Teleport :to="teleport === true ? 'body' : (teleport || 'body')" :disabled="teleport === false">
      <Transition
        enter-active-class="transition duration-150 ease-out"
        enter-from-class="opacity-0 scale-95"
        enter-to-class="opacity-100 scale-100"
        leave-active-class="transition duration-100 ease-in"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95"
      >
        <div
          v-if="isOpen"
          ref="dropdownRef"
          :id="listboxId"
          data-floating-content
          class="overflow-hidden rounded-md border bg-popover shadow-lg"
          :style="dropdownStyle"
          @keydown="handleDropdownKeydown"
          @pointerdown.stop
        >
          <!-- Search bar -->
          <div v-if="searchable" class="border-b p-2">
            <div class="relative">
              <Search class="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                ref="searchInputRef"
                v-model="searchQuery"
                type="text"
                role="searchbox"
                :placeholder="searchPlaceholder"
                :aria-label="searchPlaceholder"
                aria-autocomplete="list"
                class="h-8 w-full rounded-sm border border-input bg-transparent pl-8 pr-8 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                @input="handleSearchInput"
              />
              <button
                v-if="searchQuery"
                type="button"
                class="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Effacer la recherche"
                @click="clearSearch"
              >
                <X class="size-3.5" />
              </button>
            </div>
          </div>

          <!-- Options list -->
          <ul
            ref="optionsRef"
            role="listbox"
            :aria-label="label"
            class="max-h-60 overflow-y-auto py-1"
          >
            <!-- Empty state -->
            <li v-if="filteredOptions.length === 0" class="px-3 py-6 text-center text-sm text-muted-foreground">
              {{ noResultsText }}
            </li>

            <!-- Options -->
            <li
              v-for="(option, index) in filteredOptions"
              :key="option.value"
              :id="`${listboxId}-option-${index}`"
              role="option"
              :aria-selected="option.value === modelValue"
              :aria-disabled="option.disabled"
              :class="cn(
                'flex cursor-pointer items-center gap-2 px-3 py-2 text-sm transition-colors',
                index === highlightedIndex && 'bg-accent text-accent-foreground',
                option.value === modelValue && 'font-medium',
                option.disabled && 'cursor-not-allowed opacity-50',
              )"
              @click="selectOption(option)"
              @mouseenter="highlightedIndex = index"
            >
              <Check
                :class="cn(
                  'size-3.5 shrink-0',
                  option.value === modelValue ? 'opacity-100' : 'opacity-0',
                )"
              />
              <span class="flex-1 truncate">{{ option.label }}</span>
            </li>
          </ul>

          <!-- Clear button (if clearable) -->
          <div v-if="clearable && modelValue" class="border-t p-1.5">
            <button
              type="button"
              class="flex w-full items-center justify-center gap-2 rounded-sm px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-destructive"
              @click="clearSelection"
            >
              <X class="size-3.5" />
              Effacer la sélection
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
