<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ChevronLeft } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { HTMLAttributes } from 'vue'

interface Props {
  fallback?: string
  size?: 'sm' | 'default' | 'lg' | 'icon'
  class?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<Props>(), {
  fallback: '/',
  size: 'default',
})

const emit = defineEmits<{
  click: []
}>()

const router = useRouter()

const handleBack = () => {
  // Détection historique navigateur
  if (window.history.state?.position > 0) {
    router.back()
  } else {
    router.push(props.fallback)
  }
  emit('click')
}
</script>

<template>
  <Button
    variant="ghost"
    :size="size"
    :class="cn('gap-2', props.class)"
    @click="handleBack"
    aria-label="Retour"
  >
    <ChevronLeft class="size-4" />
    <span v-if="size !== 'icon'">Retour</span>
  </Button>
</template>
