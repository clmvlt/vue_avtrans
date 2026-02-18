<template>
  <Dialog v-model:open="localOpen">
    <DialogContent class="sm:max-w-md" @interact-outside.prevent>
      <DialogHeader>
        <DialogTitle>{{ isEditing ? 'Modifier le type' : 'Nouveau type d\'absence' }}</DialogTitle>
        <DialogDescription>
          {{ isEditing ? 'Modifier un type d\'absence existant' : 'Créer un nouveau type d\'absence' }}
        </DialogDescription>
      </DialogHeader>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div v-if="error" class="flex items-center gap-2 rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle class="size-4 shrink-0" />
          {{ error }}
        </div>

        <!-- Nom -->
        <div class="flex flex-col gap-2">
          <label for="typeName" class="text-sm font-medium text-foreground">Nom du type *</label>
          <Input
            type="text"
            id="typeName"
            v-model="formData.name"
            placeholder="Ex: Congés payés, Maladie..."
            required
            :disabled="saving"
          />
        </div>

        <!-- Couleur -->
        <div class="flex flex-col gap-2">
          <label for="typeColor" class="text-sm font-medium text-foreground">Couleur *</label>
          <div class="flex items-center gap-3">
            <input
              type="color"
              id="typeColor"
              v-model="formData.color"
              :disabled="saving"
              class="size-12 cursor-pointer rounded-md border-2 border-input bg-transparent p-0 [&::-webkit-color-swatch-wrapper]:p-1 [&::-webkit-color-swatch]:rounded-sm [&::-webkit-color-swatch]:border-0"
            />
            <Input
              type="text"
              v-model="formData.color"
              placeholder="#000000"
              pattern="^#[0-9A-Fa-f]{6}$"
              class="flex-1 font-mono"
              :disabled="saving"
            />
            <div
              class="size-12 shrink-0 rounded-md border-2 border-border"
              :style="{ backgroundColor: formData.color }"
            ></div>
          </div>
        </div>

        <!-- Couleurs suggérées -->
        <div class="flex flex-col gap-2">
          <span class="text-sm text-muted-foreground">Couleurs suggérées :</span>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="color in colorPresets"
              :key="color"
              type="button"
              class="size-8 rounded-md border-2 transition-transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
              :class="formData.color === color ? 'border-foreground shadow-[0_0_0_2px] shadow-background' : 'border-transparent'"
              :style="{ backgroundColor: color }"
              @click="formData.color = color"
              :disabled="saving"
            ></button>
          </div>
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
            {{ isEditing ? 'Enregistrer' : 'Créer' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { absenceTypesService } from '@/services'
import { useMessages } from '@/composables/useMessages'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { LoaderCircle, AlertCircle } from 'lucide-vue-next'
import type { AbsenceTypeDTO } from '@/models'

interface Props {
  modelValue: boolean
  absenceType?: AbsenceTypeDTO | null
}

const props = withDefaults(defineProps<Props>(), {
  absenceType: null
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'saved': [type: AbsenceTypeDTO]
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
  name: '',
  color: '#3B82F6'
})

// Couleurs prédéfinies
const colorPresets = [
  '#EF4444', '#F97316', '#F59E0B', '#EAB308',
  '#84CC16', '#22C55E', '#10B981', '#14B8A6',
  '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
  '#8B5CF6', '#A855F7', '#D946EF', '#EC4899'
]

// Computed
const isEditing = computed(() => !!props.absenceType?.uuid)

const isFormValid = computed(() => {
  return formData.value.name.trim().length > 0 && formData.value.color.length > 0
})

// Watch pour charger les données quand le modal s'ouvre
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    if (props.absenceType) {
      formData.value = {
        name: props.absenceType.name || '',
        color: props.absenceType.color || '#3B82F6'
      }
    } else {
      formData.value = {
        name: '',
        color: '#3B82F6'
      }
    }
    error.value = ''
  }
})

const handleSubmit = async () => {
  if (!isFormValid.value) return

  try {
    saving.value = true
    error.value = ''

    const data = {
      name: formData.value.name.trim(),
      color: formData.value.color
    }

    let response: AbsenceTypeDTO

    if (isEditing.value && props.absenceType?.uuid) {
      response = await absenceTypesService.updateType(props.absenceType.uuid, data) as AbsenceTypeDTO
    } else {
      response = await absenceTypesService.createType(data) as AbsenceTypeDTO
    }

    emit('saved', response)
    messages.success(
      isEditing.value ? 'Type d\'absence modifié avec succès' : 'Type d\'absence créé avec succès',
      'Succès'
    )
    handleClose()
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement'
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
