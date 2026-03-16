<template>
  <Dialog v-model:open="localOpen">
    <DialogContent class="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Nouvelle demande d'acompte</DialogTitle>
        <DialogDescription>Envoyer une demande d'acompte à votre responsable</DialogDescription>
      </DialogHeader>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div v-if="error" class="flex items-center gap-2 rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle class="size-4 shrink-0" />
          {{ error }}
        </div>

        <!-- Montant -->
        <div class="flex flex-col gap-2">
          <label for="createMontant" class="text-sm font-medium text-foreground">Montant (€) *</label>
          <Input
            type="number"
            id="createMontant"
            v-model.number="formData.montant"
            min="1"
            step="0.01"
            required
            placeholder="500"
            :disabled="saving"
          />
        </div>

        <!-- Raison -->
        <div class="flex flex-col gap-2">
          <label for="createRaison" class="text-sm font-medium text-foreground">Raison</label>
          <textarea
            id="createRaison"
            v-model="formData.raison"
            placeholder="Motif de la demande (optionnel)..."
            rows="3"
            :disabled="saving"
            class="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          ></textarea>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" @click="handleClose" :disabled="saving">
            Annuler
          </Button>
          <Button
            type="submit"
            :disabled="saving || !isFormValid"
          >
            <LoaderCircle v-if="saving" class="size-4 animate-spin mr-2" />
            Envoyer la demande
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { acomptesService } from '@/services'
import { useMessages } from '@/composables/useMessages'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { LoaderCircle, AlertCircle } from 'lucide-vue-next'
import type { AcompteDTO } from '@/models'

interface Props {
  modelValue: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'saved': [acompte: AcompteDTO]
  'close': []
}>()

const messages = useMessages()

// Local open state synced with modelValue
const localOpen = computed({
  get: () => props.modelValue,
  set: (val: boolean) => {
    if (!val) handleClose()
  }
})

// États
const saving = ref(false)
const error = ref('')

// Formulaire
const formData = ref({
  montant: 0,
  raison: ''
})

// Validation
const isFormValid = computed(() => {
  return formData.value.montant > 0
})

// Réinitialiser le formulaire quand le modal s'ouvre
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    resetForm()
  }
})

const resetForm = () => {
  formData.value = {
    montant: 0,
    raison: ''
  }
  error.value = ''
}

const handleSubmit = async () => {
  if (!isFormValid.value) return

  try {
    saving.value = true
    error.value = ''

    const response = await acomptesService.createAcompteRequest({
      montant: formData.value.montant,
      raison: formData.value.raison || undefined
    })

    emit('saved', response.data as AcompteDTO)
    messages.success('Demande d\'acompte envoyée avec succès', 'Succès')
    handleClose()
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : "Erreur lors de l'envoi de la demande"
    messages.error(error.value, 'Erreur')
  } finally {
    saving.value = false
  }
}

const handleClose = () => {
  emit('update:modelValue', false)
  emit('close')
}
</script>
