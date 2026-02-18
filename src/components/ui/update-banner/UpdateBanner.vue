<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-transform duration-300 ease-out"
      enter-from-class="-translate-y-full"
      enter-to-class="translate-y-0"
      leave-active-class="transition-transform duration-200 ease-in"
      leave-from-class="translate-y-0"
      leave-to-class="-translate-y-full"
    >
      <div
        v-if="show"
        class="fixed inset-x-0 top-0 z-50 bg-primary px-4 py-3 text-primary-foreground shadow-md"
      >
        <div class="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <RefreshCw class="size-5 animate-spin" />
            <span class="text-sm font-medium">
              Une nouvelle version <strong>(v{{ version }})</strong> est disponible.
            </span>
          </div>
          <div class="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              @click="$emit('later')"
            >
              Plus tard
            </Button>
            <Button
              size="sm"
              class="border-primary-foreground/30 bg-primary-foreground text-primary hover:bg-primary-foreground/90"
              :disabled="isUpdating"
              @click="handleUpdate"
            >
              <LoaderCircle v-if="isUpdating" class="mr-2 size-4 animate-spin" />
              Mettre à jour
            </Button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { RefreshCw, LoaderCircle } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

interface Props {
  show: boolean
  version: string | null
}

defineProps<Props>()

const emit = defineEmits<{
  update: []
  later: []
}>()

const isUpdating = ref(false)

const handleUpdate = () => {
  isUpdating.value = true
  emit('update')
}
</script>
