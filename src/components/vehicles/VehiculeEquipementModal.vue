<template>
  <Dialog :open="modelValue" @update:open="$emit('update:modelValue', $event)">
    <DialogContent class="max-h-[90dvh] overflow-y-auto sm:max-w-md">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <div class="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Wrench class="size-5" />
          </div>
          {{ isEditMode ? 'Modifier l\'équipement' : 'Ajouter un équipement' }}
        </DialogTitle>
        <DialogDescription class="sr-only">
          {{ isEditMode ? 'Formulaire de modification d\'équipement' : 'Formulaire d\'ajout d\'équipement' }}
        </DialogDescription>
      </DialogHeader>

      <div v-if="formError" class="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
        {{ formError }}
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div class="space-y-2">
          <label class="text-sm font-medium">Nom *</label>
          <Input
            v-model="form.nom"
            required
            :disabled="saving"
            placeholder="Ex: Gilet jaune, Triangle, Extincteur..."
          />
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium">Quantité</label>
          <Input
            type="number"
            :model-value="form.quantite"
            @update:model-value="form.quantite = $event ? Number($event) : 1"
            min="1"
            :disabled="saving"
            placeholder="1"
          />
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium">Commentaire</label>
          <textarea
            v-model="form.commentaire"
            :disabled="saving"
            placeholder="Commentaire optionnel..."
            rows="3"
            class="flex min-h-16 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" @click="$emit('update:modelValue', false)" :disabled="saving">
            Annuler
          </Button>
          <Button type="submit" :disabled="!form.nom.trim() || saving">
            <LoaderCircle v-if="saving" class="mr-2 size-4 animate-spin" />
            <Check v-else class="mr-2 size-4" />
            {{ isEditMode ? 'Modifier' : 'Ajouter' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { vehiculeEquipementsService } from '@/services'
import type { VehiculeEquipementDTO } from '@/models'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { LoaderCircle, Check, Wrench } from 'lucide-vue-next'

const props = defineProps<{
  modelValue: boolean
  vehiculeId: string
  equipement: VehiculeEquipementDTO | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  saved: []
}>()

const isEditMode = computed(() => !!props.equipement)

const form = ref({
  nom: '',
  quantite: 1,
  commentaire: ''
})
const saving = ref(false)
const formError = ref('')

watch(() => props.modelValue, (open) => {
  if (open) {
    formError.value = ''
    if (props.equipement) {
      form.value = {
        nom: props.equipement.nom || '',
        quantite: props.equipement.quantite ?? 1,
        commentaire: props.equipement.commentaire || ''
      }
    } else {
      form.value = { nom: '', quantite: 1, commentaire: '' }
    }
  }
})

const handleSubmit = async () => {
  formError.value = ''
  saving.value = true

  try {
    if (isEditMode.value && props.equipement?.id) {
      await vehiculeEquipementsService.update(props.equipement.id, {
        nom: form.value.nom.trim(),
        quantite: form.value.quantite,
        commentaire: form.value.commentaire.trim() || undefined
      })
    } else {
      await vehiculeEquipementsService.create({
        vehiculeId: props.vehiculeId,
        nom: form.value.nom.trim(),
        quantite: form.value.quantite,
        commentaire: form.value.commentaire.trim() || undefined
      })
    }

    emit('saved')
    emit('update:modelValue', false)
  } catch (err: unknown) {
    formError.value = err instanceof Error ? err.message : 'Erreur lors de la sauvegarde'
  } finally {
    saving.value = false
  }
}
</script>
