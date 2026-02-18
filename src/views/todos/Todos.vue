<template>
  <div class="min-h-screen bg-background">
    <!-- Header -->
    <header class="sticky top-0 z-40 border-b bg-background">
      <div class="flex flex-wrap items-center justify-end gap-4 px-6 py-4">
        <div class="flex items-center gap-3">
          <label class="flex cursor-pointer items-center gap-2">
            <Checkbox
              :checked="showCompleted"
              @update:checked="(val: boolean) => showCompleted = val"
            />
            <span class="whitespace-nowrap text-sm text-muted-foreground">Afficher terminées</span>
          </label>
          <Button variant="outline" size="sm" @click="showCategoriesModal = true">
            <Tags class="mr-2 size-4" />
            Catégories
          </Button>
          <Button size="sm" @click="openCreateModal">
            <Plus class="mr-2 size-4" />
            Nouvelle tâche
          </Button>
        </div>
      </div>
    </header>

    <main class="overflow-x-auto px-6 py-6">
      <!-- Loading -->
      <div v-if="loading" class="flex flex-col items-center justify-center gap-4 py-16">
        <LoaderCircle class="size-10 animate-spin text-primary" />
        <p class="text-lg text-muted-foreground">Chargement des tâches...</p>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="mb-4 rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
        {{ error }}
      </div>

      <!-- Content - Kanban style -->
      <div v-else class="flex min-h-[calc(100vh-200px)] items-start gap-4 md:flex-row" :class="categories.length === 0 ? 'flex-col md:flex-row' : 'flex-col md:flex-row'">
        <!-- Colonne Sans catégorie -->
        <div
          class="flex w-full flex-1 flex-col rounded-lg border bg-card transition-all md:min-w-[250px] md:max-h-[calc(100vh-180px)]"
          :class="{ 'border-primary ring-2 ring-primary/20': dragOverCategory === 'none' }"
          @dragover.prevent="handleDragOver('none')"
          @dragleave="handleDragLeave"
          @drop="handleDrop('none')"
        >
          <div class="flex shrink-0 items-center justify-between border-b-[3px] border-muted-foreground/30 p-4">
            <span class="font-semibold text-foreground">Sans catégorie</span>
            <Badge variant="secondary" class="text-xs">{{ getTodosByCategory(null).length }}</Badge>
          </div>
          <div class="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
            <div
              v-for="todo in getTodosByCategory(null)"
              :key="todo.uuid"
              class="group cursor-grab rounded-md border bg-muted/50 p-3 transition-all hover:border-border/80 hover:shadow-sm active:cursor-grabbing"
              :class="{
                'opacity-50': draggingTodo?.uuid === todo.uuid,
                'opacity-60': todo.isDone
              }"
              draggable="true"
              @dragstart="handleDragStart($event, todo)"
              @dragend="handleDragEnd"
            >
              <div class="mb-2 flex items-start gap-2">
                <button
                  type="button"
                  class="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-all"
                  :class="todo.isDone
                    ? 'border-green-500 bg-green-500 text-white'
                    : 'border-muted-foreground/40 text-transparent hover:border-primary hover:text-primary'"
                  :disabled="toggling === todo.uuid"
                  @click.stop="handleToggle(todo)"
                >
                  <Check class="size-3" />
                </button>
                <span
                  class="text-sm font-medium leading-snug break-words"
                  :class="todo.isDone ? 'text-muted-foreground line-through' : 'text-foreground'"
                >
                  {{ todo.title }}
                </span>
              </div>
              <p v-if="todo.description" class="mb-2 break-words text-xs leading-snug text-muted-foreground">
                {{ truncateText(todo.description, 80) }}
              </p>
              <div class="flex items-center justify-between border-t pt-2">
                <span v-if="todo.createdBy" class="text-xs text-muted-foreground">
                  {{ todo.createdBy.firstName }}
                </span>
                <span v-else />
                <div class="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 md:opacity-0 max-md:opacity-100">
                  <Button variant="ghost" size="icon-sm" title="Modifier" @click.stop="openEditModal(todo)">
                    <Pencil class="size-3.5 text-primary" />
                  </Button>
                  <Button variant="ghost" size="icon-sm" title="Supprimer" @click.stop="openDeleteModal(todo)">
                    <Trash2 class="size-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
            <div v-if="getTodosByCategory(null).length === 0" class="flex items-center justify-center py-8 text-sm text-muted-foreground">
              Aucune tâche
            </div>
          </div>
        </div>

        <!-- Colonnes par catégorie -->
        <div
          v-for="category in categories"
          :key="category.uuid"
          class="flex w-full flex-1 flex-col rounded-lg border bg-card transition-all md:min-w-[250px] md:max-h-[calc(100vh-180px)]"
          :class="{ 'border-primary ring-2 ring-primary/20': dragOverCategory === category.uuid }"
          @dragover.prevent="handleDragOver(category.uuid)"
          @dragleave="handleDragLeave"
          @drop="handleDrop(category.uuid)"
        >
          <div
            class="flex shrink-0 items-center justify-between p-4"
            :style="{ borderBottom: `3px solid ${category.color}` }"
          >
            <span class="font-semibold text-foreground">{{ category.name }}</span>
            <Badge variant="secondary" class="text-xs">{{ getTodosByCategory(category.uuid).length }}</Badge>
          </div>
          <div class="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
            <div
              v-for="todo in getTodosByCategory(category.uuid)"
              :key="todo.uuid"
              class="group cursor-grab rounded-md border bg-muted/50 p-3 transition-all hover:border-border/80 hover:shadow-sm active:cursor-grabbing"
              :class="{
                'opacity-50': draggingTodo?.uuid === todo.uuid,
                'opacity-60': todo.isDone
              }"
              draggable="true"
              @dragstart="handleDragStart($event, todo)"
              @dragend="handleDragEnd"
            >
              <div class="mb-2 flex items-start gap-2">
                <button
                  type="button"
                  class="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-all"
                  :class="todo.isDone
                    ? 'border-green-500 bg-green-500 text-white'
                    : 'border-muted-foreground/40 text-transparent hover:border-primary hover:text-primary'"
                  :disabled="toggling === todo.uuid"
                  @click.stop="handleToggle(todo)"
                >
                  <Check class="size-3" />
                </button>
                <span
                  class="text-sm font-medium leading-snug break-words"
                  :class="todo.isDone ? 'text-muted-foreground line-through' : 'text-foreground'"
                >
                  {{ todo.title }}
                </span>
              </div>
              <p v-if="todo.description" class="mb-2 break-words text-xs leading-snug text-muted-foreground">
                {{ truncateText(todo.description, 80) }}
              </p>
              <div class="flex items-center justify-between border-t pt-2">
                <span v-if="todo.createdBy" class="text-xs text-muted-foreground">
                  {{ todo.createdBy.firstName }}
                </span>
                <span v-else />
                <div class="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 md:opacity-0 max-md:opacity-100">
                  <Button variant="ghost" size="icon-sm" title="Modifier" @click.stop="openEditModal(todo)">
                    <Pencil class="size-3.5 text-primary" />
                  </Button>
                  <Button variant="ghost" size="icon-sm" title="Supprimer" @click.stop="openDeleteModal(todo)">
                    <Trash2 class="size-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
            <div v-if="getTodosByCategory(category.uuid).length === 0" class="flex items-center justify-center py-8 text-sm text-muted-foreground">
              Aucune tâche
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Poubelle flottante -->
    <Transition name="trash-slide">
      <div
        v-if="draggingTodo"
        class="fixed bottom-8 left-1/2 z-50 flex -translate-x-1/2 cursor-pointer flex-col items-center gap-3 rounded-xl border-3 border-dashed border-destructive bg-gradient-to-br from-destructive/10 to-background px-8 py-6 shadow-2xl transition-all"
        :class="{
          'border-solid bg-gradient-to-br from-destructive to-red-600 scale-105': dragOverCategory === 'trash'
        }"
        @dragover.prevent="handleDragOver('trash')"
        @dragleave="handleDragLeave"
        @drop="handleDropToTrash"
      >
        <Trash2
          class="size-10 transition-colors"
          :class="dragOverCategory === 'trash' ? 'text-white animate-bounce' : 'text-destructive'"
        />
        <span
          class="text-sm font-semibold transition-colors"
          :class="dragOverCategory === 'trash' ? 'text-white' : 'text-destructive'"
        >
          Déposer pour supprimer
        </span>
      </div>
    </Transition>

    <!-- Modal de gestion des catégories -->
    <TodoCategoriesModal
      v-model="showCategoriesModal"
      @close="showCategoriesModal = false"
      @updated="handleCategoriesUpdated"
    />

    <!-- Modal de création/édition -->
    <TodoEditModal
      v-model="showEditModal"
      :todo-uuid="selectedTodo?.uuid"
      :is-creating="isCreating"
      :categories="categories"
      @saved="handleTodoSaved"
      @close="closeEditModal"
      @open-categories="openCategoriesFromEdit"
    />

    <!-- Modal de confirmation de suppression -->
    <Dialog :open="showDeleteModal" @update:open="(val: boolean) => showDeleteModal = val">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle class="flex items-center gap-2">
            <div class="flex size-10 items-center justify-center rounded-full bg-destructive/15 text-destructive">
              <Trash2 class="size-5" />
            </div>
            Supprimer la tâche
          </DialogTitle>
          <DialogDescription class="sr-only">Confirmer la suppression de la tâche</DialogDescription>
        </DialogHeader>
        <p class="text-center text-muted-foreground">
          Voulez-vous vraiment supprimer la tâche <strong class="text-foreground">{{ selectedTodo?.title }}</strong> ?
        </p>
        <DialogFooter class="gap-2 sm:gap-0">
          <Button variant="outline" @click="closeDeleteModal">Annuler</Button>
          <Button variant="destructive" @click="handleDelete">Supprimer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { todosService } from '@/services'
import type { TodoDTO, TodoCategoryDTO } from '@/models'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import TodoCategoriesModal from '@/components/todos/TodoCategoriesModal.vue'
import TodoEditModal from '@/components/todos/TodoEditModal.vue'
import { Tags, Plus, Pencil, Trash2, Check, LoaderCircle } from 'lucide-vue-next'

// Données
const todos = ref<TodoDTO[]>([])
const categories = ref<TodoCategoryDTO[]>([])

// États
const loading = ref(true)
const error = ref('')
const toggling = ref<string | null>(null)
const showCompleted = ref(false)

// Drag & Drop
const draggingTodo = ref<TodoDTO | null>(null)
const dragOverCategory = ref<string | null>(null)

// Modals
const showCategoriesModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const selectedTodo = ref<TodoDTO | null>(null)
const isCreating = ref(false)

// Filtrer les todos par catégorie
const getTodosByCategory = (categoryUuid: string | null | undefined): TodoDTO[] => {
  return filteredTodos.value.filter(todo => {
    const todoCategoryUuid = todo.category?.uuid || null
    return todoCategoryUuid === categoryUuid
  })
}

// Todos filtrés (avec ou sans les terminées)
const filteredTodos = computed(() => {
  if (showCompleted.value) {
    return todos.value
  }
  return todos.value.filter(todo => !todo.isDone)
})

// Chargement des données
const loadTodos = async () => {
  try {
    loading.value = true
    error.value = ''

    const response = await todosService.searchTodos({
      size: 1000,
      sortBy: 'createdAt',
      sortDirection: 'desc'
    })

    todos.value = response.todos || []
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Erreur lors du chargement des tâches'
  } finally {
    loading.value = false
  }
}

const loadCategories = async () => {
  try {
    const response = await todosService.getCategories()
    categories.value = response.categories || []
  } catch (err) {
    console.error('Erreur lors du chargement des catégories:', err)
  }
}

// Helpers
const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// Drag & Drop handlers
const handleDragStart = (event: DragEvent, todo: TodoDTO) => {
  draggingTodo.value = todo
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', todo.uuid || '')
  }
}

const handleDragEnd = () => {
  draggingTodo.value = null
  dragOverCategory.value = null
}

const handleDragOver = (categoryUuid: string | undefined) => {
  dragOverCategory.value = categoryUuid || 'none'
}

const handleDragLeave = () => {
  dragOverCategory.value = null
}

const handleDropToTrash = async () => {
  const todoToDelete = draggingTodo.value
  if (!todoToDelete?.uuid) return

  const todoUuid = todoToDelete.uuid
  const index = todos.value.findIndex(t => t.uuid === todoUuid)

  // Suppression optimiste
  if (index !== -1) {
    todos.value.splice(index, 1)
  }

  try {
    await todosService.deleteTodo(todoUuid)
  } catch {
    // Rollback en cas d'erreur
    if (index !== -1) {
      todos.value.splice(index, 0, todoToDelete)
    }
  } finally {
    dragOverCategory.value = null
    draggingTodo.value = null
  }
}

const handleDrop = async (categoryUuid: string | undefined) => {
  if (!draggingTodo.value?.uuid) return

  const targetCategoryUuid = categoryUuid === 'none' ? undefined : categoryUuid
  const currentCategoryUuid = draggingTodo.value.category?.uuid

  // Ne rien faire si c'est la même catégorie
  if (targetCategoryUuid === currentCategoryUuid) {
    dragOverCategory.value = null
    return
  }

  // Sauvegarder les infos du todo qu'on déplace
  const todoUuid = draggingTodo.value.uuid
  const todoTitle = draggingTodo.value.title
  const todoDescription = draggingTodo.value.description
  const index = todos.value.findIndex(t => t.uuid === todoUuid)
  const originalTodo = index !== -1 ? { ...todos.value[index] } : null

  // Mise à jour optimiste immédiate
  if (index !== -1) {
    const targetCategory = targetCategoryUuid
      ? categories.value.find(c => c.uuid === targetCategoryUuid)
      : undefined
    todos.value[index] = {
      ...todos.value[index],
      category: targetCategory ? { ...targetCategory } : undefined
    }
  }

  try {
    await todosService.updateTodo(todoUuid, {
      title: todoTitle,
      description: todoDescription,
      categoryUuid: targetCategoryUuid
    })
  } catch {
    // Rollback en cas d'erreur
    if (index !== -1 && originalTodo) {
      todos.value[index] = originalTodo
    }
  } finally {
    dragOverCategory.value = null
  }
}

// Toggle todo
const handleToggle = async (todo: TodoDTO) => {
  if (!todo.uuid || toggling.value) return

  toggling.value = todo.uuid
  try {
    const response = await todosService.toggleTodo(todo.uuid)

    // Mettre à jour le todo dans la liste
    const index = todos.value.findIndex(t => t.uuid === todo.uuid)
    if (index !== -1 && response.todo) {
      todos.value.splice(index, 1, response.todo)
    }
  } catch {
    // Erreur silencieuse
  } finally {
    toggling.value = null
  }
}

// Modals
const openCreateModal = () => {
  selectedTodo.value = null
  isCreating.value = true
  showEditModal.value = true
}

const openEditModal = (todo: TodoDTO) => {
  selectedTodo.value = todo
  isCreating.value = false
  showEditModal.value = true
}

const closeEditModal = () => {
  showEditModal.value = false
  selectedTodo.value = null
}

const openDeleteModal = (todo: TodoDTO) => {
  selectedTodo.value = todo
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  selectedTodo.value = null
}

const openCategoriesFromEdit = () => {
  showEditModal.value = false
  showCategoriesModal.value = true
}

// Actions
const handleTodoSaved = (savedTodo: TodoDTO) => {
  if (isCreating.value) {
    todos.value.unshift(savedTodo)
  } else {
    const index = todos.value.findIndex(t => t.uuid === savedTodo.uuid)
    if (index !== -1) {
      todos.value.splice(index, 1, savedTodo)
    }
  }
}

const handleCategoriesUpdated = () => {
  loadCategories()
}

const handleDelete = async () => {
  if (!selectedTodo.value?.uuid) return

  try {
    await todosService.deleteTodo(selectedTodo.value.uuid)

    // Retirer le todo de la liste
    const index = todos.value.findIndex(t => t.uuid === selectedTodo.value?.uuid)
    if (index !== -1) {
      todos.value.splice(index, 1)
    }

    closeDeleteModal()
  } catch {
    // Erreur silencieuse
  }
}

// Lifecycle
onMounted(() => {
  loadTodos()
  loadCategories()
})
</script>

<style>
/* Trash slide animation - needs non-scoped for Transition */
.trash-slide-enter-active {
  animation: trashSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.trash-slide-leave-active {
  animation: trashSlideOut 0.3s ease-in forwards;
}

@keyframes trashSlideIn {
  0% {
    transform: translateX(-50%) translateY(150%);
    opacity: 0;
  }
  100% {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
}

@keyframes trashSlideOut {
  0% {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
  100% {
    transform: translateX(-50%) translateY(150%);
    opacity: 0;
  }
}
</style>
