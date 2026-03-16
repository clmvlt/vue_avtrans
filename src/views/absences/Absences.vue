<template>
  <div class="min-h-screen bg-background" @click="contextMenu.close">
    <main class="px-4 py-4 md:px-6 md:py-6">
      <div class="mx-auto max-w-[1400px]">

        <!-- Loading -->
        <div v-if="loading" class="flex flex-col items-center justify-center gap-4 py-16">
          <LoaderCircle class="size-10 animate-spin text-primary" />
          <p class="text-lg text-muted-foreground">Chargement des absences...</p>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="mb-4 rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
          {{ error }}
        </div>

        <!-- Content -->
        <div v-else class="space-y-4">
          <!-- Actions -->
          <div class="flex items-center justify-end gap-3">
            <Button
              variant="outline"
              size="sm"
              @click="$router.push('/absence-types')"
              title="Gérer les types d'absence"
            >
              <Settings class="size-4" />
              Types
            </Button>
            <Button variant="default" size="sm" @click="openCreateModal">
              <Plus class="size-4" />
              Nouvelle absence
            </Button>
          </div>

          <!-- Filtres -->
          <SearchFilters
            ref="searchFiltersRef"
            v-model="searchFilters"
            :filters="filterConfig"
            :loading="searchLoading"
            :columns="5"
            :hint="activeFiltersText"
            @search="applyFilters"
            @reset="resetFilters"
          />

          <!-- Mobile Cards View -->
          <div class="space-y-3 md:hidden">
            <p class="text-sm text-muted-foreground">{{ pagination.totalElements }} absence(s)</p>

            <!-- Empty state mobile -->
            <div v-if="sortedData.length === 0" class="flex flex-col items-center gap-3 py-12 text-muted-foreground">
              <CalendarX class="size-10 opacity-50" />
              <p>Aucune absence trouvée</p>
            </div>

            <!-- Absence Cards -->
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
                    <span class="text-sm text-muted-foreground">{{ formatDateTime(item.createdAt) }}</span>
                  </div>
                </div>

                <!-- Actions dropdown -->
                <DropdownMenu>
                  <DropdownMenuTrigger as-child>
                    <Button variant="ghost" size="icon-sm">
                      <MoreVertical class="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" class="w-44">
                    <template v-if="item.status === 'PENDING'">
                      <DropdownMenuItem class="text-green-600" @click="openValidateModal(item, true)">
                        <Check class="mr-2 size-4" />
                        Approuver
                      </DropdownMenuItem>
                      <DropdownMenuItem class="text-destructive" @click="openValidateModal(item, false)">
                        <X class="mr-2 size-4" />
                        Refuser
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </template>
                    <DropdownMenuItem @click="openDetailModal(item)">
                      <Eye class="mr-2 size-4" />
                      Détails
                    </DropdownMenuItem>
                    <DropdownMenuItem v-if="canEdit(item)" @click="openEditModal(item)">
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

              <!-- Info row -->
              <div class="mt-3 flex flex-wrap items-center gap-2">
                <Badge
                  v-if="item.absenceType"
                  variant="outline"
                  :style="{
                    backgroundColor: item.absenceType.color + '20',
                    color: item.absenceType.color,
                    borderColor: item.absenceType.color
                  }"
                >
                  {{ item.absenceType.name }}
                </Badge>
                <Badge v-else-if="item.customType" variant="secondary">
                  {{ item.customType }}
                </Badge>
                <Badge :variant="getStatusVariant(item.status)" :class="getStatusClasses(item.status)">
                  {{ getStatusText(item.status) }}
                </Badge>
              </div>

              <!-- Period -->
              <div class="mt-2 text-sm">
                <span class="font-medium text-foreground">
                  {{ formatDate(item.startDate) }}
                  <span v-if="item.startDate !== item.endDate"> → {{ formatDate(item.endDate) }}</span>
                </span>
                <span class="ml-2 text-muted-foreground">
                  ({{ calculateAbsenceDuration(item.startDate, item.endDate, item.period) }}<template v-if="isHalfDay(item.period)"> · {{ getPeriodLabel(item.period) }}</template>)
                </span>
              </div>
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
                <TableRow v-for="item in sortedData" :key="item.uuid" @contextmenu="contextMenu.open($event, item)">
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

                  <!-- Type -->
                  <TableCell>
                    <Badge
                      v-if="item.absenceType"
                      variant="outline"
                      :style="{
                        backgroundColor: item.absenceType.color + '20',
                        color: item.absenceType.color,
                        borderColor: item.absenceType.color
                      }"
                    >
                      {{ item.absenceType.name }}
                    </Badge>
                    <Badge v-else-if="item.customType" variant="secondary">
                      {{ item.customType }}
                    </Badge>
                    <span v-else class="text-sm text-muted-foreground">-</span>
                  </TableCell>

                  <!-- Period -->
                  <TableCell>
                    <div class="flex flex-col gap-1">
                      <span class="font-medium text-foreground">
                        {{ formatDate(item.startDate) }}
                        <span v-if="item.startDate !== item.endDate">
                          → {{ formatDate(item.endDate) }}
                        </span>
                      </span>
                      <span class="text-xs text-muted-foreground">
                        {{ calculateAbsenceDuration(item.startDate, item.endDate, item.period) }}
                        <template v-if="isHalfDay(item.period)"> · {{ getPeriodLabel(item.period) }}</template>
                      </span>
                    </div>
                  </TableCell>

                  <!-- Status -->
                  <TableCell>
                    <div class="flex flex-col items-start gap-1">
                      <Badge :variant="getStatusVariant(item.status)" :class="getStatusClasses(item.status)">
                        {{ getStatusText(item.status) }}
                      </Badge>
                      <span v-if="item.validatedBy && item.status !== 'PENDING'" class="text-xs text-muted-foreground">
                        par {{ item.validatedBy.firstName }} {{ item.validatedBy.lastName }}
                      </span>
                    </div>
                  </TableCell>

                  <!-- Created date -->
                  <TableCell>
                    <span class="text-sm text-muted-foreground">{{ formatDateTime(item.createdAt) }}</span>
                  </TableCell>

                  <!-- Actions -->
                  <TableCell class="text-right">
                    <div class="flex flex-wrap justify-end gap-1.5">
                      <template v-if="item.status === 'PENDING'">
                        <Button
                          size="sm"
                          variant="outline"
                          class="border-green-500/50 text-green-600 hover:bg-green-500/10"
                          @click.stop="openValidateModal(item, true)"
                          title="Approuver"
                        >
                          Approuver
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          @click.stop="openValidateModal(item, false)"
                          title="Refuser"
                        >
                          Refuser
                        </Button>
                      </template>
                      <Button
                        size="sm"
                        variant="outline"
                        @click.stop="openDetailModal(item)"
                        title="Détails"
                      >
                        Détails
                      </Button>
                      <Button
                        v-if="canEdit(item)"
                        size="sm"
                        variant="outline"
                        @click.stop="openEditModal(item)"
                        title="Modifier"
                      >
                        Modifier
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
                      <CalendarX class="size-10 opacity-50" />
                      <p>Aucune absence trouvée</p>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <!-- Pagination -->
          <div v-if="pagination.totalPages > 1" class="flex items-center justify-center gap-4 pt-4">
            <Button variant="outline" size="sm" :disabled="pagination.currentPage === 0" @click="loadAbsences(pagination.currentPage - 1)">
              <ChevronLeft class="size-4" />
              Précédent
            </Button>
            <span class="text-sm text-muted-foreground">
              Page {{ pagination.currentPage + 1 }} sur {{ pagination.totalPages }}
            </span>
            <Button variant="outline" size="sm" :disabled="pagination.currentPage >= pagination.totalPages - 1" @click="loadAbsences(pagination.currentPage + 1)">
              Suivant
              <ChevronRight class="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </main>

    <!-- Modal de création -->
    <AbsenceEditModal
      v-model="showCreateModal"
      @saved="handleAbsenceSaved"
      @close="showCreateModal = false"
    />

    <!-- Modal d'édition -->
    <AbsenceEditModal
      v-model="showEditModal"
      :absence="selectedAbsence"
      @saved="handleAbsenceSaved"
      @close="closeEditModal"
    />

    <!-- Modal de détails -->
    <AbsenceDetailModal
      v-model="showDetailModal"
      :absence="selectedAbsence"
      @close="closeDetailModal"
      @approve="handleApproveFromDetail"
      @reject="handleRejectFromDetail"
      @edit="handleEditFromDetail"
    />

    <!-- Modal de validation -->
    <AbsenceValidateModal
      v-model="showValidateModal"
      :absence="selectedAbsence"
      :is-approving="isApproving"
      @validated="handleValidated"
      @close="closeValidateModal"
    />

    <!-- Modal de suppression -->
    <AbsenceDeleteModal
      v-model="showDeleteModal"
      :absence="selectedAbsence"
      @confirm="handleDelete"
      @close="closeDeleteModal"
    />

    <!-- Context menu (right-click) -->
    <ContextMenuPopover
      ref="contextMenuRef"
      :show="contextMenu.state.value.show"
      :x="contextMenu.state.value.x"
      :y="contextMenu.state.value.y"
      :title="`${contextMenu.state.value.entity?.user?.firstName ?? ''} ${contextMenu.state.value.entity?.user?.lastName ?? ''}`"
      @close="contextMenu.close"
    >
      <template v-if="contextMenu.state.value.entity?.status === 'PENDING'">
        <ContextMenuItem class="text-green-600" @click="contextMenu.handleAction('approve', handleContextAction)">
          <template #icon><Check class="size-4" /></template>
          Approuver
        </ContextMenuItem>
        <ContextMenuItem destructive @click="contextMenu.handleAction('reject', handleContextAction)">
          <template #icon><X class="size-4" /></template>
          Refuser
        </ContextMenuItem>
        <ContextMenuSeparator />
      </template>
      <ContextMenuItem @click="contextMenu.handleAction('details', handleContextAction)">
        <template #icon><Eye class="size-4" /></template>
        Détails
      </ContextMenuItem>
      <ContextMenuItem
        v-if="contextMenu.state.value.entity && canEdit(contextMenu.state.value.entity)"
        @click="contextMenu.handleAction('edit', handleContextAction)"
      >
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
import { useRoute } from 'vue-router'
import { absencesService, absenceTypesService, usersService } from '@/services'
import type { AbsenceDTO, AbsenceTypeDTO, UserDTO } from '@/models'
import type { AbsenceSearchParams, AbsenceStatus, AbsenceListResponse } from '@/services/absences'
import type { AbsenceTypeListResponse } from '@/services/absenceTypes'
import { useMessages } from '@/composables/useMessages'
import { useContextMenu } from '@/composables/useContextMenu'
import { calculateAbsenceDuration, isHalfDay, getPeriodLabel } from '@/utils/absenceFormatters'

// shadcn components
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  Settings,
  LoaderCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CalendarX,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Check,
  X,
  Eye,
  Pencil,
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

// Context menu for desktop right-click
import {
  ContextMenuPopover,
  ContextMenuItem,
  ContextMenuSeparator,
} from '@/components/ui/context-menu-popover'

// Custom components
import AbsenceEditModal from '@/components/absences/AbsenceEditModal.vue'
import AbsenceDetailModal from '@/components/absences/AbsenceDetailModal.vue'
import AbsenceValidateModal from '@/components/absences/AbsenceValidateModal.vue'
import AbsenceDeleteModal from '@/components/absences/AbsenceDeleteModal.vue'

interface TableColumnDef {
  key: string
  label: string
  sortable?: boolean
  align?: 'left' | 'center' | 'right'
}

const route = useRoute()
const messages = useMessages()

// Données
const absences = ref<AbsenceDTO[]>([])
const users = ref<UserDTO[]>([])
const absenceTypes = ref<AbsenceTypeDTO[]>([])

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
  status: '',
  absenceTypeUuid: '',
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

  // Statut
  const status = searchFilters.value.status as string
  if (status) {
    const statusLabels: Record<string, string> = {
      'PENDING': 'En attente',
      'APPROVED': 'Approuvées',
      'REJECTED': 'Refusées'
    }
    parts.push(statusLabels[status] || status)
  }

  // Type d'absence
  const absenceTypeUuid = searchFilters.value.absenceTypeUuid as string
  if (absenceTypeUuid) {
    const type = absenceTypes.value.find(t => t.uuid === absenceTypeUuid)
    if (type) {
      parts.push(type.name || '')
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
const showEditModal = ref(false)
const showDetailModal = ref(false)
const showValidateModal = ref(false)
const showDeleteModal = ref(false)
const selectedAbsence = ref<AbsenceDTO | null>(null)
const isApproving = ref(true)

// Context menu
const contextMenu = useContextMenu<AbsenceDTO>()
const contextMenuRef = ref<InstanceType<typeof ContextMenuPopover> | null>(null)

watch(() => contextMenuRef.value?.menuElement, (el) => {
  contextMenu.menuRef.value = el ?? null
})

const canEdit = (absence: AbsenceDTO) => absence.status !== 'APPROVED'

const handleContextAction = (absence: AbsenceDTO, action: string) => {
  switch (action) {
    case 'approve':
      openValidateModal(absence, true)
      break
    case 'reject':
      openValidateModal(absence, false)
      break
    case 'edit':
      openEditModal(absence)
      break
    case 'details':
      openDetailModal(absence)
      break
    case 'delete':
      openDeleteModal(absence)
      break
  }
}

// Colonnes du tableau
const tableColumns = computed<TableColumnDef[]>(() => [
  { key: 'userName', label: `Absences (${pagination.value.totalElements})`, sortable: true },
  { key: 'typeName', label: 'Type', sortable: true },
  { key: 'startDate', label: 'Période', sortable: true },
  { key: 'status', label: 'Statut', sortable: true },
  { key: 'createdAt', label: 'Demandé le', sortable: true },
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
    key: 'status',
    label: 'Statut',
    type: 'select',
    placeholder: 'Tous les statuts',
    options: [
      { value: 'PENDING', label: 'En attente' },
      { value: 'APPROVED', label: 'Approuvées' },
      { value: 'REJECTED', label: 'Refusées' }
    ]
  },
  {
    key: 'absenceTypeUuid',
    label: "Type d'absence",
    type: 'select',
    placeholder: 'Tous les types',
    options: absenceTypes.value
      .filter(type => type.uuid && type.name)
      .map(type => ({
        value: type.uuid!,
        label: type.name!
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
  // Handle nested properties for sorting
  if (key === 'userName') {
    return `${item.user?.firstName || ''} ${item.user?.lastName || ''}`.trim()
  }
  if (key === 'typeName') {
    return item.absenceType?.name || item.customType || ''
  }
  return key.split('.').reduce((obj: any, k: string) => obj?.[k], item)
}

const sortedData = computed(() => {
  if (!sortKey.value) return absences.value

  return [...absences.value].sort((a, b) => {
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

// Badge variant/class pour le statut
const getStatusVariant = (status?: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'REJECTED': return 'destructive'
    case 'CANCELLED': return 'secondary'
    default: return 'outline'
  }
}

const getStatusClasses = (status?: string): string => {
  switch (status) {
    case 'PENDING': return 'border-amber-500/50 text-amber-600 dark:text-amber-400'
    case 'APPROVED': return 'border-green-500/50 text-green-600 dark:text-green-400'
    default: return ''
  }
}

// Chargement des données
const loadAbsences = async (page = 0, isInitialLoad = false) => {
  try {
    if (isInitialLoad) {
      loading.value = true
    } else {
      searchLoading.value = true
    }
    error.value = ''

    const apiFilters: AbsenceSearchParams = {
      page,
      size: 20,
      sortBy: 'createdAt',
      sortDirection: 'desc'
    }

    const startDate = searchFilters.value.startDate as string
    const endDate = searchFilters.value.endDate as string
    const status = searchFilters.value.status as string
    const absenceTypeUuid = searchFilters.value.absenceTypeUuid as string
    const userUuid = searchFilters.value.userUuid as string

    if (startDate) apiFilters.startDate = startDate
    if (endDate) apiFilters.endDate = endDate
    if (status) apiFilters.status = status as AbsenceStatus
    if (absenceTypeUuid) apiFilters.absenceTypeUuid = absenceTypeUuid
    if (userUuid) apiFilters.userUuid = userUuid

    const response: AbsenceListResponse = await absencesService.searchAbsences(apiFilters)

    absences.value = response.absences || []
    pagination.value = {
      currentPage: response.currentPage || 0,
      totalPages: response.totalPages || 1,
      totalElements: response.totalElements || 0
    }
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Erreur lors du chargement des absences'
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

const loadAbsenceTypes = async () => {
  try {
    const response: AbsenceTypeListResponse = await absenceTypesService.getAbsenceTypes()
    absenceTypes.value = response.types || []
  } catch (err) {
    console.error("Erreur lors du chargement des types d'absence:", err)
  }
}

// Filtres
const applyFilters = () => {
  loadAbsences(0)
}

const resetFilters = () => {
  searchFilters.value = {
    status: '',
    absenceTypeUuid: '',
    userUuid: '',
    startDate: '',
    endDate: ''
  }
  loadAbsences(0)
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

const getStatusText = (status?: string): string => {
  switch (status) {
    case 'PENDING': return 'En attente'
    case 'APPROVED': return 'Approuvée'
    case 'REJECTED': return 'Refusée'
    case 'CANCELLED': return 'Annulée'
    default: return 'Inconnu'
  }
}

// Modals
const openCreateModal = () => {
  showCreateModal.value = true
}

const openEditModal = (absence: AbsenceDTO) => {
  selectedAbsence.value = absence
  showEditModal.value = true
}

const closeEditModal = () => {
  showEditModal.value = false
  selectedAbsence.value = null
}

const openDetailModal = (absence: AbsenceDTO) => {
  selectedAbsence.value = absence
  showDetailModal.value = true
}

const closeDetailModal = () => {
  showDetailModal.value = false
  if (!showValidateModal.value) {
    selectedAbsence.value = null
  }
}

const openValidateModal = (absence: AbsenceDTO, approve: boolean) => {
  selectedAbsence.value = absence
  isApproving.value = approve
  showValidateModal.value = true
}

const closeValidateModal = () => {
  showValidateModal.value = false
  if (!showDetailModal.value) {
    selectedAbsence.value = null
  }
}

const openDeleteModal = (absence: AbsenceDTO) => {
  selectedAbsence.value = absence
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  selectedAbsence.value = null
}

// Handlers des modals de détail
const handleApproveFromDetail = (absence: AbsenceDTO) => {
  showDetailModal.value = false
  openValidateModal(absence, true)
}

const handleRejectFromDetail = (absence: AbsenceDTO) => {
  showDetailModal.value = false
  openValidateModal(absence, false)
}

const handleEditFromDetail = (absence: AbsenceDTO) => {
  showDetailModal.value = false
  openEditModal(absence)
}

// Actions
const handleAbsenceSaved = () => {
  loadAbsences(pagination.value.currentPage)
}

const handleValidated = () => {
  loadAbsences(pagination.value.currentPage)
}

const handleDelete = async () => {
  if (!selectedAbsence.value?.uuid) return

  try {
    await absencesService.deleteAbsence(selectedAbsence.value.uuid)
    messages.success('Absence supprimée avec succès', 'Succès')
    closeDeleteModal()
    loadAbsences(pagination.value.currentPage)
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

  loadAbsences(0, true) // isInitialLoad = true
  loadUsers()
  loadAbsenceTypes()
})

// Watch pour les changements de query params
watch(() => route.query.userUuid, (newUserUuid) => {
  if (newUserUuid) {
    searchFilters.value.userUuid = newUserUuid as string
    loadAbsences(0)
  }
})
</script>
