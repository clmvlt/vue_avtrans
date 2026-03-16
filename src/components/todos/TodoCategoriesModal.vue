<template>
  <Dialog :open="modelValue" @update:open="(val: boolean) => emit('update:modelValue', val)">
    <DialogContent class="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <Tags class="size-5" />
          Gestion des catégories
        </DialogTitle>
        <DialogDescription class="sr-only">Gérer les catégories de tâches</DialogDescription>
      </DialogHeader>

      <div class="space-y-6">
        <!-- Formulaire d'ajout/édition -->
        <form class="rounded-lg border bg-muted/50 p-4" @submit.prevent="handleSubmit">
          <div class="flex items-end gap-3">
            <div class="flex-1 space-y-2">
              <label for="categoryName" class="text-sm font-medium text-foreground">Nom de la catégorie</label>
              <Input
                id="categoryName"
                v-model="formData.name"
                placeholder="Ex: Urgent, En attente..."
                :disabled="saving"
                required
              />
            </div>
            <div class="space-y-2">
              <label for="categoryColor" class="text-sm font-medium text-foreground">Couleur</label>
              <input
                id="categoryColor"
                v-model="formData.color"
                type="color"
                :disabled="saving"
                class="h-9 w-10 cursor-pointer rounded-md border border-input bg-transparent p-0.5"
              />
            </div>
            <div class="flex gap-2">
              <Button
                v-if="editingCategory"
                type="button"
                variant="outline"
                size="sm"
                :disabled="saving"
                @click="cancelEdit"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                size="sm"
                :disabled="saving || !formData.name.trim()"
              >
                <LoaderCircle v-if="saving" class="mr-2 size-4 animate-spin" />
                {{ editingCategory ? 'Modifier' : 'Ajouter' }}
              </Button>
            </div>
          </div>
        </form>

        <!-- Liste des catégories -->
        <div class="min-h-[200px]">
          <div v-if="loading" class="flex flex-col items-center justify-center gap-3 py-8">
            <LoaderCircle class="size-8 animate-spin text-primary" />
            <p class="text-muted-foreground">Chargement...</p>
          </div>

          <div v-else-if="categories.length === 0" class="flex flex-col items-center justify-center gap-3 py-8 text-muted-foreground">
            <Tags class="size-8 opacity-50" />
            <p class="font-medium">Aucune catégorie</p>
            <span class="text-sm">Créez votre première catégorie ci-dessus</span>
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="category in categories"
              :key="category.uuid"
              class="flex items-center justify-between rounded-lg border p-3 transition-colors hover:border-border/80 hover:shadow-sm"
              :class="editingCategory?.uuid === category.uuid ? 'border-primary bg-primary/5' : 'bg-card'"
            >
              <div class="flex items-center gap-3">
                <span
                  class="size-5 shrink-0 rounded"
                  :style="{ backgroundColor: category.color }"
                />
                <span class="font-medium text-foreground">{{ category.name }}</span>
              </div>
              <div class="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  :disabled="saving"
                  title="Modifier"
                  @click="startEdit(category)"
                >
                  <Pencil class="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  :disabled="saving"
                  title="Supprimer"
                  class="text-destructive hover:text-destructive"
                  @click="confirmDelete(category)"
                >
                  <Trash2 class="size-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>

  <!-- Modal de confirmation de suppression -->
  <Dialog :open="showDeletePopup" @update:open="(val: boolean) => showDeletePopup = val">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <div class="flex size-10 items-center justify-center rounded-full bg-destructive/15 text-destructive">
            <Trash2 class="size-5" />
          </div>
          Supprimer la catégorie
        </DialogTitle>
        <DialogDescription class="sr-only">Confirmer la suppression de la catégorie</DialogDescription>
      </DialogHeader>
      <p class="text-center text-muted-foreground">
        Voulez-vous vraiment supprimer la catégorie <strong class="text-foreground">{{ categoryToDelete?.name }}</strong> ?
      </p>
      <DialogFooter class="gap-2 sm:gap-0">
        <Button variant="outline" @click="showDeletePopup = false">Annuler</Button>
        <Button variant="destructive" :disabled="saving" @click="handleDelete">
          <LoaderCircle v-if="saving" class="mr-2 size-4 animate-spin" />
          Supprimer
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { todosService } from '@/services'
import { useMessages } from '@/composables/useMessages'
import type { TodoCategoryDTO } from '@/models'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tags, Pencil, Trash2, LoaderCircle } from 'lucide-vue-next'

interface Props {
  modelValue: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'close': []
  'updated': []
}>()

const messages = useMessages()

// États
const loading = ref(false)
const saving = ref(false)
const categories = ref<TodoCategoryDTO[]>([])
const editingCategory = ref<TodoCategoryDTO | null>(null)
const categoryToDelete = ref<TodoCategoryDTO | null>(null)
const showDeletePopup = ref(false)

// Formulaire
const formData = ref({
  name: '',
  color: '#581c87'
})

// Charger les catégories quand le modal s'ouvre
watch(() => props.modelValue, async (isOpen) => {
  if (isOpen) {
    await loadCategories()
  }
}, { immediate: true })

const loadCategories = async () => {
  loading.value = true
  try {
    const response = await todosService.getCategories()
    categories.value = response.categories || []
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement'
    messages.error(errorMessage, 'Erreur')
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  formData.value = {
    name: '',
    color: '#581c87'
  }
  editingCategory.value = null
}

const startEdit = (category: TodoCategoryDTO) => {
  editingCategory.value = category
  formData.value = {
    name: category.name || '',
    color: category.color || '#581c87'
  }
}

const cancelEdit = () => {
  resetForm()
}

const handleSubmit = async () => {
  if (!formData.value.name.trim()) return

  saving.value = true
  try {
    if (editingCategory.value?.uuid) {
      await todosService.updateCategory(editingCategory.value.uuid, {
        name: formData.value.name.trim(),
        color: formData.value.color
      })
      messages.success('Catégorie modifiée', 'Succès')
    } else {
      await todosService.createCategory({
        name: formData.value.name.trim(),
        color: formData.value.color
      })
      messages.success('Catégorie créée', 'Succès')
    }

    resetForm()
    await loadCategories()
    emit('updated')
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement'
    messages.error(errorMessage, 'Erreur')
  } finally {
    saving.value = false
  }
}

const confirmDelete = (category: TodoCategoryDTO) => {
  categoryToDelete.value = category
  showDeletePopup.value = true
}

const handleDelete = async () => {
  if (!categoryToDelete.value?.uuid) return

  saving.value = true
  try {
    await todosService.deleteCategory(categoryToDelete.value.uuid)
    messages.success('Catégorie supprimée', 'Succès')
    showDeletePopup.value = false
    categoryToDelete.value = null
    await loadCategories()
    emit('updated')
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression'
    messages.error(errorMessage, 'Erreur')
  } finally {
    saving.value = false
  }
}
</script>
