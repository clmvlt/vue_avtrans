<template>
  <Dialog :open="modelValue" @update:open="$emit('update:modelValue', $event)">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <div class="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <Trash2 class="size-5" />
          </div>
          Supprimer l'équipement
        </DialogTitle>
        <DialogDescription class="sr-only">Confirmation de suppression d'équipement</DialogDescription>
      </DialogHeader>

      <div v-if="deleteError" class="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
        {{ deleteError }}
      </div>

      <p class="text-sm text-muted-foreground">
        Êtes-vous sûr de vouloir supprimer l'équipement
        <span class="font-medium text-foreground">{{ equipement?.nom }}</span> ?
        Cette action est irréversible.
      </p>

      <DialogFooter>
        <Button variant="outline" @click="$emit('update:modelValue', false)" :disabled="deleting">
          Annuler
        </Button>
        <Button variant="destructive" @click="handleDelete" :disabled="deleting">
          <LoaderCircle v-if="deleting" class="mr-2 size-4 animate-spin" />
          <Trash2 v-else class="mr-2 size-4" />
          Supprimer
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { vehiculeEquipementsService } from '@/services'
import type { VehiculeEquipementDTO } from '@/models'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { LoaderCircle, Trash2 } from 'lucide-vue-next'

const props = defineProps<{
  modelValue: boolean
  equipement: VehiculeEquipementDTO | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  deleted: []
}>()

const deleting = ref(false)
const deleteError = ref('')

watch(() => props.modelValue, (open) => {
  if (open) deleteError.value = ''
})

const handleDelete = async () => {
  if (!props.equipement?.id) return

  deleteError.value = ''
  deleting.value = true

  try {
    await vehiculeEquipementsService.delete(props.equipement.id)
    emit('deleted')
    emit('update:modelValue', false)
  } catch (err: unknown) {
    deleteError.value = err instanceof Error ? err.message : 'Erreur lors de la suppression'
  } finally {
    deleting.value = false
  }
}
</script>
