<template>
  <Dialog :open="modelValue" @update:open="(val: boolean) => emit('update:modelValue', val)">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ isCreating ? 'Nouvelle tâche' : 'Modifier la tâche' }}</DialogTitle>
        <DialogDescription class="sr-only">
          {{ isCreating ? 'Créer une nouvelle tâche' : 'Modifier la tâche existante' }}
        </DialogDescription>
      </DialogHeader>

      <div v-if="loading" class="flex flex-col items-center justify-center gap-4 py-12">
        <LoaderCircle class="size-10 animate-spin text-primary" />
        <p class="text-muted-foreground">Chargement...</p>
      </div>

      <form v-else class="space-y-4" @submit.prevent="handleSubmit">
        <div v-if="error" class="flex items-center gap-2 rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle class="size-4 shrink-0" />
          {{ error }}
        </div>

        <!-- Titre -->
        <div class="space-y-2">
          <label for="todoTitle" class="text-sm font-medium text-foreground">Titre *</label>
          <Input
            id="todoTitle"
            v-model="formData.title"
            placeholder="Titre de la tâche"
            :disabled="saving"
            required
          />
        </div>

        <!-- Description -->
        <div class="space-y-2">
          <label for="todoDescription" class="text-sm font-medium text-foreground">Description</label>
          <Textarea
            id="todoDescription"
            v-model="formData.description"
            placeholder="Description détaillée (optionnel)"
            :disabled="saving"
            class="min-h-20"
          />
        </div>

        <!-- Catégorie -->
        <div class="space-y-2">
          <Select
            v-model="formData.categoryUuid"
            label="Catégorie"
            :options="categoryOptions"
            placeholder="Sans catégorie"
            :disabled="saving"
            :searchable="false"
            clearable
          />
          <button
            v-if="categories.length === 0"
            type="button"
            class="text-sm text-primary hover:underline"
            @click="emit('openCategories')"
          >
            Créer une catégorie
          </button>
        </div>

        <DialogFooter class="gap-2 sm:gap-0">
          <Button type="button" variant="outline" :disabled="saving" @click="handleClose">
            Annuler
          </Button>
          <Button type="submit" :disabled="saving || !isFormValid">
            <LoaderCircle v-if="saving" class="mr-2 size-4 animate-spin" />
            {{ isCreating ? 'Créer' : 'Enregistrer' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { todosService } from '@/services'
import { useMessages } from '@/composables/useMessages'
import type { TodoDTO, TodoCategoryDTO } from '@/models'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { LoaderCircle, AlertCircle } from 'lucide-vue-next'

interface Props {
  modelValue: boolean
  todoUuid?: string | null
  isCreating: boolean
  categories: TodoCategoryDTO[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'saved': [todo: TodoDTO]
  'close': []
  'openCategories': []
}>()

const messages = useMessages()

// États
const loading = ref(false)
const saving = ref(false)
const error = ref('')

// Formulaire
const formData = ref({
  title: '',
  description: '',
  categoryUuid: ''
})

// Options pour le select
const categoryOptions = computed(() =>
  props.categories.map(c => ({
    value: c.uuid || '',
    label: c.name || ''
  }))
)

// Validation
const isFormValid = computed(() => {
  return !!formData.value.title.trim()
})

// Charger les données quand le modal s'ouvre
watch(() => props.modelValue, async (isOpen) => {
  if (isOpen) {
    if (props.isCreating) {
      resetForm()
    } else if (props.todoUuid) {
      await loadTodo()
    }
  }
}, { immediate: true })

const loadTodo = async () => {
  if (!props.todoUuid) return

  loading.value = true
  error.value = ''

  try {
    const response = await todosService.getTodoByUuid(props.todoUuid)
    const todo = response.todo
    formData.value = {
      title: todo.title || '',
      description: todo.description || '',
      categoryUuid: todo.category?.uuid || ''
    }
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Erreur lors du chargement'
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  formData.value = {
    title: '',
    description: '',
    categoryUuid: ''
  }
  error.value = ''
}

const handleSubmit = async () => {
  if (!isFormValid.value) return

  saving.value = true
  error.value = ''

  try {
    const data = {
      title: formData.value.title.trim(),
      description: formData.value.description.trim() || undefined,
      categoryUuid: formData.value.categoryUuid || undefined
    }

    let response
    if (props.isCreating) {
      response = await todosService.createTodo(data)
      messages.success('Tâche créée', 'Succès')
    } else if (props.todoUuid) {
      response = await todosService.updateTodo(props.todoUuid, data)
      messages.success('Tâche modifiée', 'Succès')
    }

    if (response?.todo) {
      emit('saved', response.todo)
    }
    handleClose()
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement'
    messages.error(error.value, 'Erreur')
  } finally {
    saving.value = false
  }
}

const handleClose = () => {
  resetForm()
  emit('update:modelValue', false)
  emit('close')
}
</script>
