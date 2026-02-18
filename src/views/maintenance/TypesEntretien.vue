<template>
  <div class="min-h-screen bg-background">
    <main class="flex-1">
      <!-- Loading -->
      <div v-if="loading" class="flex flex-col items-center justify-center gap-4 py-16">
        <LoaderCircle class="size-10 animate-spin text-primary" />
        <p class="text-lg text-muted-foreground">Chargement...</p>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="m-4 rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
        {{ error }}
      </div>

      <!-- Content avec sidebar -->
      <div v-else class="mx-auto grid w-full max-w-[1600px] grid-cols-1 md:grid-cols-[280px_1fr]">
        <!-- Sidebar des dossiers -->
        <aside class="border-b bg-background md:sticky md:top-0 md:h-screen md:border-b-0 md:border-r md:flex md:flex-col">
          <div class="flex items-center justify-between border-b p-4">
            <div class="flex items-center gap-2">
              <Button variant="ghost" size="icon-sm" class="size-7" @click="goBack" title="Retour">
                <ArrowLeft class="size-4" />
              </Button>
              <h2 class="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Dossiers</h2>
            </div>
            <Button
              v-if="isMecanicien"
              variant="default"
              size="icon-sm"
              @click="openCreateFolderModal"
              title="Créer un dossier"
            >
              <Plus class="size-3.5" />
            </Button>
          </div>

          <div class="flex flex-wrap gap-2 overflow-y-auto p-2 md:flex-col md:flex-nowrap md:gap-0">
            <!-- Tous les types -->
            <div
              class="mb-2 flex cursor-pointer items-center gap-3 rounded-md px-3 py-3 transition-colors"
              :class="[
                selectedFolderId === null
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent'
              ]"
              @click="selectFolder(null)"
            >
              <List class="size-5 shrink-0" :class="selectedFolderId === null ? 'text-primary-foreground' : 'text-primary'" />
              <span class="flex-1 truncate text-sm font-medium">Tous</span>
              <span
                class="min-w-6 shrink-0 rounded-full px-2 py-0.5 text-center text-xs"
                :class="selectedFolderId === null ? 'bg-white/20 text-primary-foreground' : 'bg-muted text-muted-foreground'"
              >
                {{ typesEntretien.length }}
              </span>
            </div>

            <!-- Dossiers -->
            <div
              v-for="dossier in dossiers"
              :key="dossier.id"
              class="group relative flex cursor-pointer items-center gap-3 rounded-md px-3 py-3 transition-colors md:mb-1"
              :class="[
                selectedFolderId === dossier.id
                  ? 'bg-primary text-primary-foreground'
                  : dragOverFolderId === dossier.id
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'hover:bg-accent'
              ]"
              @click="selectFolder(dossier.id!)"
              @dragover.prevent="handleDragOver(dossier.id!)"
              @dragleave="handleDragLeave"
              @drop="handleDrop(dossier.id!)"
            >
              <Folder class="size-5 shrink-0" :class="selectedFolderId === dossier.id || dragOverFolderId === dossier.id ? 'text-primary-foreground' : 'text-amber-500'" />
              <span class="flex-1 truncate text-sm font-medium">{{ dossier.nom }}</span>
              <span
                class="min-w-6 shrink-0 rounded-full px-2 py-0.5 text-center text-xs transition-opacity group-hover:md:opacity-0"
                :class="selectedFolderId === dossier.id || dragOverFolderId === dossier.id ? 'bg-white/20 text-primary-foreground' : 'bg-muted text-muted-foreground'"
              >
                {{ getTypeCountForFolder(dossier.id!) }}
              </span>
              <!-- Desktop actions (hover) -->
              <div v-if="isMecanicien" class="absolute right-3 hidden gap-1 md:group-hover:flex">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  class="size-6"
                  :class="selectedFolderId === dossier.id ? 'text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/20' : ''"
                  @click.stop="openEditFolderModal(dossier)"
                  title="Modifier"
                >
                  <Pencil class="size-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  class="size-6"
                  :class="selectedFolderId === dossier.id ? 'text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/20' : 'hover:text-destructive'"
                  @click.stop="confirmDeleteFolder(dossier)"
                  title="Supprimer"
                >
                  <Trash2 class="size-3" />
                </Button>
              </div>
              <!-- Mobile actions (dropdown) -->
              <DropdownMenu v-if="isMecanicien">
                <DropdownMenuTrigger as-child class="md:hidden">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    class="size-6 shrink-0"
                    :class="selectedFolderId === dossier.id ? 'text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/20' : ''"
                    @click.stop
                  >
                    <MoreVertical class="size-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" class="w-40">
                  <DropdownMenuItem @click.stop="openEditFolderModal(dossier)">
                    <Pencil class="mr-2 size-4" />
                    Modifier
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem class="text-destructive focus:text-destructive" @click.stop="confirmDeleteFolder(dossier)">
                    <Trash2 class="mr-2 size-4" />
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <!-- Non classés -->
            <div
              class="mt-0 border-t pt-3 md:mt-2"
              :class="[
                'flex cursor-pointer items-center gap-3 rounded-md px-3 py-3 transition-colors',
                selectedFolderId === 'unclassified'
                  ? 'bg-primary text-primary-foreground'
                  : dragOverFolderId === 'unclassified'
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'hover:bg-accent'
              ]"
              @click="selectFolder('unclassified')"
              @dragover.prevent="handleDragOver('unclassified')"
              @dragleave="handleDragLeave"
              @drop="handleDrop('unclassified')"
            >
              <FolderOpen class="size-5 shrink-0" :class="selectedFolderId === 'unclassified' || dragOverFolderId === 'unclassified' ? 'text-primary-foreground' : 'text-muted-foreground'" />
              <span class="flex-1 truncate text-sm font-medium">Non classés</span>
              <span
                class="min-w-6 shrink-0 rounded-full px-2 py-0.5 text-center text-xs"
                :class="selectedFolderId === 'unclassified' || dragOverFolderId === 'unclassified' ? 'bg-white/20 text-primary-foreground' : 'bg-muted text-muted-foreground'"
              >
                {{ unclassifiedTypes.length }}
              </span>
            </div>
          </div>
        </aside>

        <!-- Liste des types -->
        <div class="flex flex-col gap-4 p-4 md:p-6">
          <!-- Barre de recherche + Ajouter -->
          <div class="flex items-center gap-3">
            <div class="relative flex-1">
              <Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                v-model="searchQuery"
                type="search"
                placeholder="Rechercher par nom ou description..."
                class="pl-9"
              />
            </div>
            <div
              v-if="isMecanicien && filteredTypes.length > 0"
              class="group/hint relative hidden shrink-0 cursor-default text-muted-foreground/40 transition-colors hover:text-muted-foreground md:block"
            >
              <Info class="size-3.5" />
              <div class="pointer-events-none absolute right-0 top-full z-50 mt-2 hidden rounded-md border bg-popover px-3 py-1.5 text-xs text-popover-foreground shadow-md whitespace-nowrap group-hover/hint:block">
                Glissez-déposez les types vers un dossier
              </div>
            </div>
            <Button v-if="isMecanicien" size="sm" class="shrink-0" @click="openCreateTypeModal">
              <Plus class="mr-1.5 size-4" />
              Ajouter un type
            </Button>
          </div>

          <!-- Liste des types -->
          <div class="flex flex-col gap-3">
            <div
              v-for="type in filteredTypes"
              :key="type.id"
              class="flex items-start gap-3 rounded-lg border bg-card p-4 transition-colors hover:shadow-sm"
              :class="isMecanicien ? 'cursor-grab active:cursor-grabbing' : ''"
              :draggable="isMecanicien"
              @dragstart="handleDragStart(type)"
              @dragend="handleDragEnd"
            >
              <div v-if="isMecanicien" class="hidden cursor-grab p-1 text-muted-foreground active:cursor-grabbing md:block">
                <GripVertical class="size-4" />
              </div>
              <div class="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Wrench class="size-5" />
              </div>
              <div class="min-w-0 flex-1">
                <div class="mb-1 flex flex-wrap items-center gap-2">
                  <span class="font-semibold text-foreground">{{ type.nom }}</span>
                  <Badge v-if="type.dossier && selectedFolderId === null" variant="outline" class="gap-1">
                    <Folder class="size-3" />
                    {{ type.dossier.nom }}
                  </Badge>
                </div>
                <p v-if="type.description" class="mb-2 text-sm leading-relaxed text-muted-foreground">
                  {{ truncateText(type.description, 100) }}
                </p>
                <span class="text-xs text-muted-foreground">Créé le {{ formatDate(type.createdAt) }}</span>
              </div>
              <!-- Desktop actions -->
              <div v-if="isMecanicien" class="hidden shrink-0 gap-1 md:flex">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  @click="openEditTypeModal(type)"
                  title="Modifier"
                >
                  <Pencil class="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  @click="confirmDeleteType(type)"
                  title="Supprimer"
                >
                  <Trash2 class="size-3.5" />
                </Button>
              </div>
              <!-- Mobile actions -->
              <DropdownMenu v-if="isMecanicien">
                <DropdownMenuTrigger as-child class="md:hidden">
                  <Button variant="ghost" size="icon-sm">
                    <MoreVertical class="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" class="w-40">
                  <DropdownMenuItem @click="openEditTypeModal(type)">
                    <Pencil class="mr-2 size-4" />
                    Modifier
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem class="text-destructive focus:text-destructive" @click="confirmDeleteType(type)">
                    <Trash2 class="mr-2 size-4" />
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <!-- État vide -->
            <div v-if="filteredTypes.length === 0" class="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <FolderOpen class="mb-4 size-12 opacity-50" />
              <p v-if="searchQuery">Aucun type trouvé pour "{{ searchQuery }}"</p>
              <p v-else-if="selectedFolderId === 'unclassified'">Aucun type non classé</p>
              <p v-else-if="selectedFolderId">Ce dossier est vide</p>
              <p v-else>Aucun type d'entretien</p>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Modal création/édition type -->
    <Dialog v-model:open="showTypeModal">
      <DialogContent class="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{{ isEditTypeMode ? 'Modifier le type d\'entretien' : 'Nouveau type d\'entretien' }}</DialogTitle>
        </DialogHeader>

        <div v-if="typeFormError" class="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {{ typeFormError }}
        </div>

        <form @submit.prevent="handleTypeFormSubmit" class="space-y-4">
          <div class="space-y-2">
            <label for="nom" class="text-sm font-medium text-foreground">Nom *</label>
            <Input
              id="nom"
              v-model="typeFormData.nom"
              type="text"
              placeholder="Changement freins avant"
              :disabled="savingType"
              required
            />
          </div>

          <div class="space-y-2">
            <label for="description" class="text-sm font-medium text-foreground">Description</label>
            <textarea
              id="description"
              v-model="typeFormData.description"
              placeholder="Remplacement des plaquettes et disques de frein avant"
              :disabled="savingType"
              rows="3"
              class="flex min-h-[80px] w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none disabled:cursor-not-allowed disabled:opacity-50"
            ></textarea>
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium text-foreground">Dossier</label>
            <Select
              v-model="typeFormData.dossierId"
              :options="folderOptionsForForm"
              placeholder="Aucun dossier"
              :searchable="true"
              :clearable="true"
              :disabled="savingType"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" @click="closeTypeModal">
              Annuler
            </Button>
            <Button type="submit" :disabled="savingType">
              <LoaderCircle v-if="savingType" class="mr-1.5 size-4 animate-spin" />
              {{ savingType ? 'Enregistrement...' : 'Enregistrer' }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <!-- Modal création/édition dossier -->
    <Dialog v-model:open="showFolderModal">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{{ isEditFolderMode ? 'Modifier le dossier' : 'Nouveau dossier' }}</DialogTitle>
        </DialogHeader>

        <div v-if="folderFormError" class="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {{ folderFormError }}
        </div>

        <form @submit.prevent="handleFolderFormSubmit" class="space-y-4">
          <div class="space-y-2">
            <label for="folderNom" class="text-sm font-medium text-foreground">Nom *</label>
            <Input
              id="folderNom"
              v-model="folderFormData.nom"
              type="text"
              placeholder="Freinage"
              :disabled="savingFolder"
              required
            />
          </div>

          <div class="space-y-2">
            <label for="folderDescription" class="text-sm font-medium text-foreground">Description</label>
            <textarea
              id="folderDescription"
              v-model="folderFormData.description"
              placeholder="Tous les entretiens liés au système de freinage"
              :disabled="savingFolder"
              rows="2"
              class="flex min-h-[60px] w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none disabled:cursor-not-allowed disabled:opacity-50"
            ></textarea>
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" @click="closeFolderModal">
              Annuler
            </Button>
            <Button type="submit" :disabled="savingFolder">
              <LoaderCircle v-if="savingFolder" class="mr-1.5 size-4 animate-spin" />
              {{ savingFolder ? 'Enregistrement...' : 'Enregistrer' }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <!-- Modal suppression type -->
    <Dialog v-model:open="showDeleteTypeModal">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Supprimer le type d'entretien</DialogTitle>
          <DialogDescription>Cette action est irréversible.</DialogDescription>
        </DialogHeader>

        <p class="text-foreground">
          Êtes-vous sûr de vouloir supprimer le type <strong>{{ typeToDelete?.nom }}</strong> ?
        </p>

        <DialogFooter>
          <Button variant="outline" @click="showDeleteTypeModal = false">Annuler</Button>
          <Button
            variant="destructive"
            :disabled="deletingType"
            @click="deleteType"
          >
            <LoaderCircle v-if="deletingType" class="mr-1.5 size-4 animate-spin" />
            {{ deletingType ? 'Suppression...' : 'Supprimer' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Modal suppression dossier -->
    <Dialog v-model:open="showDeleteFolderModal">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Supprimer le dossier</DialogTitle>
          <DialogDescription>Cette action est irréversible.</DialogDescription>
        </DialogHeader>

        <div class="space-y-3">
          <p class="text-foreground">
            Êtes-vous sûr de vouloir supprimer le dossier <strong>{{ folderToDelete?.nom }}</strong> ?
          </p>
          <p class="text-sm text-muted-foreground">
            Les types d'entretien de ce dossier seront déplacés vers "Non classés".
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="showDeleteFolderModal = false">Annuler</Button>
          <Button
            variant="destructive"
            :disabled="deletingFolder"
            @click="deleteFolder"
          >
            <LoaderCircle v-if="deletingFolder" class="mr-1.5 size-4 animate-spin" />
            {{ deletingFolder ? 'Suppression...' : 'Supprimer' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { typesEntretienService, dossiersTypesEntretienService } from '@/services'
import { useMessages } from '@/composables/useMessages'
import type { TypeEntretienDTO, DossierTypeEntretienDTO } from '@/models'

// shadcn components
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

// Lucide icons
import {
  ArrowLeft,
  Plus,
  Search,
  LoaderCircle,
  Pencil,
  Trash2,
  Folder,
  FolderOpen,
  List,
  GripVertical,
  Info,
  Wrench,
  MoreVertical,
} from 'lucide-vue-next'

// DropdownMenu for mobile actions
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'



const router = useRouter()
const authStore = useAuthStore()
const messages = useMessages()

const goBack = () => {
  const historyState = window.history.state
  if (historyState && historyState.position > 0) {
    router.back()
  } else {
    router.push('/entretiens')
  }
}

// État principal
const typesEntretien = ref<TypeEntretienDTO[]>([])
const dossiers = ref<DossierTypeEntretienDTO[]>([])
const loading = ref(true)
const error = ref('')
const searchQuery = ref('')
const selectedFolderId = ref<string | null>(null)

// Drag & Drop
const draggedType = ref<TypeEntretienDTO | null>(null)
const dragOverFolderId = ref<string | null>(null)

// Vérifier si l'utilisateur est mécanicien ou admin
const isMecanicien = computed(() => {
  const roleUuid = authStore.userRoleUuid
  return roleUuid === 'c10523af-a4ab-47e2-8025-5ef4e241ef08' || // Admin
         roleUuid === 'ccbd448a-0eef-4277-b53b-91be340b080f'    // Mécanicien
})

// Modal type
const showTypeModal = ref(false)
const isEditTypeMode = ref(false)
const typeToEdit = ref<TypeEntretienDTO | null>(null)
const savingType = ref(false)
const typeFormError = ref('')
const typeFormData = ref({
  nom: '',
  description: '',
  dossierId: ''
})

// Modal dossier
const showFolderModal = ref(false)
const isEditFolderMode = ref(false)
const folderToEdit = ref<DossierTypeEntretienDTO | null>(null)
const savingFolder = ref(false)
const folderFormError = ref('')
const folderFormData = ref({
  nom: '',
  description: ''
})

// Suppression type
const showDeleteTypeModal = ref(false)
const typeToDelete = ref<TypeEntretienDTO | null>(null)
const deletingType = ref(false)

// Suppression dossier
const showDeleteFolderModal = ref(false)
const folderToDelete = ref<DossierTypeEntretienDTO | null>(null)
const deletingFolder = ref(false)

// Types non classés
const unclassifiedTypes = computed(() =>
  typesEntretien.value.filter(t => !t.dossier)
)

// Options pour le formulaire
const folderOptionsForForm = computed(() =>
  dossiers.value.map(d => ({ value: d.id || '', label: d.nom || '' }))
)

// Types filtrés selon le dossier sélectionné et la recherche
const filteredTypes = computed(() => {
  let result = typesEntretien.value

  // Filtre par dossier
  if (selectedFolderId.value === 'unclassified') {
    result = result.filter(type => !type.dossier)
  } else if (selectedFolderId.value) {
    result = result.filter(type => type.dossier?.id === selectedFolderId.value)
  }

  // Filtre par recherche texte
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(type => {
      return (type.nom?.toLowerCase().includes(query)) ||
             (type.description?.toLowerCase().includes(query))
    })
  }

  return result
})

// Compter les types par dossier
const getTypeCountForFolder = (folderId: string) => {
  return typesEntretien.value.filter(t => t.dossier?.id === folderId).length
}

// Chargement des données
const loadDossiers = async () => {
  try {
    const response = await dossiersTypesEntretienService.getDossiers()
    dossiers.value = response.dossiers || []
  } catch (err) {
    console.error('Erreur lors du chargement des dossiers:', err)
  }
}

const loadTypesEntretien = async () => {
  try {
    loading.value = true
    error.value = ''
    const response = await typesEntretienService.getTypesEntretien()
    typesEntretien.value = response.typesEntretien || response.data || []
  } catch (err) {
    console.error('Erreur lors du chargement des types d\'entretien:', err)
    error.value = err instanceof Error ? err.message : 'Erreur lors du chargement'
  } finally {
    loading.value = false
  }
}

// Sélection dossier
const selectFolder = (folderId: string | null) => {
  selectedFolderId.value = folderId
}

// Drag & Drop handlers
const handleDragStart = (type: TypeEntretienDTO) => {
  draggedType.value = type
}

const handleDragEnd = () => {
  draggedType.value = null
  dragOverFolderId.value = null
}

const handleDragOver = (folderId: string) => {
  if (draggedType.value) {
    dragOverFolderId.value = folderId
  }
}

const handleDragLeave = () => {
  dragOverFolderId.value = null
}

const handleDrop = async (folderId: string) => {
  if (!draggedType.value || !draggedType.value.id) return

  const type = draggedType.value
  const newDossierId = folderId === 'unclassified' ? '' : folderId

  // Ne pas faire de requête si le dossier n'a pas changé
  const currentDossierId = type.dossier?.id || ''
  if (currentDossierId === newDossierId) {
    handleDragEnd()
    return
  }

  try {
    const updateData: { dossierId?: string } = newDossierId ? { dossierId: newDossierId } : {}
    await typesEntretienService.updateType(type.id!, updateData)

    // Mettre à jour localement
    const index = typesEntretien.value.findIndex(t => t.id === type.id)
    if (index !== -1) {
      if (newDossierId) {
        const newDossier = dossiers.value.find(d => d.id === newDossierId)
        typesEntretien.value[index] = { ...type, dossier: newDossier }
      } else {
        typesEntretien.value[index] = { ...type, dossier: undefined }
      }
    }

    const folderName = folderId === 'unclassified'
      ? 'Non classés'
      : dossiers.value.find(d => d.id === folderId)?.nom || 'le dossier'

    messages.success(`Type déplacé vers "${folderName}"`, 'Succès')
  } catch (err) {
    messages.error('Erreur lors du déplacement', 'Erreur')
    console.error(err)
  } finally {
    handleDragEnd()
  }
}

// Utilitaires
const formatDate = (dateValue?: string | Date) => {
  if (!dateValue) return '-'
  const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// Gestion modal type
const openCreateTypeModal = () => {
  isEditTypeMode.value = false
  typeToEdit.value = null
  typeFormData.value = {
    nom: '',
    description: '',
    dossierId: selectedFolderId.value && selectedFolderId.value !== 'unclassified'
      ? selectedFolderId.value
      : ''
  }
  typeFormError.value = ''
  showTypeModal.value = true
}

const openEditTypeModal = (type: TypeEntretienDTO) => {
  isEditTypeMode.value = true
  typeToEdit.value = type
  typeFormData.value = {
    nom: type.nom || '',
    description: type.description || '',
    dossierId: type.dossier?.id || ''
  }
  typeFormError.value = ''
  showTypeModal.value = true
}

const closeTypeModal = () => {
  showTypeModal.value = false
  typeToEdit.value = null
  typeFormError.value = ''
}

const handleTypeFormSubmit = async () => {
  typeFormError.value = ''

  try {
    savingType.value = true

    const dataToSend = {
      nom: typeFormData.value.nom,
      description: typeFormData.value.description || undefined,
      dossierId: typeFormData.value.dossierId || undefined
    }

    if (isEditTypeMode.value && typeToEdit.value?.id) {
      const response = await typesEntretienService.updateType(typeToEdit.value.id, dataToSend)
      const updatedType = response.typeEntretien || response.data
      const index = typesEntretien.value.findIndex(t => t.id === typeToEdit.value?.id)
      if (index !== -1 && updatedType) {
        typesEntretien.value[index] = updatedType
      }
      messages.success('Type modifié avec succès !', 'Succès')
    } else {
      const response = await typesEntretienService.createType(dataToSend)
      const newType = response.typeEntretien || response.data
      if (newType) {
        typesEntretien.value.push(newType)
      }
      messages.success('Type créé avec succès !', 'Succès')
    }

    closeTypeModal()
  } catch (err) {
    typeFormError.value = err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement'
  } finally {
    savingType.value = false
  }
}

// Gestion modal dossier
const openCreateFolderModal = () => {
  isEditFolderMode.value = false
  folderToEdit.value = null
  folderFormData.value = { nom: '', description: '' }
  folderFormError.value = ''
  showFolderModal.value = true
}

const openEditFolderModal = (folder: DossierTypeEntretienDTO) => {
  isEditFolderMode.value = true
  folderToEdit.value = folder
  folderFormData.value = {
    nom: folder.nom || '',
    description: folder.description || ''
  }
  folderFormError.value = ''
  showFolderModal.value = true
}

const closeFolderModal = () => {
  showFolderModal.value = false
  folderToEdit.value = null
  folderFormError.value = ''
}

const handleFolderFormSubmit = async () => {
  folderFormError.value = ''

  try {
    savingFolder.value = true

    if (isEditFolderMode.value && folderToEdit.value?.id) {
      const response = await dossiersTypesEntretienService.updateDossier(
        folderToEdit.value.id,
        folderFormData.value
      )
      const index = dossiers.value.findIndex(d => d.id === folderToEdit.value?.id)
      if (index !== -1 && response.dossier) {
        dossiers.value[index] = response.dossier
      }
      messages.success('Dossier modifié avec succès !', 'Succès')
    } else {
      const response = await dossiersTypesEntretienService.createDossier(folderFormData.value)
      if (response.dossier) {
        dossiers.value.push(response.dossier)
      }
      messages.success('Dossier créé avec succès !', 'Succès')
    }

    closeFolderModal()
  } catch (err) {
    folderFormError.value = err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement'
  } finally {
    savingFolder.value = false
  }
}

// Suppression type
const confirmDeleteType = (type: TypeEntretienDTO) => {
  typeToDelete.value = type
  showDeleteTypeModal.value = true
}

const deleteType = async () => {
  if (!typeToDelete.value?.id) return

  try {
    deletingType.value = true
    await typesEntretienService.deleteType(typeToDelete.value.id)
    typesEntretien.value = typesEntretien.value.filter(t => t.id !== typeToDelete.value?.id)
    showDeleteTypeModal.value = false
    typeToDelete.value = null
    messages.success('Type supprimé avec succès !', 'Succès')
  } catch (err) {
    messages.error('Erreur lors de la suppression', 'Erreur')
  } finally {
    deletingType.value = false
  }
}

// Suppression dossier
const confirmDeleteFolder = (folder: DossierTypeEntretienDTO) => {
  folderToDelete.value = folder
  showDeleteFolderModal.value = true
}

const deleteFolder = async () => {
  if (!folderToDelete.value?.id) return

  try {
    deletingFolder.value = true
    const folderId = folderToDelete.value.id
    await dossiersTypesEntretienService.deleteDossier(folderId)

    // Mettre à jour les types qui étaient dans ce dossier
    typesEntretien.value = typesEntretien.value.map(t => {
      if (t.dossier?.id === folderId) {
        return { ...t, dossier: undefined }
      }
      return t
    })

    dossiers.value = dossiers.value.filter(d => d.id !== folderId)

    // Si on était sur ce dossier, revenir à "Tous"
    if (selectedFolderId.value === folderId) {
      selectedFolderId.value = null
    }

    showDeleteFolderModal.value = false
    folderToDelete.value = null
    messages.success('Dossier supprimé avec succès !', 'Succès')
  } catch (err) {
    messages.error('Erreur lors de la suppression', 'Erreur')
  } finally {
    deletingFolder.value = false
  }
}

onMounted(async () => {
  await loadDossiers()
  await loadTypesEntretien()
})
</script>
