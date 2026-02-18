<script setup lang="ts">
import { computed, ref } from 'vue'
import { useVModel } from '@vueuse/core'
import { Eye, EyeOff } from 'lucide-vue-next'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { HTMLAttributes, Component } from 'vue'

interface Props {
  modelValue?: string | number
  label?: string
  type?: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
  error?: string
  hint?: string
  icon?: Component  // Lucide icon component
  autocomplete?: string
  showPasswordToggle?: boolean
  class?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  disabled: false,
  required: false,
  showPasswordToggle: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  blur: [event: FocusEvent]
  focus: [event: FocusEvent]
}>()

const model = useVModel(props, 'modelValue', emit)
const showPassword = ref(false)

const inputType = computed(() => {
  if (props.type === 'password' && props.showPasswordToggle) {
    return showPassword.value ? 'text' : 'password'
  }
  return props.type
})

const hasError = computed(() => !!props.error)

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}
</script>

<template>
  <div :class="cn('w-full space-y-2', props.class)">
    <!-- Label -->
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

    <!-- Input wrapper -->
    <div class="relative">
      <!-- Leading icon -->
      <component
        v-if="icon"
        :is="icon"
        :class="cn(
          'pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2',
          hasError ? 'text-destructive' : 'text-muted-foreground'
        )"
      />

      <!-- Input -->
      <Input
        v-model="model"
        :type="inputType"
        :placeholder="placeholder"
        :disabled="disabled"
        :autocomplete="autocomplete"
        :aria-invalid="hasError"
        :class="cn(
          icon && 'pl-9',
          (showPasswordToggle && type === 'password') && 'pr-10',
        )"
        @blur="(e: FocusEvent) => emit('blur', e)"
        @focus="(e: FocusEvent) => emit('focus', e)"
      />

      <!-- Password toggle -->
      <Button
        v-if="showPasswordToggle && type === 'password'"
        type="button"
        variant="ghost"
        size="icon-sm"
        class="absolute right-1 top-1/2 -translate-y-1/2"
        :disabled="disabled"
        tabindex="-1"
        @click="togglePasswordVisibility"
        :aria-label="showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'"
      >
        <Eye v-if="!showPassword" class="size-4 text-muted-foreground" />
        <EyeOff v-else class="size-4 text-muted-foreground" />
      </Button>
    </div>

    <!-- Hint -->
    <p
      v-if="hint && !error"
      class="text-xs text-muted-foreground"
    >
      {{ hint }}
    </p>

    <!-- Error -->
    <p
      v-if="error"
      class="text-xs text-destructive"
    >
      {{ error }}
    </p>
  </div>
</template>
