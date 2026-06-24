<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useVModel, useDebounceFn, onClickOutside } from '@vueuse/core'
import { MapPin, Loader2 } from 'lucide-vue-next'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { geocodingService } from '@/services'
import type { AddressResult } from '@/types/geocoding'
import type { AddressDTO } from '@/models/AddressDTO'
import type { HTMLAttributes, Component } from 'vue'

interface Props {
  /** Valeur de la rue (numéro + voie) — v-model */
  modelValue?: string
  label?: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
  error?: string
  hint?: string
  icon?: Component
  /** Nombre maximum de suggestions affichées */
  limit?: number
  class?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  required: false,
  limit: 8,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  /** Émis lorsqu'une suggestion est sélectionnée : adresse complète parsée */
  select: [address: AddressDTO]
}>()

const model = useVModel(props, 'modelValue', emit)

const results = ref<AddressResult[]>([])
const loading = ref(false)
const open = ref(false)
const highlighted = ref(-1)
/** Évite de relancer une recherche juste après une sélection */
const justSelected = ref(false)

const containerRef = ref<HTMLElement | null>(null)
onClickOutside(containerRef, () => {
  open.value = false
})

const hasError = computed(() => !!props.error)

/** Construit la valeur "rue" affichée à partir d'un résultat (numéro + voie) */
function streetOf(r: AddressResult): string {
  return r.houseNumber ? `${r.houseNumber} ${r.street}` : r.street
}

const runSearch = useDebounceFn(async (q: string) => {
  loading.value = true
  try {
    const res = await geocodingService.search({ q, limit: props.limit })
    results.value = res
    open.value = res.length > 0
    highlighted.value = -1
  } finally {
    loading.value = false
  }
}, 250)

watch(model, (value) => {
  if (justSelected.value) {
    justSelected.value = false
    return
  }
  const q = (value ?? '').toString().trim()
  if (q.length < 3) {
    results.value = []
    open.value = false
    loading.value = false
    return
  }
  loading.value = true
  runSearch(q)
})

function selectResult(r: AddressResult) {
  justSelected.value = true
  model.value = streetOf(r)
  emit('select', {
    street: streetOf(r),
    city: r.city,
    postalCode: r.postcode,
    country: 'France',
  })
  results.value = []
  open.value = false
  highlighted.value = -1
}

function onFocus() {
  if (results.value.length > 0) open.value = true
}

function onKeydown(e: KeyboardEvent) {
  if (!open.value || results.value.length === 0) return
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    highlighted.value = (highlighted.value + 1) % results.value.length
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    highlighted.value =
      highlighted.value <= 0 ? results.value.length - 1 : highlighted.value - 1
  } else if (e.key === 'Enter') {
    const choice = results.value[highlighted.value]
    if (choice) {
      e.preventDefault()
      selectResult(choice)
    }
  } else if (e.key === 'Escape') {
    open.value = false
  }
}
</script>

<template>
  <div ref="containerRef" :class="cn('w-full space-y-2', props.class)">
    <Label
      v-if="label"
      :class="cn(
        'text-sm font-medium',
        hasError && 'text-destructive',
        disabled && 'text-muted-foreground'
      )"
    >
      {{ label }}
      <span v-if="required" class="text-destructive">*</span>
    </Label>

    <div class="relative">
      <component
        :is="icon ?? MapPin"
        :class="cn(
          'pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2',
          hasError ? 'text-destructive' : 'text-muted-foreground'
        )"
      />

      <Input
        v-model="model"
        type="text"
        :placeholder="placeholder"
        :disabled="disabled"
        :aria-invalid="hasError"
        autocomplete="off"
        role="combobox"
        :aria-expanded="open"
        class="pl-9 pr-9"
        @focus="onFocus"
        @keydown="onKeydown"
      />

      <Loader2
        v-if="loading"
        class="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
      />

      <!-- Liste de suggestions -->
      <ul
        v-if="open && results.length > 0"
        class="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-md border border-border bg-popover py-1 shadow-md"
        role="listbox"
      >
        <li
          v-for="(r, i) in results"
          :key="`${r.label}-${i}`"
          role="option"
          :aria-selected="i === highlighted"
          :class="cn(
            'flex cursor-pointer items-start gap-2 px-3 py-2 text-sm',
            i === highlighted ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
          )"
          @mousedown.prevent="selectResult(r)"
          @mouseenter="highlighted = i"
        >
          <MapPin class="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <span class="leading-tight">{{ r.label }}</span>
        </li>
      </ul>
    </div>

    <p v-if="hint && !error" class="text-xs text-muted-foreground">
      {{ hint }}
    </p>
    <p v-if="error" class="text-xs text-destructive">
      {{ error }}
    </p>
  </div>
</template>
