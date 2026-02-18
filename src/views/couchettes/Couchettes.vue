<template>
  <div class="min-h-screen bg-background">
    <main class="px-4 py-4 md:px-6 md:py-6">
      <div class="mx-auto max-w-[1400px]">

        <!-- Loading -->
        <div v-if="loading" class="flex flex-col items-center justify-center gap-4 py-16">
          <LoaderCircle class="size-10 animate-spin text-primary" />
          <p class="text-lg text-muted-foreground">Chargement des couchettes...</p>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="mb-4 rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
          {{ error }}
        </div>

        <!-- Content -->
        <div v-else class="space-y-4">
          <!-- Actions -->
          <div class="flex items-center justify-end gap-3">
            <Button variant="default" size="sm" @click="openCreateModal">
              <Plus class="size-4" />
              Nouvelle couchette
            </Button>
          </div>

          <!-- Filtres -->
          <SearchFilters
            ref="searchFiltersRef"
            v-model="searchFilters"
            :filters="filterConfig"
            :loading="searchLoading"
            :columns="3"
            :hint="activeFiltersText"
            @search="applyFilters"
            @reset="resetFilters"
          />

          <!-- Mobile Cards View -->
          <div class="space-y-3 md:hidden">
            <p class="text-sm text-muted-foreground">{{ pagination.totalElements }} couchette(s)</p>

            <!-- Empty state mobile -->
            <div v-if="sortedData.length === 0" class="flex flex-col items-center gap-3 py-12 text-muted-foreground">
              <BedDouble class="size-10 opacity-50" />
              <p>Aucune couchette trouvée</p>
            </div>

            <!-- Couchette Cards -->
            <div
              v-for="item in sortedData"
              :key="item.uuid"
              class="rounded-lg border bg-card p-4 shadow-sm"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="flex items-center gap-3">
                  <div class="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
                    <img
                      v-if="item.user?.pictureUrl"
                      :src="item.user.pictureUrl"
                      :alt="`Photo de ${item.user?.firstName}`"
                      class="size-full object-cover"
                    />
                    <span v-else class="flex size-full items-center justify-center bg-primary text-sm font-semibold text-primary-foreground">
                      {{ getInitials(item.user?.firstName, item.user?.lastName) }}
                    </span>
                  </div>
                  <div class="flex flex-col">
                    <span class="font-medium text-foreground">{{ item.user?.firstName }} {{ item.user?.lastName }}</span>
                    <span class="text-sm font-medium text-foreground">{{ formatDate(item.date) }}</span>
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
                    <DropdownMenuItem @click="openDetailModal(item)">
                      <Eye class="mr-2 size-4" />
                      Détails
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem class="text-destructive focus:text-destructive" @click="openDeleteModal(item)">
                      <Trash2 class="mr-2 size-4" />
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <!-- Created date -->
              <p class="mt-2 text-xs text-muted-foreground">Créée le {{ formatDateTime(item.createdAt) }}</p>
            </div>
          </div>

          <!-- Desktop Table View -->
          <div class="hidden overflow-hidden rounded-lg border shadow-sm md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    v-for="col in tableColumns"
                    :key="col.key"
                    :class="[
                      col.sortable && 'cursor-pointer select-none hover:text-foreground',
                      sortKey === col.key && 'text-primary',
                      col.align === 'right' && 'text-right',
                    ]"
                    @click="col.sortable && handleSort(col.key)"
                  >
                    {{ col.label }}
                    <template v-if="col.sortable">
                      <ArrowUpDown v-if="sortKey !== col.key" class="ml-1 inline size-3 opacity-30" />
                      <ArrowUp v-else-if="sortDirection === 'asc'" class="ml-1 inline size-3" />
                      <ArrowDown v-else class="ml-1 inline size-3" />
                    </template>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="item in sortedData" :key="item.uuid">
                  <!-- User -->
                  <TableCell>
                    <div class="flex items-center gap-3">
                      <div class="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
                        <img
                          v-if="item.user?.pictureUrl"
                          :src="item.user.pictureUrl"
                          :alt="`Photo de ${item.user?.firstName}`"
                          class="size-full object-cover"
                        />
                        <span v-else class="flex size-full items-center justify-center bg-primary text-sm font-semibold text-primary-foreground">
                          {{ getInitials(item.user?.firstName, item.user?.lastName) }}
                        </span>
                      </div>
                      <span class="font-medium text-foreground">{{ item.user?.firstName }} {{ item.user?.lastName }}</span>
                    </div>
                  </TableCell>

                  <!-- Date -->
                  <TableCell>
                    <span class="font-medium text-foreground">{{ formatDate(item.date) }}</span>
                  </TableCell>

                  <!-- Created date -->
                  <TableCell>
                    <span class="text-sm text-muted-foreground">{{ formatDateTime(item.createdAt) }}</span>
                  </TableCell>

                  <!-- Actions -->
                  <TableCell class="text-right">
                    <div class="flex flex-wrap justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        @click.stop="openDetailModal(item)"
                        title="Détails"
                      >
                        Détails
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        @click.stop="openDeleteModal(item)"
                        title="Supprimer"
                      >
                        Supprimer
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>

                <!-- Empty state -->
                <TableRow v-if="sortedData.length === 0">
                  <TableCell :colspan="tableColumns.length" class="py-12 text-center">
                    <div class="flex flex-col items-center gap-3 text-muted-foreground">
                      <BedDouble class="size-10 opacity-50" />
                      <p>Aucune couchette trouvée</p>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <!-- Pagination -->
          <div v-if="pagination.totalPages > 1" class="flex items-center justify-center gap-4 pt-4">
            <Button variant="outline" size="sm" :disabled="pagination.currentPage === 0" @click="loadCouchettes(pagination.currentPage - 1)">
              <ChevronLeft class="size-4" />
              Précédent
            </Button>
            <span class="text-sm text-muted-foreground">
              Page {{ pagination.currentPage + 1 }} sur {{ pagination.totalPages }}
            </span>
            <Button variant="outline" size="sm" :disabled="pagination.currentPage >= pagination.totalPages - 1" @click="loadCouchettes(pagination.currentPage + 1)">
              Suivant
              <ChevronRight class="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </main>

    <!-- Modal de création -->
    <CouchetteCreateModal v-model="showCreateModal" @saved="handleSaved" @close="showCreateModal = false" />

    <!-- Modal de détails -->
    <CouchetteDetailModal v-model="showDetailModal" :couchette="selectedCouchette" @close="closeDetailModal" @delete="openDeleteFromDetail" />

    <!-- Modal de suppression -->
    <CouchetteDeleteModal v-model="showDeleteModal" :couchette="selectedCouchette" @confirm="handleDelete" @close="closeDeleteModal" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { couchettesService, usersService } from '@/services'
import type { CouchetteDTO, UserDTO } from '@/models'
import type { CouchetteSearchParams } from '@/services/couchettes'
import { useMessages } from '@/composables/useMessages'

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
import SearchFilters, { type FilterConfig } from '@/components/ui/search-filters/SearchFilters.vue'

// Lucide icons
import {
  Plus,
  LoaderCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  BedDouble,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Eye,
  Trash2,
} from 'lucide-vue-next'

// DropdownMenu for mobile actions
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// Custom components
import CouchetteCreateModal from '@/components/couchettes/CouchetteCreateModal.vue'
import CouchetteDetailModal from '@/components/couchettes/CouchetteDetailModal.vue'
import CouchetteDeleteModal from '@/components/couchettes/CouchetteDeleteModal.vue'

interface TableColumnDef {
  key: string
  label: string
  sortable?: boolean
  align?: 'left' | 'center' | 'right'
}

const route = useRoute()
const messages = useMessages()

// Données
const couchettes = ref<CouchetteDTO[]>([])
const users = ref<UserDTO[]>([])

// États
const loading = ref(true)
const searchLoading = ref(false)
const error = ref('')

// Pagination
const pagination = ref({
  currentPage: 0,
  totalPages: 0,
  totalElements: 0
})

// Filtres
const searchFilters = ref<Record<string, unknown>>({
  userUuid: '',
  startDate: '',
  endDate: ''
})

// Sort state
const sortKey = ref<string | null>(null)
const sortDirection = ref<'asc' | 'desc'>('asc')

// Texte descriptif des filtres actifs
const activeFiltersText = computed(() => {
  const parts: string[] = []

  // Employé
  const userUuid = searchFilters.value.userUuid as string
  if (userUuid) {
    const user = users.value.find(u => u.uuid === userUuid)
    if (user) {
      parts.push(`${user.firstName} ${user.lastName}`)
    }
  }

  // Dates
  const startDate = searchFilters.value.startDate as string
  const endDate = searchFilters.value.endDate as string
  if (startDate && endDate) {
    parts.push(`du ${formatDateShort(startDate)} au ${formatDateShort(endDate)}`)
  } else if (startDate) {
    parts.push(`à partir du ${formatDateShort(startDate)}`)
  } else if (endDate) {
    parts.push(`jusqu'au ${formatDateShort(endDate)}`)
  }

  return parts.length > 0 ? parts.join(' · ') : '30 derniers jours affichés'
})

// Format court pour les dates dans le hint
const formatDateShort = (dateString: string): string => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short'
  })
}

// Modals
const showCreateModal = ref(false)
const showDetailModal = ref(false)
const showDeleteModal = ref(false)
const selectedCouchette = ref<CouchetteDTO | null>(null)

// Colonnes du tableau
const tableColumns = computed<TableColumnDef[]>(() => [
  { key: 'userName', label: `Couchettes (${pagination.value.totalElements})`, sortable: true },
  { key: 'date', label: 'Date', sortable: true },
  { key: 'createdAt', label: 'Créée le', sortable: true },
  { key: 'actions', label: 'Actions', align: 'right' }
])

// Configuration des filtres
const filterConfig = computed<FilterConfig[]>(() => [
  {
    key: 'userUuid',
    label: 'Employé',
    type: 'select',
    placeholder: 'Tous les employés',
    options: users.value
      .filter(user => user.uuid && user.firstName)
      .map(user => ({
        value: user.uuid!,
        label: `${user.firstName} ${user.lastName}`
      }))
  },
  {
    key: 'startDate',
    label: 'Date de début',
    type: 'date'
  },
  {
    key: 'endDate',
    label: 'Date de fin',
    type: 'date'
  }
])

// Sort handler
const handleSort = (key: string) => {
  if (sortKey.value === key) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortDirection.value = 'asc'
  }
}

const getValue = (item: any, key: string): any => {
  if (key === 'userName') {
    return `${item.user?.firstName || ''} ${item.user?.lastName || ''}`.trim()
  }
  return key.split('.').reduce((obj: any, k: string) => obj?.[k], item)
}

const sortedData = computed(() => {
  if (!sortKey.value) return couchettes.value

  return [...couchettes.value].sort((a, b) => {
    const aValue = getValue(a, sortKey.value!)
    const bValue = getValue(b, sortKey.value!)

    if (aValue == null && bValue == null) return 0
    if (aValue == null) return sortDirection.value === 'asc' ? 1 : -1
    if (bValue == null) return sortDirection.value === 'asc' ? -1 : 1

    const aDate = Date.parse(aValue)
    const bDate = Date.parse(bValue)
    if (!isNaN(aDate) && !isNaN(bDate)) {
      return sortDirection.value === 'asc' ? aDate - bDate : bDate - aDate
    }

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection.value === 'asc' ? aValue - bValue : bValue - aValue
    }

    const aStr = String(aValue).toLowerCase()
    const bStr = String(bValue).toLowerCase()
    const comparison = aStr.localeCompare(bStr, 'fr')
    return sortDirection.value === 'asc' ? comparison : -comparison
  })
})

// Chargement des données
const loadCouchettes = async (page = 0, isInitialLoad = false) => {
  try {
    if (isInitialLoad) {
      loading.value = true
    } else {
      searchLoading.value = true
    }
    error.value = ''

    const apiFilters: CouchetteSearchParams = {
      page,
      size: 20,
      sortBy: 'date',
      sortDirection: 'desc'
    }

    const startDate = searchFilters.value.startDate as string
    const endDate = searchFilters.value.endDate as string
    const userUuid = searchFilters.value.userUuid as string

    if (startDate) apiFilters.startDate = startDate
    if (endDate) apiFilters.endDate = endDate
    if (userUuid) apiFilters.userUuid = userUuid

    const response = await couchettesService.getAllCouchettes(apiFilters)

    couchettes.value = response.content || []
    pagination.value = {
      currentPage: response.page || 0,
      totalPages: response.totalPages || 1,
      totalElements: response.totalElements || 0
    }
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Erreur lors du chargement des couchettes'
    messages.error(error.value, 'Erreur')
  } finally {
    loading.value = false
    searchLoading.value = false
  }
}

const loadUsers = async () => {
  try {
    const response = await usersService.getUsers()
    if (response && response.data) {
      users.value = Array.isArray(response.data) ? response.data : []
    } else if (Array.isArray(response)) {
      users.value = response as unknown as UserDTO[]
    } else {
      users.value = []
    }
  } catch (err) {
    console.error('Erreur lors du chargement des utilisateurs:', err)
  }
}

// Filtres
const applyFilters = () => {
  loadCouchettes(0)
}

const resetFilters = () => {
  searchFilters.value = {
    userUuid: '',
    startDate: '',
    endDate: ''
  }
  loadCouchettes(0)
}

// Helpers
const getInitials = (firstName?: string, lastName?: string): string => {
  const first = firstName ? firstName.charAt(0).toUpperCase() : ''
  const last = lastName ? lastName.charAt(0).toUpperCase() : ''
  return first + last || '?'
}

const formatDate = (dateString?: string | Date): string => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

const formatDateTime = (dateString?: string | Date): string => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Modals
const openCreateModal = () => {
  showCreateModal.value = true
}

const openDetailModal = (couchette: CouchetteDTO) => {
  selectedCouchette.value = couchette
  showDetailModal.value = true
}

const closeDetailModal = () => {
  showDetailModal.value = false
  if (!showDeleteModal.value) {
    selectedCouchette.value = null
  }
}

const openDeleteFromDetail = (couchette: CouchetteDTO) => {
  showDetailModal.value = false
  openDeleteModal(couchette)
}

const openDeleteModal = (couchette: CouchetteDTO) => {
  selectedCouchette.value = couchette
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  selectedCouchette.value = null
}

// Actions
const handleSaved = () => {
  loadCouchettes(0)
}

const handleDelete = async () => {
  if (!selectedCouchette.value?.uuid) return

  try {
    await couchettesService.deleteCouchette(selectedCouchette.value.uuid)
    messages.success('Couchette supprimée avec succès', 'Succès')
    closeDeleteModal()
    loadCouchettes(pagination.value.currentPage)
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression'
    messages.error(errorMessage, 'Erreur')
  }
}

// Lifecycle
onMounted(() => {
  const userUuidFromQuery = route.query.userUuid as string
  if (userUuidFromQuery) {
    searchFilters.value.userUuid = userUuidFromQuery
  }

  loadCouchettes(0, true)
  loadUsers()
})

// Watch pour les changements de query params
watch(() => route.query.userUuid, (newUserUuid) => {
  if (newUserUuid) {
    searchFilters.value.userUuid = newUserUuid as string
    loadCouchettes(0)
  }
})
</script>
