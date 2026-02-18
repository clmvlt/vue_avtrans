<template>
  <Dialog v-model:open="localOpen">
    <DialogContent class="sm:max-w-lg" @interact-outside.prevent>
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <div class="flex size-10 items-center justify-center rounded-full bg-destructive/15 text-destructive">
            <Trash2 class="size-5" />
          </div>
          Supprimer la couchette
        </DialogTitle>
        <DialogDescription class="sr-only">Confirmer la suppression</DialogDescription>
      </DialogHeader>

      <div v-if="couchette" class="space-y-5">
        <!-- Avertissement -->
        <div class="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p class="mb-2 font-medium text-foreground">Êtes-vous sûr de vouloir supprimer cette couchette ?</p>
          <p class="text-sm font-semibold text-destructive">Cette action est irréversible.</p>
        </div>

        <!-- Employé -->
        <div class="border-b pb-4">
          <h4 class="mb-3 text-xs uppercase tracking-wider text-muted-foreground">Employé</h4>
          <div class="flex items-center gap-4">
            <div class="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-border bg-muted">
              <img
                v-if="couchette.user?.pictureUrl"
                :src="couchette.user.pictureUrl"
                :alt="`Photo de ${couchette.user?.firstName}`"
                class="size-full object-cover"
              />
              <span v-else class="flex size-full items-center justify-center bg-primary text-lg font-semibold text-primary-foreground">
                {{ getInitials(couchette.user?.firstName, couchette.user?.lastName) }}
              </span>
            </div>
            <div class="flex flex-col gap-1">
              <strong class="text-foreground">{{ couchette.user?.firstName }} {{ couchette.user?.lastName }}</strong>
              <span class="text-sm text-muted-foreground">{{ couchette.user?.email }}</span>
            </div>
          </div>
        </div>

        <!-- Détails -->
        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-1">
            <span class="text-xs uppercase tracking-wider text-muted-foreground">Date de la couchette</span>
            <span class="font-medium text-primary">{{ formatDate(couchette.date) }}</span>
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-xs uppercase tracking-wider text-muted-foreground">Créée le</span>
            <span class="font-medium text-foreground">{{ formatDateTime(couchette.createdAt) }}</span>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="handleClose">
          Annuler
        </Button>
        <Button variant="destructive" :disabled="loading" @click="handleConfirm">
          Supprimer
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-vue-next'
import type { CouchetteDTO } from '@/models'

interface Props {
  modelValue: boolean
  couchette: CouchetteDTO | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'close': []
  'confirm': []
}>()

const loading = ref(false)

const localOpen = computed({
  get: () => props.modelValue,
  set: (val: boolean) => {
    if (!val) handleClose()
  }
})

const getInitials = (firstName?: string, lastName?: string): string => {
  const first = firstName ? firstName.charAt(0).toUpperCase() : ''
  const last = lastName ? lastName.charAt(0).toUpperCase() : ''
  return first + last || '?'
}

const formatDate = (dateString?: string | Date): string => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

const formatDateTime = (dateString?: string | Date): string => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const handleClose = () => {
  emit('update:modelValue', false)
  emit('close')
}

const handleConfirm = () => {
  emit('confirm')
}
</script>
