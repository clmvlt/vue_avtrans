<template>
  <div class="min-h-screen bg-background">
    <main class="px-6 py-6">
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
          <!-- Action bar -->
          <div class="flex justify-end">
            <Button variant="default" size="sm" @click="openCreateModal">
              <Plus class="size-4" />
              Nouvelle demande
            </Button>
          </div>

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
          <div v-if="acomptes.length === 0" class="flex flex-col items-center gap-4 py-12 text-center">
            <Banknote class="size-16 opacity-50 text-muted-foreground" />
            <p class="text-muted-foreground">Vous n'avez pas encore de demande d'acompte</p>
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
                  <!-- Montant -->
                  <TableCell>
                    <span class="font-semibold text-green-600 dark:text-green-400">{{ formatMontant(item.montant) }}</span>
                  </TableCell>

                  <!-- Raison -->
                  <TableCell>
                    <span v-if="item.raison" class="text-sm text-foreground">{{ item.raison }}</span>
                    <span v-else class="text-sm text-muted-foreground">-</span>
                  </TableCell>

                  <!-- Status -->
                  <TableCell>
                    <Badge :variant="getStatusVariant(item.status)" :class="getStatusClasses(item.status)">
                      {{ getStatusText(item.status) }}
                    </Badge>
                  </TableCell>

                  <!-- Paiement -->
                  <TableCell>
                    <Badge
                      v-if="item.status === 'APPROVED'"
                      :variant="'outline'"
                      :class="item.isPaid ? 'border-green-500/50 text-green-600 dark:text-green-400' : 'border-amber-500/50 text-amber-600 dark:text-amber-400'"
                    >
                      {{ item.isPaid ? 'Payé' : 'Non payé' }}
                    </Badge>
                    <span v-else class="text-sm text-muted-foreground">-</span>
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
                      <Banknote class="size-10 opacity-50" />
                      <p>Aucune demande trouvée</p>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <!-- Mobile Cards -->
          <div v-if="acomptes.length > 0" class="flex flex-col gap-3 md:hidden">
            <div class="mb-1">
              <span class="text-sm font-medium text-muted-foreground">{{ pagination.totalElements }} demande{{ pagination.totalElements > 1 ? 's' : '' }}</span>
            </div>
            <div
              v-for="acompte in sortedData"
              :key="acompte.uuid"
              class="rounded-lg border bg-card p-4 shadow-sm transition-colors hover:border-primary cursor-pointer"
              @click="openDetailModal(acompte)"
            >
              <div class="flex items-start justify-between gap-2 mb-3">
                <span class="text-lg font-semibold text-green-600 dark:text-green-400">{{ formatMontant(acompte.montant) }}</span>
                <Badge :variant="getStatusVariant(acompte.status)" :class="getStatusClasses(acompte.status)">
                  {{ getStatusText(acompte.status) }}
                </Badge>
              </div>

              <div class="flex flex-col gap-3">
                <div v-if="acompte.raison" class="text-sm text-muted-foreground">
                  <span class="text-muted-foreground">Raison:</span>
                  <span class="ml-1">{{ acompte.raison }}</span>
                </div>

                <div class="flex items-start gap-3">
                  <Calendar class="size-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div class="flex flex-col gap-1">
                    <span class="text-xs text-muted-foreground">Demandé le {{ formatDateCompact(acompte.createdAt) }}</span>
                  </div>
                </div>

                <div v-if="acompte.status === 'APPROVED'" class="flex items-center gap-2">
                  <Badge
                    :variant="'outline'"
                    :class="acompte.isPaid ? 'border-green-500/50 text-green-600 dark:text-green-400' : 'border-amber-500/50 text-amber-600 dark:text-amber-400'"
                  >
                    {{ acompte.isPaid ? 'Payé' : 'Non payé' }}
                  </Badge>
                  <span v-if="acompte.isPaid && acompte.paidDate" class="text-xs text-muted-foreground">
                    le {{ formatDateCompact(acompte.paidDate) }}
                  </span>
                </div>

                <div v-if="acompte.validatedBy && acompte.status !== 'PENDING'" class="text-xs text-muted-foreground">
                  Traité par {{ acompte.validatedBy.firstName }} {{ acompte.validatedBy.lastName }}
                </div>

                <div v-if="acompte.rejectionReason" class="rounded-lg border-l-4 border-destructive bg-destructive/10 p-2 text-xs text-destructive">
                  {{ acompte.rejectionReason }}
                </div>
              </div>

              <div class="flex items-center justify-between border-t pt-3 mt-3">
                <span class="text-xs text-muted-foreground">{{ formatDateTime(acompte.createdAt) }}</span>
                <div class="flex items-center gap-2">
                  <Button
                    v-if="acompte.status === 'PENDING'"
                    size="sm"
                    variant="destructive"
                    @click.stop="openCancelModal(acompte)"
                  >
                    Annuler
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    @click.stop="openDetailModal(acompte)"
                  >
                    <ChevronRight class="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <!-- Pagination -->
          <div v-if="pagination.totalPages > 1" class="flex items-center justify-center gap-4 pt-4">
            <Button variant="outline" size="sm" :disabled="pagination.currentPage === 0" @click="loadAcomptes(pagination.currentPage - 1)">
              <ChevronLeft class="size-4" />
              Précédent
            </Button>
            <span class="text-sm text-muted-foreground">
              Page {{ pagination.currentPage + 1 }} sur {{ pagination.totalPages }}
            </span>
            <Button variant="outline" size="sm" :disabled="pagination.currentPage >= pagination.totalPages - 1" @click="loadAcomptes(pagination.currentPage + 1)">
              Suivant
              <ChevronRight class="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </main>

    <!-- Modal de création -->
    <MyAcompteEditModal
      v-model="showCreateModal"
      @saved="handleAcompteSaved"
      @close="showCreateModal = false"
    />

    <!-- Modal de détails -->
    <MyAcompteDetailModal
      v-model="showDetailModal"
      :acompte="selectedAcompte"
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

        <div v-if="selectedAcompte" class="space-y-3 rounded-lg border bg-muted/50 p-4">
          <div class="flex justify-between text-sm">
            <span class="text-muted-foreground">Montant</span>
            <span class="font-medium">{{ formatMontant(selectedAcompte.montant) }}</span>
          </div>
          <div v-if="selectedAcompte.raison" class="flex justify-between text-sm">
            <span class="text-muted-foreground">Raison</span>
            <span class="font-medium">{{ selectedAcompte.raison }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-muted-foreground">Demandé le</span>
            <span class="font-medium">{{ formatDateCompact(selectedAcompte.createdAt) }}</span>
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
import { acomptesService } from '@/services'
import type { AcompteDTO } from '@/models'
import type { AcompteSearchParams } from '@/services/acomptes'
import { useMessages } from '@/composables/useMessages'

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
  Banknote,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from 'lucide-vue-next'

// Custom components
import MyAcompteEditModal from '@/components/myacomptes/MyAcompteEditModal.vue'
import MyAcompteDetailModal from '@/components/myacomptes/MyAcompteDetailModal.vue'

interface TableColumnDef {
  key: string
  label: string
  sortable?: boolean
  align?: 'left' | 'center' | 'right'
}

const messages = useMessages()

// Données
const acomptes = ref<AcompteDTO[]>([])

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
  montantMin: '',
  montantMax: '',
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
      'APPROVED': 'Approuvés',
      'REJECTED': 'Refusés',
      'CANCELLED': 'Annulés'
    }
    parts.push(statusLabels[status] || status)
  }

  // Montants
  const montantMin = searchFilters.value.montantMin as string
  const montantMax = searchFilters.value.montantMax as string
  if (montantMin && montantMax) {
    parts.push(`${montantMin}€ - ${montantMax}€`)
  } else if (montantMin) {
    parts.push(`≥ ${montantMin}€`)
  } else if (montantMax) {
    parts.push(`≤ ${montantMax}€`)
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

  return parts.length > 0 ? parts.join(' · ') : 'Toutes vos demandes d\'acompte'
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
const selectedAcompte = ref<AcompteDTO | null>(null)

// Colonnes du tableau
const tableColumns = computed<TableColumnDef[]>(() => [
  { key: 'montant', label: `Demandes (${pagination.value.totalElements})`, sortable: true },
  { key: 'raison', label: 'Raison', sortable: false },
  { key: 'status', label: 'Statut', sortable: true },
  { key: 'isPaid', label: 'Paiement', sortable: false },
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
      { value: 'APPROVED', label: 'Approuvés' },
      { value: 'REJECTED', label: 'Refusés' },
      { value: 'CANCELLED', label: 'Annulés' }
    ]
  },
  {
    key: 'montantMin',
    label: 'Montant min (€)',
    type: 'number',
    placeholder: 'Min',
    min: 0
  },
  {
    key: 'montantMax',
    label: 'Montant max (€)',
    type: 'number',
    placeholder: 'Max',
    min: 0
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
  return key.split('.').reduce((obj: any, k: string) => obj?.[k], item)
}

const sortedData = computed(() => {
  if (!sortKey.value) return acomptes.value

  return [...acomptes.value].sort((a, b) => {
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

const getStatusText = (status?: string): string => {
  switch (status) {
    case 'PENDING': return 'En attente'
    case 'APPROVED': return 'Approuvé'
    case 'REJECTED': return 'Refusé'
    case 'CANCELLED': return 'Annulé'
    default: return 'Inconnu'
  }
}

// Chargement des données
const loadAcomptes = async (page = 0, isInitialLoad = false) => {
  try {
    if (isInitialLoad) {
      loading.value = true
    } else {
      searchLoading.value = true
    }
    error.value = ''

    const apiFilters: AcompteSearchParams = {
      page,
      size: 20,
      sortBy: 'createdAt',
      sortDirection: 'DESC'
    }

    const startDate = searchFilters.value.startDate as string
    const endDate = searchFilters.value.endDate as string
    const status = searchFilters.value.status as string
    const montantMin = searchFilters.value.montantMin as string
    const montantMax = searchFilters.value.montantMax as string

    if (startDate) apiFilters.startDate = startDate
    if (endDate) apiFilters.endDate = endDate
    if (status) apiFilters.status = status as 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'PAID'
    if (montantMin) apiFilters.montantMin = parseFloat(montantMin)
    if (montantMax) apiFilters.montantMax = parseFloat(montantMax)

    const response = await acomptesService.getAcomptes(apiFilters)

    acomptes.value = response.acomptes || []
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

// Filtres
const applyFilters = () => {
  loadAcomptes(0)
}

const resetFilters = () => {
  searchFilters.value = {
    status: '',
    montantMin: '',
    montantMax: '',
    startDate: '',
    endDate: ''
  }
  loadAcomptes(0)
}

// Helpers de formatage
const formatMontant = (montant?: number): string => {
  if (montant === null || montant === undefined) return '0 €'
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(montant)
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

// Modals
const openCreateModal = () => {
  showCreateModal.value = true
}

const openDetailModal = (acompte: AcompteDTO) => {
  selectedAcompte.value = acompte
  showDetailModal.value = true
}

const closeDetailModal = () => {
  showDetailModal.value = false
  if (!showCancelModal.value) {
    selectedAcompte.value = null
  }
}

const openCancelModal = (acompte: AcompteDTO) => {
  selectedAcompte.value = acompte
  showCancelModal.value = true
}

const openCancelFromDetail = (acompte: AcompteDTO) => {
  showDetailModal.value = false
  openCancelModal(acompte)
}

const closeCancelModal = () => {
  showCancelModal.value = false
  if (!showDetailModal.value) {
    selectedAcompte.value = null
  }
}

// Actions
const handleAcompteSaved = () => {
  loadAcomptes(0)
}

const handleCancel = async () => {
  if (!selectedAcompte.value?.uuid) return

  try {
    cancelling.value = true
    await acomptesService.cancelAcompte(selectedAcompte.value.uuid)
    messages.success('Demande annulée avec succès')
    closeCancelModal()
    loadAcomptes(pagination.value.currentPage)
  } catch (err: unknown) {
    messages.error(err instanceof Error ? err.message : "Erreur lors de l'annulation", 'Erreur')
  } finally {
    cancelling.value = false
  }
}

// Lifecycle
onMounted(() => {
  loadAcomptes(0, true)
})
</script>
