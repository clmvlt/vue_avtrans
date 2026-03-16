<template>
  <div class="min-h-screen bg-background">
    <!-- Header -->
    <header class="sticky top-0 z-40 border-b bg-background">
      <div class="mx-auto flex max-w-[1400px] items-center gap-4 px-4 py-3 sm:px-6 sm:py-4">
        <Retour fallback="/" />
        <h1 class="text-lg font-bold text-foreground sm:text-xl">Mes absences</h1>
        <div class="ml-auto">
          <Button variant="default" size="sm" class="sm:hidden" @click="openCreateModal">
            <Plus class="size-4" />
          </Button>
          <Button variant="default" size="sm" class="hidden sm:inline-flex" @click="openCreateModal">
            <Plus class="size-4" />
            Nouvelle demande
          </Button>
        </div>
      </div>
    </header>

    <main class="px-4 py-4 sm:px-6 sm:py-6">
      <div class="mx-auto max-w-[1400px]">
        <!-- Loading -->
        <div v-if="loading" class="flex flex-col items-center justify-center gap-4 py-16">
          <LoaderCircle class="size-10 animate-spin text-primary" />
          <p class="text-lg text-muted-foreground">Chargement...</p>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="mb-4 rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
          {{ error }}
        </div>

        <!-- Content -->
        <div v-else class="space-y-4">
          <!-- Filtres -->
          <SearchFilters
            ref="searchFiltersRef"
            v-model="searchFilters"
            :filters="filterConfig"
            :loading="searchLoading"
            :columns="4"
            :hint="activeFiltersText"
            @search="applyFilters"
            @reset="resetFilters"
          />

          <!-- Empty state -->
          <div v-if="absences.length === 0" class="flex flex-col items-center gap-5 rounded-lg border border-dashed py-16 text-center">
            <div class="flex size-16 items-center justify-center rounded-full bg-muted">
              <CalendarX class="size-8 text-muted-foreground" />
            </div>
            <div class="space-y-1">
              <p class="font-medium text-foreground">Aucune demande d'absence</p>
              <p class="text-sm text-muted-foreground">Commencez par créer votre première demande</p>
            </div>
            <Button variant="default" size="sm" @click="openCreateModal">
              <Plus class="size-4" />
              Faire une demande
            </Button>
          </div>

          <!-- Desktop Table -->
          <div v-else class="hidden md:block overflow-hidden rounded-lg border shadow-sm">
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
                    <Badge :variant="getStatusVariant(item.status)" :class="getStatusClasses(item.status)">
                      {{ getStatusText(item.status) }}
                    </Badge>
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
                        v-if="item.status === 'PENDING'"
                        size="sm"
                        variant="destructive"
                        @click.stop="openCancelModal(item)"
                        title="Annuler"
                      >
                        Annuler
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>

                <!-- Empty state (shouldn't show due to outer v-else, but kept for consistency) -->
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

          <!-- Mobile Cards -->
          <div v-if="absences.length > 0" class="flex flex-col gap-3 md:hidden">
            <div class="mb-1">
              <span class="text-sm font-medium text-muted-foreground">{{ pagination.totalElements }} demande{{ pagination.totalElements > 1 ? 's' : '' }}</span>
            </div>
            <div
              v-for="absence in sortedData"
              :key="absence.uuid"
              class="overflow-hidden rounded-lg border bg-card shadow-sm transition-colors active:bg-accent/50"
              :class="getCardBorderClass(absence.status)"
              @click="openDetailModal(absence)"
            >
              <div class="p-4">
                <!-- Top: type + status -->
                <div class="flex items-center justify-between gap-2">
                  <Badge
                    v-if="absence.absenceType"
                    variant="outline"
                    :style="{
                      backgroundColor: absence.absenceType.color + '20',
                      color: absence.absenceType.color,
                      borderColor: absence.absenceType.color
                    }"
                  >
                    {{ absence.absenceType.name }}
                  </Badge>
                  <Badge v-else-if="absence.customType" variant="secondary">
                    {{ absence.customType }}
                  </Badge>
                  <Badge :variant="getStatusVariant(absence.status)" :class="getStatusClasses(absence.status)">
                    {{ getStatusText(absence.status) }}
                  </Badge>
                </div>

                <!-- Dates -->
                <div class="mt-3 flex items-center gap-2.5">
                  <Calendar class="size-4 shrink-0 text-muted-foreground" />
                  <span class="text-sm font-medium text-foreground">
                    {{ formatDateCompact(absence.startDate) }}
                    <span v-if="absence.startDate !== absence.endDate">
                      → {{ formatDateCompact(absence.endDate) }}
                    </span>
                  </span>
                  <span class="text-xs text-muted-foreground">
                    ({{ calculateAbsenceDuration(absence.startDate, absence.endDate, absence.period) }}<template v-if="isHalfDay(absence.period)"> · {{ getPeriodLabel(absence.period) }}</template>)
                  </span>
                </div>

                <!-- Reason (truncated) -->
                <p v-if="absence.reason" class="mt-2 line-clamp-2 text-sm text-muted-foreground">
                  {{ absence.reason }}
                </p>
              </div>

              <!-- Footer -->
              <div class="flex items-center justify-between border-t bg-muted/30 px-4 py-2.5">
                <span class="text-xs text-muted-foreground">{{ formatDateCompact(absence.createdAt) }}</span>
                <div class="flex items-center gap-2">
                  <Button
                    v-if="absence.status === 'PENDING'"
                    size="sm"
                    variant="destructive"
                    class="h-8 text-xs"
                    @click.stop="openCancelModal(absence)"
                  >
                    Annuler
                  </Button>
                  <ChevronRight class="size-4 text-muted-foreground" />
                </div>
              </div>
            </div>
          </div>

          <!-- Pagination -->
          <div v-if="pagination.totalPages > 1" class="flex items-center justify-center gap-2 pt-4 sm:gap-4">
            <Button variant="outline" size="sm" class="h-9 w-9 p-0 sm:h-auto sm:w-auto sm:px-3 sm:py-1.5" :disabled="pagination.currentPage === 0" @click="loadAbsences(pagination.currentPage - 1)">
              <ChevronLeft class="size-4" />
              <span class="hidden sm:inline">Précédent</span>
            </Button>
            <span class="text-sm text-muted-foreground">
              {{ pagination.currentPage + 1 }} / {{ pagination.totalPages }}
            </span>
            <Button variant="outline" size="sm" class="h-9 w-9 p-0 sm:h-auto sm:w-auto sm:px-3 sm:py-1.5" :disabled="pagination.currentPage >= pagination.totalPages - 1" @click="loadAbsences(pagination.currentPage + 1)">
              <span class="hidden sm:inline">Suivant</span>
              <ChevronRight class="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </main>

    <!-- Modal de création -->
    <MyAbsenceEditModal
      v-model="showCreateModal"
      @saved="handleAbsenceSaved"
      @close="showCreateModal = false"
    />

    <!-- Modal de détails -->
    <MyAbsenceDetailModal
      v-model="showDetailModal"
      :absence="selectedAbsence"
      @close="closeDetailModal"
      @cancel="openCancelFromDetail"
    />

    <!-- Modal d'annulation -->
    <Dialog v-model:open="showCancelModal">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Annuler la demande</DialogTitle>
          <DialogDescription>Cette action est irréversible.</DialogDescription>
        </DialogHeader>

        <div v-if="selectedAbsence" class="space-y-3 rounded-lg border bg-muted/50 p-4">
          <div class="flex justify-between text-sm">
            <span class="text-muted-foreground">Type</span>
            <span class="font-medium">
              {{ selectedAbsence.absenceType?.name || selectedAbsence.customType || '-' }}
            </span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-muted-foreground">Période</span>
            <span class="font-medium">
              {{ formatDateCompact(selectedAbsence.startDate) }}
              <span v-if="selectedAbsence.startDate !== selectedAbsence.endDate">
                → {{ formatDateCompact(selectedAbsence.endDate) }}
              </span>
            </span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-muted-foreground">Durée</span>
            <span class="font-medium">{{ calculateAbsenceDuration(selectedAbsence.startDate, selectedAbsence.endDate, selectedAbsence.period) }}</span>
          </div>
          <div v-if="isHalfDay(selectedAbsence.period)" class="flex justify-between text-sm">
            <span class="text-muted-foreground">Période</span>
            <span class="font-medium">{{ getPeriodLabel(selectedAbsence.period) }}</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="closeCancelModal">Retour</Button>
          <Button variant="destructive" :disabled="cancelling" @click="handleCancel">
            <LoaderCircle v-if="cancelling" class="size-4 animate-spin" />
            Confirmer l'annulation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { absencesService, absenceTypesService } from '@/services'
import type { AbsenceDTO, AbsenceTypeDTO } from '@/models'
import type { AbsenceSearchParams, AbsenceStatus, AbsenceListResponse } from '@/services/absences'
import type { AbsenceTypeListResponse } from '@/services/absenceTypes'
import { useMessages } from '@/composables/useMessages'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import SearchFilters, { type FilterConfig } from '@/components/ui/search-filters/SearchFilters.vue'

// Lucide icons
import {
  Plus,
  LoaderCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CalendarX,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from 'lucide-vue-next'

// Legacy components (kept per project rules)
import { Retour } from '@/components/ui/retour'

// Custom components
import MyAbsenceEditModal from '@/components/myabsences/MyAbsenceEditModal.vue'
import MyAbsenceDetailModal from '@/components/myabsences/MyAbsenceDetailModal.vue'

interface TableColumnDef {
  key: string
  label: string
  sortable?: boolean
  align?: 'left' | 'center' | 'right'
}

const messages = useMessages()

// Données
const absences = ref<AbsenceDTO[]>([])
const absenceTypes = ref<AbsenceTypeDTO[]>([])

// États
const loading = ref(true)
const searchLoading = ref(false)
const error = ref('')
const cancelling = ref(false)

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
  startDate: '',
  endDate: ''
})

// Sort state
const sortKey = ref<string | null>(null)
const sortDirection = ref<'asc' | 'desc'>('asc')

// Texte descriptif des filtres actifs
const activeFiltersText = computed(() => {
  const parts: string[] = []

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

  return parts.length > 0 ? parts.join(' · ') : 'Toutes vos demandes d\'absence'
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
const showCancelModal = ref(false)
const selectedAbsence = ref<AbsenceDTO | null>(null)

// Colonnes du tableau
const tableColumns = computed<TableColumnDef[]>(() => [
  { key: 'typeName', label: `Demandes (${pagination.value.totalElements})`, sortable: true },
  { key: 'startDate', label: 'Période', sortable: true },
  { key: 'status', label: 'Statut', sortable: true },
  { key: 'createdAt', label: 'Demandé le', sortable: true },
  { key: 'actions', label: 'Actions', align: 'right' }
])

// Configuration des filtres
const filterConfig = computed<FilterConfig[]>(() => [
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

const getCardBorderClass = (_status?: string): string => {
  return ''
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

    if (startDate) apiFilters.startDate = startDate
    if (endDate) apiFilters.endDate = endDate
    if (status) apiFilters.status = status as AbsenceStatus
    if (absenceTypeUuid) apiFilters.absenceTypeUuid = absenceTypeUuid

    const response: AbsenceListResponse = await absencesService.getAbsences(apiFilters)

    absences.value = response.absences || []
    pagination.value = {
      currentPage: response.currentPage || 0,
      totalPages: response.totalPages || 1,
      totalElements: response.totalElements || 0
    }
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Erreur lors du chargement'
    messages.error(error.value, 'Erreur')
  } finally {
    loading.value = false
    searchLoading.value = false
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
    startDate: '',
    endDate: ''
  }
  loadAbsences(0)
}

// Helpers de formatage
const formatDate = (dateString?: string | Date): string => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

const formatDateCompact = (dateString?: string | Date): string => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short'
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

const openDetailModal = (absence: AbsenceDTO) => {
  selectedAbsence.value = absence
  showDetailModal.value = true
}

const closeDetailModal = () => {
  showDetailModal.value = false
  if (!showCancelModal.value) {
    selectedAbsence.value = null
  }
}

const openCancelModal = (absence: AbsenceDTO) => {
  selectedAbsence.value = absence
  showCancelModal.value = true
}

const openCancelFromDetail = (absence: AbsenceDTO) => {
  showDetailModal.value = false
  openCancelModal(absence)
}

const closeCancelModal = () => {
  showCancelModal.value = false
  if (!showDetailModal.value) {
    selectedAbsence.value = null
  }
}

// Actions
const handleAbsenceSaved = () => {
  loadAbsences(0)
}

const handleCancel = async () => {
  if (!selectedAbsence.value?.uuid) return

  try {
    cancelling.value = true
    await absencesService.cancelAbsence(selectedAbsence.value.uuid)
    messages.success('Demande annulée avec succès')
    closeCancelModal()
    loadAbsences(pagination.value.currentPage)
  } catch (err: unknown) {
    messages.error(err instanceof Error ? err.message : "Erreur lors de l'annulation", 'Erreur')
  } finally {
    cancelling.value = false
  }
}

// Lifecycle
onMounted(() => {
  loadAbsences(0, true)
  loadAbsenceTypes()
})
</script>
