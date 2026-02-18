<template>
  <div class="min-h-screen bg-background">
    <!-- Header -->
    <header class="sticky top-0 z-40 border-b bg-background">
      <div class="mx-auto flex max-w-[1400px] items-center gap-4 px-4 py-3 md:px-6 md:py-4">
        <Retour fallback="/absences" />
        <h1 class="text-lg font-bold text-foreground md:text-xl">Types d'absence</h1>
        <div class="ml-auto">
          <Button variant="default" size="sm" @click="openCreateModal">
            <Plus class="size-4 md:mr-2" />
            <span class="hidden md:inline">Nouveau type</span>
          </Button>
        </div>
      </div>
    </header>

    <main class="px-4 py-4 md:px-6 md:py-6">
      <div class="mx-auto max-w-[1400px]">

        <!-- Loading -->
        <div v-if="loading" class="flex flex-col items-center justify-center gap-4 py-16">
          <LoaderCircle class="size-10 animate-spin text-primary" />
          <p class="text-lg text-muted-foreground">Chargement des types d'absence...</p>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="mb-4 rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
          {{ error }}
        </div>

        <!-- Content -->
        <div v-else class="space-y-4">
          <!-- Mobile Cards View -->
          <div class="space-y-3 md:hidden">
            <p class="text-sm text-muted-foreground">{{ absenceTypes.length }} type(s)</p>

            <!-- Empty state mobile -->
            <div v-if="absenceTypes.length === 0" class="flex flex-col items-center gap-3 py-12 text-muted-foreground">
              <CalendarX class="size-10 opacity-50" />
              <p>Aucun type d'absence configuré</p>
            </div>

            <!-- Type Cards -->
            <div
              v-for="item in absenceTypes"
              :key="item.uuid"
              class="rounded-lg border bg-card p-4 shadow-sm"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="flex items-center gap-3">
                  <span class="size-10 shrink-0 rounded-md border border-border" :style="{ backgroundColor: item.color }"></span>
                  <div class="flex flex-col gap-0.5">
                    <span class="font-medium text-foreground">{{ item.name }}</span>
                    <code class="rounded bg-muted px-2 py-0.5 text-xs font-mono text-muted-foreground">{{ item.color }}</code>
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
                  <TableHead>Types d'absence ({{ absenceTypes.length }})</TableHead>
                  <TableHead>Couleur</TableHead>
                  <TableHead>Créé le</TableHead>
                  <TableHead class="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="item in absenceTypes" :key="item.uuid">
                  <!-- Name with color dot -->
                  <TableCell>
                    <div class="flex items-center gap-3">
                      <span class="size-8 shrink-0 rounded-md border border-border" :style="{ backgroundColor: item.color }"></span>
                      <span class="font-medium text-foreground">{{ item.name }}</span>
                    </div>
                  </TableCell>

                  <!-- Color preview + code -->
                  <TableCell>
                    <div class="flex items-center gap-2">
                      <span class="size-5 shrink-0 rounded border border-border" :style="{ backgroundColor: item.color }"></span>
                      <code class="rounded bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">{{ item.color }}</code>
                    </div>
                  </TableCell>

                  <!-- Created date -->
                  <TableCell>
                    <span class="text-sm text-muted-foreground">{{ formatDate(item.createdAt) }}</span>
                  </TableCell>

                  <!-- Actions -->
                  <TableCell class="text-right">
                    <div class="flex flex-wrap justify-end gap-1.5">
                      <Button variant="default" size="sm" @click.stop="openEditModal(item)" title="Modifier">
                        Modifier
                      </Button>
                      <Button variant="destructive" size="sm" @click.stop="openDeleteModal(item)" title="Supprimer">
                        Supprimer
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>

                <!-- Empty state -->
                <TableRow v-if="absenceTypes.length === 0">
                  <TableCell :colspan="4" class="py-12 text-center">
                    <div class="flex flex-col items-center gap-3 text-muted-foreground">
                      <CalendarX class="size-10 opacity-50" />
                      <p>Aucun type d'absence configuré</p>
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
    <AbsenceTypeEditModal
      v-model="showEditModal"
      :absence-type="selectedType"
      @saved="handleSaved"
      @close="closeEditModal"
    />

    <!-- Delete confirmation dialog -->
    <Dialog v-model:open="showDeleteModal">
      <DialogContent class="sm:max-w-md" @interact-outside.prevent>
        <DialogHeader>
          <DialogTitle class="flex items-center gap-2">
            <div class="flex size-10 items-center justify-center rounded-full bg-destructive/15 text-destructive">
              <Trash2 class="size-5" />
            </div>
            Supprimer le type
          </DialogTitle>
          <DialogDescription class="sr-only">
            Confirmer la suppression du type d'absence
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4">
          <p class="text-center text-sm text-muted-foreground">Êtes-vous sûr de vouloir supprimer ce type d'absence ?</p>
          <p class="text-center text-sm font-semibold text-destructive">Cette action est irréversible.</p>

          <div v-if="selectedType" class="flex items-center gap-3 rounded-lg border bg-muted p-4">
            <span class="size-6 shrink-0 rounded border border-border" :style="{ backgroundColor: selectedType.color }"></span>
            <span class="font-medium text-foreground">{{ selectedType.name }}</span>
          </div>
        </div>

        <DialogFooter class="gap-2 sm:gap-0">
          <Button variant="outline" @click="closeDeleteModal">
            Annuler
          </Button>
          <Button variant="destructive" @click="handleDelete">
            Supprimer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { absenceTypesService } from '@/services'
import { useMessages } from '@/composables/useMessages'
import type { AbsenceTypeDTO } from '@/models'

// shadcn components
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

// Lucide icons
import { Plus, LoaderCircle, Trash2, CalendarX, MoreVertical, Pencil } from 'lucide-vue-next'

// DropdownMenu for mobile actions
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// Custom components (kept as-is)
import { Retour } from '@/components/ui/retour'
import AbsenceTypeEditModal from '@/components/absences/AbsenceTypeEditModal.vue'

const messages = useMessages()

// Données
const absenceTypes = ref<AbsenceTypeDTO[]>([])

// États
const loading = ref(true)
const error = ref('')

// Modals
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const selectedType = ref<AbsenceTypeDTO | null>(null)

// Chargement des données
const loadTypes = async () => {
  try {
    loading.value = true
    error.value = ''

    const response = await absenceTypesService.getAbsenceTypes()
    absenceTypes.value = (response as any).types || []
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Erreur lors du chargement des types d\'absence'
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
  showEditModal.value = true
}

const openEditModal = (type: AbsenceTypeDTO) => {
  selectedType.value = type
  showEditModal.value = true
}

const closeEditModal = () => {
  showEditModal.value = false
  selectedType.value = null
}

const openDeleteModal = (type: AbsenceTypeDTO) => {
  selectedType.value = type
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  selectedType.value = null
}

// Actions
const handleSaved = () => {
  loadTypes()
}

const handleDelete = async () => {
  if (!selectedType.value?.uuid) return

  try {
    await absenceTypesService.deleteType(selectedType.value.uuid)
    messages.success('Type d\'absence supprimé avec succès', 'Succès')
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
