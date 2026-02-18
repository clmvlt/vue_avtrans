<template>
  <Dialog v-model:open="localOpen">
    <DialogContent class="sm:max-w-md" @interact-outside.prevent>
      <DialogHeader>
        <DialogTitle>{{ isCreating ? 'Créer un type de carte' : 'Modifier le type de carte' }}</DialogTitle>
        <DialogDescription>
          {{ isCreating ? 'Ajouter un nouveau type de carte' : 'Modifier les informations du type de carte' }}
        </DialogDescription>
      </DialogHeader>

      <div v-if="loading" class="flex flex-col items-center justify-center gap-4 py-12">
        <LoaderCircle class="size-10 animate-spin text-primary" />
        <p class="text-lg text-muted-foreground">Chargement...</p>
      </div>

      <form v-else @submit.prevent="handleSubmit" class="space-y-4">
        <div v-if="error" class="flex items-center gap-2 rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle class="size-4 shrink-0" />
          {{ error }}
        </div>

        <div class="flex flex-col gap-2">
          <label for="typeCarteNom" class="text-sm font-medium text-foreground">Nom *</label>
          <Input
            id="typeCarteNom"
            v-model="formData.nom"
            type="text"
            placeholder="Ex: Bancaire, Carburant..."
            required
            :disabled="saving"
          />
        </div>

        <div class="flex flex-col gap-2">
          <label for="typeCarteDescription" class="text-sm font-medium text-foreground">Description</label>
          <Input
            id="typeCarteDescription"
            v-model="formData.description"
            type="text"
            placeholder="Description du type de carte (optionnel)"
            :disabled="saving"
          />
        </div>

        <!-- Section informations en lecture seule (uniquement en mode édition) -->
        <div v-if="typeCarteData && !isCreating" class="rounded-md border bg-muted/50 p-4">
          <h4 class="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Informations système</h4>
          <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-col gap-1">
              <span class="text-xs text-muted-foreground">UUID</span>
              <span class="break-all font-mono text-xs text-muted-foreground">{{ typeCarteData.uuid }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-xs text-muted-foreground">Créé le</span>
              <span class="text-sm font-medium text-foreground">{{ formatDate(typeCarteData.createdAt) }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-xs text-muted-foreground">Modifié le</span>
              <span class="text-sm font-medium text-foreground">{{ formatDate(typeCarteData.updatedAt) }}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" @click="handleClose" :disabled="saving">
            Annuler
          </Button>
          <Button type="submit" :disabled="saving || !isFormValid">
            <LoaderCircle v-if="saving" class="size-4 animate-spin mr-2" />
            {{ isCreating ? 'Créer' : 'Enregistrer' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { typeCartesService } from '@/services'
import { useMessages } from '@/composables/useMessages'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoaderCircle, AlertCircle } from 'lucide-vue-next'
import type { TypeCarteDTO } from '@/models'

interface Props {
  modelValue: boolean
  typeCarteUuid?: string | null
  isCreating?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  typeCarteUuid: null,
  isCreating: false
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'saved': [typeCarte: TypeCarteDTO]
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
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const typeCarteData = ref<TypeCarteDTO | null>(null)

// Données du formulaire
const formData = ref({
  nom: '',
  description: ''
})

// Validation
const isFormValid = computed(() => {
  return formData.value.nom.trim().length >= 2
})

// Charger les données quand le modal s'ouvre
watch(() => props.modelValue, async (isOpen) => {
  if (isOpen) {
    resetForm()
    if (props.typeCarteUuid && !props.isCreating) {
      await loadTypeCarteData()
    }
  }
}, { immediate: true })

// Charger les données du type de carte
const loadTypeCarteData = async () => {
  if (!props.typeCarteUuid) return

  try {
    loading.value = true
    error.value = ''

    const response = await typeCartesService.getTypeCarteById(props.typeCarteUuid)
    const typeCarte = response as TypeCarteDTO

    if (typeCarte && typeCarte.uuid) {
      typeCarteData.value = typeCarte
      formData.value = {
        nom: typeCarte.nom || '',
        description: typeCarte.description || ''
      }
    } else {
      error.value = 'Type de carte non trouvé'
    }
  } catch (err: any) {
    error.value = err.message || 'Erreur lors du chargement du type de carte'
  } finally {
    loading.value = false
  }
}

// Réinitialiser le formulaire
const resetForm = () => {
  formData.value = {
    nom: '',
    description: ''
  }
  typeCarteData.value = null
  error.value = ''
}

// Soumettre le formulaire
const handleSubmit = async () => {
  if (!isFormValid.value) return

  error.value = ''

  try {
    saving.value = true

    const dataToSend = {
      nom: formData.value.nom.trim(),
      description: formData.value.description.trim() || undefined
    }

    if (props.isCreating) {
      const response = await typeCartesService.createTypeCarte(dataToSend)
      emit('saved', response)
      messages.success('Type de carte créé avec succès !', 'Succès')
    } else if (props.typeCarteUuid) {
      const response = await typeCartesService.updateTypeCarte(props.typeCarteUuid, dataToSend)
      emit('saved', response)
      messages.success('Type de carte modifié avec succès !', 'Succès')
    }

    handleClose()
  } catch (err: any) {
    error.value = err.message || `Erreur lors de ${props.isCreating ? 'la création' : 'la modification'}`
    messages.error(error.value, 'Erreur')
  } finally {
    saving.value = false
  }
}

// Fermer le modal
const handleClose = () => {
  emit('update:modelValue', false)
  emit('close')
}

// Formater une date
const formatDate = (dateString?: Date | string) => {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return '-'

    return date.toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return '-'
  }
}
</script>
