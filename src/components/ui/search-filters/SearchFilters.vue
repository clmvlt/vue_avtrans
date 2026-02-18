<script setup lang="ts">
import { ref, computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Search, SlidersHorizontal, RotateCcw, LoaderCircle } from 'lucide-vue-next'

export interface FilterOption {
  value: string | number
  label: string
}

export interface FilterConfig {
  key: string
  label: string
  type: 'select' | 'date' | 'text' | 'number' | 'checkbox'
  placeholder?: string
  options?: FilterOption[]
  fullWidth?: boolean
  checkboxLabel?: string
  min?: number
  max?: number
}

interface Props {
  modelValue: Record<string, unknown>
  filters: FilterConfig[]
  loading?: boolean
  columns?: number
  defaultExpanded?: boolean
  hint?: string
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  columns: 4,
  defaultExpanded: false,
  hint: '',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: Record<string, unknown>): void
  (e: 'search'): void
  (e: 'reset'): void
}>()

const showFilters = ref(props.defaultExpanded)

const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${props.columns}, 1fr)`,
}))

const toggleFilters = () => {
  showFilters.value = !showFilters.value
}

const updateFilter = (key: string, value: unknown) => {
  emit('update:modelValue', {
    ...props.modelValue,
    [key]: value,
  })
}

const handleSearch = () => {
  emit('search')
}

const handleReset = () => {
  emit('reset')
}

defineExpose({
  toggleFilters,
  showFilters,
})
</script>

<template>
  <div class="w-full">
    <!-- Header -->
    <div class="mb-4 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
      <div class="flex items-baseline gap-2">
        <slot name="count">
          <span v-if="hint" class="text-xs italic text-muted-foreground">{{ hint }}</span>
        </slot>
      </div>
      <div class="flex items-center gap-3">
        <Button
          v-if="filters.length > 0"
          :variant="showFilters ? 'secondary' : 'outline'"
          size="sm"
          @click="toggleFilters"
        >
          <SlidersHorizontal class="size-3.5" />
          {{ showFilters ? 'Masquer les filtres' : 'Afficher les filtres' }}
        </Button>
        <Button size="sm" :disabled="loading" @click="handleSearch">
          <LoaderCircle v-if="loading" class="size-3.5 animate-spin" />
          <Search v-else class="size-3.5" />
          {{ loading ? 'Recherche...' : 'Rechercher' }}
        </Button>
      </div>
    </div>

    <!-- Filters section -->
    <Transition
      enter-active-class="transition-all duration-200 ease-out overflow-hidden"
      enter-from-class="max-h-0 opacity-0"
      enter-to-class="max-h-[500px] opacity-100"
      leave-active-class="transition-all duration-200 ease-in overflow-hidden"
      leave-from-class="max-h-[500px] opacity-100"
      leave-to-class="max-h-0 opacity-0"
    >
      <div v-if="showFilters && filters.length > 0" class="mb-6 rounded-lg border bg-card p-5">
        <div class="mb-4 grid gap-4 max-lg:!grid-cols-2 max-sm:!grid-cols-1" :style="gridStyle">
          <div
            v-for="filter in filters"
            :key="filter.key"
            class="flex flex-col gap-2"
            :class="{ 'col-span-full': filter.fullWidth }"
          >
            <label :for="`filter-${filter.key}`" class="text-sm font-medium text-muted-foreground">
              {{ filter.label }}
            </label>

            <!-- Select -->
            <Select
              v-if="filter.type === 'select'"
              :id="`filter-${filter.key}`"
              :model-value="String(modelValue[filter.key] || '')"
              :options="(filter.options || []).map(o => ({ value: String(o.value), label: o.label }))"
              :placeholder="filter.placeholder || 'Tous'"
              :searchable="(filter.options?.length || 0) > 5"
              :clearable="true"
              @update:model-value="updateFilter(filter.key, $event)"
            />

            <!-- Date -->
            <Input
              v-else-if="filter.type === 'date'"
              type="date"
              :id="`filter-${filter.key}`"
              :model-value="String(modelValue[filter.key] || '')"
              @update:model-value="updateFilter(filter.key, $event)"
            />

            <!-- Text -->
            <Input
              v-else-if="filter.type === 'text'"
              type="text"
              :id="`filter-${filter.key}`"
              :model-value="String(modelValue[filter.key] || '')"
              :placeholder="filter.placeholder"
              @update:model-value="updateFilter(filter.key, $event)"
              @keyup.enter="handleSearch"
            />

            <!-- Number -->
            <Input
              v-else-if="filter.type === 'number'"
              type="number"
              :id="`filter-${filter.key}`"
              :model-value="String(modelValue[filter.key] || '')"
              :placeholder="filter.placeholder"
              :min="filter.min"
              :max="filter.max"
              @update:model-value="updateFilter(filter.key, $event)"
            />

            <!-- Checkbox -->
            <label
              v-else-if="filter.type === 'checkbox'"
              class="flex items-center gap-2 cursor-pointer text-sm text-foreground"
            >
              <input
                type="checkbox"
                :id="`filter-${filter.key}`"
                :checked="Boolean(modelValue[filter.key])"
                class="size-4 rounded border-input accent-primary"
                @change="updateFilter(filter.key, ($event.target as HTMLInputElement).checked)"
              />
              <span>{{ filter.checkboxLabel || filter.label }}</span>
            </label>
          </div>
        </div>

        <div class="flex justify-end">
          <Button variant="ghost" size="sm" :disabled="loading" @click="handleReset">
            <RotateCcw class="size-3.5" />
            Réinitialiser
          </Button>
        </div>
      </div>
    </Transition>
  </div>
</template>
