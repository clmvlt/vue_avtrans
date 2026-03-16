<template>
  <Dialog v-model:open="localOpen">
    <DialogContent class="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <div class="flex size-10 items-center justify-center rounded-full bg-destructive/15 text-destructive">
            <Trash2 class="size-5" />
          </div>
          Supprimer l'acompte
        </DialogTitle>
        <DialogDescription class="sr-only">Confirmer la suppression</DialogDescription>
      </DialogHeader>

      <div v-if="acompte" class="space-y-5">
        <!-- Avertissement -->
        <div class="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p class="mb-2 font-medium text-foreground">Êtes-vous sûr de vouloir supprimer cet acompte ?</p>
          <p class="text-sm font-semibold text-destructive">Cette action est irréversible.</p>
        </div>

        <!-- Employé -->
        <div class="border-b pb-4">
          <h4 class="mb-3 text-xs uppercase tracking-wider text-muted-foreground">Employé</h4>
          <div class="flex items-center gap-4">
            <div class="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-border bg-muted">
              <img
                v-if="acompte.user?.pictureUrl"
                :src="acompte.user.pictureUrl"
                :alt="`Photo de ${acompte.user?.firstName}`"
                class="size-full object-cover"
              />
              <span v-else class="flex size-full items-center justify-center bg-primary text-lg font-semibold text-primary-foreground">
                {{ getInitials(acompte.user?.firstName, acompte.user?.lastName) }}
              </span>
            </div>
            <div class="flex flex-col gap-1">
              <strong class="text-foreground">{{ acompte.user?.firstName }} {{ acompte.user?.lastName }}</strong>
              <span class="text-sm text-muted-foreground">{{ acompte.user?.email }}</span>
            </div>
          </div>
        </div>

        <!-- Détails de l'acompte -->
        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-1">
            <span class="text-xs uppercase tracking-wider text-muted-foreground">Montant</span>
            <span class="text-lg font-semibold text-green-600 dark:text-green-400">{{ formatMontant(acompte.montant) }}</span>
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-xs uppercase tracking-wider text-muted-foreground">Statut</span>
            <Badge :variant="getStatusVariant(acompte.status)" :class="getStatusClasses(acompte.status)">
              {{ getStatusText(acompte.status) }}
            </Badge>
          </div>
          <div v-if="acompte.raison" class="col-span-2 flex flex-col gap-1">
            <span class="text-xs uppercase tracking-wider text-muted-foreground">Raison</span>
            <span class="font-medium text-foreground">{{ acompte.raison }}</span>
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
import { Badge, type BadgeVariants } from '@/components/ui/badge'
import { Trash2 } from 'lucide-vue-next'
import type { AcompteDTO } from '@/models'

interface Props {
  modelValue: boolean
  acompte: AcompteDTO | null
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

const formatMontant = (montant?: number): string => {
  if (montant === null || montant === undefined) return '0,00 €'
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(montant)
}

const getStatusVariant = (status?: string): BadgeVariants['variant'] => {
  switch (status) {
    case 'REJECTED': return 'destructive'
    case 'CANCELLED': return 'secondary'
    default: return 'outline'
  }
}

const getStatusClasses = (status?: string): string => {
  switch (status) {
    case 'PENDING': return 'border-amber-500/50 text-amber-600 dark:text-amber-400'
    case 'APPROVED': return 'border-green-500/50 text-green-600 dark:text-green-400'
    default: return ''
  }
}

const getStatusText = (status?: string): string => {
  switch (status) {
    case 'PENDING': return 'En attente'
    case 'APPROVED': return 'Approuvé'
    case 'REJECTED': return 'Refusé'
    case 'CANCELLED': return 'Annulé'
    default: return 'Inconnu'
  }
}

const handleClose = () => {
  emit('update:modelValue', false)
  emit('close')
}

const handleConfirm = () => {
  emit('confirm')
}
</script>
