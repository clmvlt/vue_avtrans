<template>
  <div class="min-h-screen bg-background" @click="contextMenu.close">
    <main class="px-4 py-4 sm:px-6 sm:py-6">
      <div class="mx-auto max-w-[1400px]">
        <!-- Loading -->
        <div v-if="loading" class="flex flex-col items-center justify-center gap-4 py-16">
          <LoaderCircle class="size-10 animate-spin text-primary" />
          <p class="text-lg text-muted-foreground">Chargement des versions...</p>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="mb-4 rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
          {{ error }}
        </div>

        <!-- Content -->
        <div v-else class="space-y-4">
          <!-- Search + New version -->
          <div class="flex items-center gap-2 sm:gap-3">
            <div class="relative flex-1">
              <Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input v-model="searchQuery" type="search" placeholder="Rechercher..." class="pl-9" />
            </div>
            <Button size="sm" @click="openCreateModal" title="Nouvelle version">
              <Plus class="size-4 sm:mr-1.5" />
              <span class="hidden sm:inline">Nouvelle version</span>
            </Button>
          </div>

          <!-- Table -->
          <div class="overflow-hidden rounded-lg border shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Version ({{ filteredVersions.length }})</TableHead>
                  <TableHead class="hidden md:table-cell">Fichier</TableHead>
                  <TableHead class="hidden lg:table-cell">Notes</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead class="hidden sm:table-cell">Téléch.</TableHead>
                  <TableHead class="hidden sm:table-cell">Date</TableHead>
                  <TableHead class="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-if="filteredVersions.length === 0">
                  <TableCell colspan="7" class="py-8 text-center text-muted-foreground">
                    Aucune version trouvée
                  </TableCell>
                </TableRow>
                <TableRow v-for="item in filteredVersions" :key="item.id" @contextmenu="contextMenu.open($event, item)">
                  <TableCell>
                    <div class="flex flex-col gap-0.5">
                      <span class="font-semibold text-foreground">{{ item.versionName }}</span>
                      <span class="text-xs text-muted-foreground">Build {{ item.versionCode }}</span>
                      <span class="text-xs text-muted-foreground md:hidden">{{ formatFileSize(item.fileSize) }}</span>
                      <span class="text-xs text-muted-foreground sm:hidden">{{ formatDate(item.createdAt) }}</span>
                    </div>
                  </TableCell>
                  <TableCell class="hidden md:table-cell">
                    <div class="flex flex-col gap-0.5">
                      <span class="max-w-[200px] truncate text-sm text-foreground">{{ item.originalFileName }}</span>
                      <span class="text-xs text-muted-foreground">{{ formatFileSize(item.fileSize) }}</span>
                    </div>
                  </TableCell>
                  <TableCell class="hidden lg:table-cell">
                    <span v-if="item.changelog" class="text-sm text-muted-foreground">
                      {{ truncateText(item.changelog, 50) }}
                    </span>
                    <span v-else class="text-sm text-muted-foreground/50">-</span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      :variant="item.isActive ? 'outline' : 'destructive'"
                      :class="item.isActive ? 'border-green-500/50 text-green-600 dark:text-green-400' : ''"
                    >
                      {{ item.isActive ? 'Actif' : 'Inactif' }}
                    </Badge>
                  </TableCell>
                  <TableCell class="hidden sm:table-cell">
                    <div class="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Download class="size-3.5" />
                      {{ item.downloadCount }}
                    </div>
                  </TableCell>
                  <TableCell class="hidden sm:table-cell">
                    <span class="whitespace-nowrap text-sm text-muted-foreground">{{ formatDate(item.createdAt) }}</span>
                  </TableCell>
                  <TableCell class="text-right">
                    <div class="flex flex-wrap justify-end gap-1.5">
                      <a :href="appVersionsService.getDownloadUrl(item.id)" download>
                        <Button variant="outline" size="icon-sm" title="Télécharger">
                          <Download class="size-3.5" />
                        </Button>
                      </a>
                      <Button variant="default" size="icon-sm" class="sm:size-auto sm:px-3" @click="openEditModal(item)" title="Modifier">
                        <Pencil class="size-3.5 sm:hidden" />
                        <span class="hidden sm:inline">Modifier</span>
                      </Button>
                      <Button variant="destructive" size="icon-sm" class="sm:size-auto sm:px-3" @click="confirmDelete(item)" title="Supprimer">
                        <Trash2 class="size-3.5 sm:hidden" />
                        <span class="hidden sm:inline">Supprimer</span>
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

    <!-- Delete confirmation -->
    <Dialog v-model:open="showDeleteModal">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Supprimer la version</DialogTitle>
          <DialogDescription>Cette action est irréversible.</DialogDescription>
        </DialogHeader>
        <p class="text-sm text-muted-foreground">Êtes-vous sûr de vouloir supprimer cette version ?</p>
        <DialogFooter>
          <Button variant="outline" @click="cancelDelete">Annuler</Button>
          <Button variant="destructive" @click="handleDelete">Supprimer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Create modal -->
    <AppVersionCreateModal
      v-model="showCreateModal"
      @saved="handleVersionCreated"
      @close="closeCreateModal"
    />

    <!-- Edit modal -->
    <AppVersionEditModal
      v-model="showEditModal"
      :version-id="versionToEdit?.id"
      @saved="handleVersionUpdated"
      @close="closeEditModal"
    />

    <!-- Context menu -->
    <ContextMenuPopover
      ref="contextMenuRef"
      :show="contextMenu.state.value.show"
      :x="contextMenu.state.value.x"
      :y="contextMenu.state.value.y"
      :title="contextMenu.state.value.entity?.versionName"
      @close="contextMenu.close"
    >
      <ContextMenuItem @click="contextMenu.handleAction('download', handleContextAction)">
        <template #icon><Download class="size-4" /></template>
        Télécharger
      </ContextMenuItem>
      <ContextMenuItem @click="contextMenu.handleAction('edit', handleContextAction)">
        <template #icon><Pencil class="size-4" /></template>
        Modifier
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem destructive @click="contextMenu.handleAction('delete', handleContextAction)">
        <template #icon><Trash2 class="size-4" /></template>
        Supprimer
      </ContextMenuItem>
    </ContextMenuPopover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { appVersionsService } from '@/services'
import AppVersionCreateModal from '@/components/app-versions/AppVersionCreateModal.vue'
import AppVersionEditModal from '@/components/app-versions/AppVersionEditModal.vue'
import { useMessages } from '@/composables/useMessages'
import { useContextMenu } from '@/composables/useContextMenu'
import type { AppVersionDTO } from '@/models'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ContextMenuPopover, ContextMenuItem, ContextMenuSeparator } from '@/components/ui/context-menu-popover'
import { Plus, Search, Download, LoaderCircle, Pencil, Trash2 } from 'lucide-vue-next'

const messages = useMessages()

// Context menu
const contextMenu = useContextMenu<AppVersionDTO>()
const contextMenuRef = ref<InstanceType<typeof ContextMenuPopover> | null>(null)

watch(contextMenuRef, (el) => {
  if (el?.$el) {
    contextMenu.menuRef.value = el.$el
  }
})

const handleContextAction = (entity: AppVersionDTO, action: string) => {
  switch (action) {
    case 'download':
      window.location.href = appVersionsService.getDownloadUrl(entity.id)
      break
    case 'edit':
      openEditModal(entity)
      break
    case 'delete':
      confirmDelete(entity)
      break
  }
}

// État
const versions = ref<AppVersionDTO[]>([])
const loading = ref(true)
const error = ref('')
const searchQuery = ref('')

// Modal de suppression
const showDeleteModal = ref(false)
const versionToDelete = ref<AppVersionDTO | null>(null)

// Modal de création
const showCreateModal = ref(false)

// Modal d'édition
const showEditModal = ref(false)
const versionToEdit = ref<AppVersionDTO | null>(null)

// Computed pour les versions filtrées
const filteredVersions = computed(() => {
  if (!searchQuery.value.trim()) return versions.value

  const query = searchQuery.value.toLowerCase()
  return versions.value.filter(version => {
    const versionName = version.versionName.toLowerCase()
    const fileName = version.originalFileName.toLowerCase()
    const changelog = (version.changelog || '').toLowerCase()
    return versionName.includes(query) || fileName.includes(query) || changelog.includes(query)
  })
})

// Charger les versions
const loadVersions = async () => {
  try {
    loading.value = true
    error.value = ''

    const response = await appVersionsService.getAllVersions()
    versions.value = response.versions || []

    // Trier par versionCode décroissant
    versions.value.sort((a, b) => b.versionCode - a.versionCode)
  } catch (err: unknown) {
    if (err instanceof Error) {
      error.value = err.message
    } else {
      error.value = 'Erreur lors du chargement des versions'
    }
    messages.error(error.value, 'Erreur')
  } finally {
    loading.value = false
  }
}

// Formater la taille du fichier
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1048576).toFixed(1) + ' MB'
}

// Formater une date
const formatDate = (dateString?: string) => {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return '-'

    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  } catch {
    return '-'
  }
}

// Tronquer le texte
const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// Modal de création
const openCreateModal = () => {
  showCreateModal.value = true
}

const closeCreateModal = () => {
  showCreateModal.value = false
}

const handleVersionCreated = (version: AppVersionDTO) => {
  versions.value.unshift(version)
  versions.value.sort((a, b) => b.versionCode - a.versionCode)
}

// Modal d'édition
const openEditModal = (version: AppVersionDTO) => {
  versionToEdit.value = version
  showEditModal.value = true
}

const closeEditModal = () => {
  showEditModal.value = false
  versionToEdit.value = null
}

const handleVersionUpdated = (updatedVersion: AppVersionDTO) => {
  const index = versions.value.findIndex(v => v.id === updatedVersion.id)
  if (index !== -1) {
    versions.value[index] = updatedVersion
  }
}

// Modal de suppression
const confirmDelete = (version: AppVersionDTO) => {
  versionToDelete.value = version
  showDeleteModal.value = true
}

const cancelDelete = () => {
  showDeleteModal.value = false
  versionToDelete.value = null
}

const handleDelete = async () => {
  if (!versionToDelete.value) return

  try {
    await appVersionsService.deleteVersion(versionToDelete.value.id)
    versions.value = versions.value.filter(v => v.id !== versionToDelete.value!.id)
    messages.success('Version supprimée avec succès', 'Succès')
    showDeleteModal.value = false
    versionToDelete.value = null
  } catch (err: unknown) {
    if (err instanceof Error) {
      messages.error(err.message, 'Erreur')
    } else {
      messages.error('Erreur lors de la suppression', 'Erreur')
    }
  }
}

onMounted(() => {
  loadVersions()
})
</script>
