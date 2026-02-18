<template>
  <div class="min-h-screen bg-background">
    <main class="px-4 py-4 md:px-6 md:py-6">
      <div class="mx-auto max-w-[1200px]">

        <!-- Loading -->
        <div v-if="loading" class="flex flex-col items-center justify-center gap-4 py-16">
          <LoaderCircle class="size-10 animate-spin text-primary" />
          <p class="text-lg text-muted-foreground">Chargement des types de cartes...</p>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="mb-4 rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
          {{ error }}
        </div>

        <!-- Content -->
        <div v-else class="space-y-4">
          <!-- Actions en haut -->
          <div class="flex justify-end">
            <Button variant="default" size="sm" @click="openCreateModal">
              <Plus class="size-4 md:mr-2" />
              <span class="hidden md:inline">Nouveau type</span>
            </Button>
          </div>

          <!-- Barre de recherche -->
          <div class="relative">
            <Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              v-model="searchQuery"
              type="search"
              placeholder="Rechercher un type de carte..."
              class="pl-9"
            />
          </div>

          <!-- Mobile Cards View -->
          <div class="space-y-3 md:hidden">
            <p class="text-sm text-muted-foreground">{{ filteredTypes.length }} type(s)</p>

            <!-- Empty state mobile -->
            <div v-if="filteredTypes.length === 0" class="flex flex-col items-center gap-3 py-12 text-muted-foreground">
              <Tag class="size-10 opacity-50" />
              <p>Aucun type de carte configuré</p>
            </div>

            <!-- Type Cards -->
            <div
              v-for="item in filteredTypes"
              :key="item.uuid"
              class="rounded-lg border bg-card p-4 shadow-sm"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="flex items-center gap-3">
                  <div class="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Tag class="size-5" />
                  </div>
                  <div class="flex flex-col gap-0.5">
                    <span class="font-medium text-foreground">{{ item.nom }}</span>
                    <span v-if="item.description" class="text-sm text-muted-foreground">{{ item.description }}</span>
                  </div>
                </div>

                <!-- Actions dropdown -->
                <DropdownMenu>
                  <DropdownMenuTrigger as-child>
                    <Button variant="ghost" size="icon-sm">
                      <MoreVertical class="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" class="w-40">
                    <DropdownMenuItem @click="openEditModal(item)">
                      <Pencil class="mr-2 size-4" />
                      Modifier
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem class="text-destructive focus:text-destructive" @click="openDeleteModal(item)">
                      <Trash2 class="mr-2 size-4" />
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <p class="mt-2 text-xs text-muted-foreground">Créé le {{ formatDate(item.createdAt) }}</p>
            </div>
          </div>

          <!-- Desktop Table View -->
          <div class="hidden overflow-hidden rounded-lg border shadow-sm md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Types de cartes ({{ filteredTypes.length }})</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Créé le</TableHead>
                  <TableHead class="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-if="filteredTypes.length === 0">
                  <TableCell colspan="4" class="text-center text-muted-foreground">
                    Aucun type de carte configuré
                  </TableCell>
                </TableRow>
                <TableRow v-for="item in filteredTypes" :key="item.uuid">
                  <!-- Nom -->
                  <TableCell>
                    <div class="flex items-center gap-3">
                      <div class="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <Tag class="size-4" />
                      </div>
                      <span class="font-medium text-foreground">{{ item.nom }}</span>
                    </div>
                  </TableCell>

                  <!-- Description -->
                  <TableCell>
                    <span class="text-sm text-muted-foreground">{{ item.description || '-' }}</span>
                  </TableCell>

                  <!-- Date -->
                  <TableCell>
                    <span class="text-sm text-muted-foreground">{{ formatDate(item.createdAt) }}</span>
                  </TableCell>

                  <!-- Actions -->
                  <TableCell class="text-right">
                    <div class="flex flex-wrap justify-end gap-1.5">
                      <Button
                        variant="default"
                        size="sm"
                        @click.stop="openEditModal(item)"
                        title="Modifier"
                      >
                        Modifier
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        @click.stop="openDeleteModal(item)"
                        title="Supprimer"
                      >
                        Supprimer
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </main>

    <!-- Modal de création/édition -->
    <TypeCarteEditModal
      v-model="showEditModal"
      :type-carte-uuid="selectedType?.uuid"
      :is-creating="isCreating"
      @saved="handleSaved"
      @close="closeEditModal"
    />

    <!-- Modal de suppression -->
    <Dialog v-model:open="showDeleteModal">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Supprimer le type de carte</DialogTitle>
          <DialogDescription>Cette action est irréversible.</DialogDescription>
        </DialogHeader>
        <p class="text-sm text-muted-foreground">{{ deleteMessage }}</p>
        <DialogFooter>
          <Button variant="outline" @click="closeDeleteModal">Annuler</Button>
          <Button variant="destructive" @click="handleDelete">Supprimer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { typeCartesService } from '@/services'
import { useMessages } from '@/composables/useMessages'
import type { TypeCarteDTO } from '@/models'
import TypeCarteEditModal from '@/components/cartes/TypeCarteEditModal.vue'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Search, Plus, Tag, LoaderCircle, MoreVertical, Pencil, Trash2 } from 'lucide-vue-next'

// DropdownMenu for mobile actions
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const messages = useMessages()

// Données
const typeCartes = ref<TypeCarteDTO[]>([])

// États
const loading = ref(true)
const error = ref('')
const searchQuery = ref('')

// Modals
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const selectedType = ref<TypeCarteDTO | null>(null)
const isCreating = ref(false)

// Filtrage
const filteredTypes = computed(() => {
  if (!searchQuery.value.trim()) return typeCartes.value
  const query = searchQuery.value.toLowerCase()
  return typeCartes.value.filter(type =>
    type.nom?.toLowerCase().includes(query) ||
    type.description?.toLowerCase().includes(query)
  )
})

// Message de suppression
const deleteMessage = computed(() => {
  if (!selectedType.value) return ''
  return `Êtes-vous sûr de vouloir supprimer le type "${selectedType.value.nom}" ? Cette action est irréversible.`
})

// Chargement des données
const loadTypes = async () => {
  try {
    loading.value = true
    error.value = ''

    const response = await typeCartesService.getTypeCartes()
    typeCartes.value = Array.isArray(response) ? response : []
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Erreur lors du chargement des types de cartes'
    messages.error(error.value, 'Erreur')
  } finally {
    loading.value = false
  }
}

// Helpers
const formatDate = (dateString?: string | Date): string => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

// Modals
const openCreateModal = () => {
  selectedType.value = null
  isCreating.value = true
  showEditModal.value = true
}

const openEditModal = (type: TypeCarteDTO) => {
  selectedType.value = type
  isCreating.value = false
  showEditModal.value = true
}

const closeEditModal = () => {
  showEditModal.value = false
  selectedType.value = null
  isCreating.value = false
}

const openDeleteModal = (type: TypeCarteDTO) => {
  selectedType.value = type
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  selectedType.value = null
}

// Actions
const handleSaved = () => {
  closeEditModal()
  loadTypes()
}

const handleDelete = async () => {
  if (!selectedType.value?.uuid) return

  try {
    await typeCartesService.deleteTypeCarte(selectedType.value.uuid)
    messages.success('Type de carte supprimé avec succès', 'Succès')
    closeDeleteModal()
    loadTypes()
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression'
    messages.error(errorMessage, 'Erreur')
  }
}

// Lifecycle
onMounted(() => {
  loadTypes()
})
</script>
