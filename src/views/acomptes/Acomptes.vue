<template>
  <div class="min-h-screen bg-background" @click="contextMenu.close">
    <main class="px-4 py-4 md:px-6 md:py-6">
      <div class="mx-auto max-w-[1400px]">
        <!-- Loading -->
        <div v-if="loading" class="flex flex-col items-center justify-center gap-4 py-16">
          <LoaderCircle class="size-10 animate-spin text-primary" />
          <p class="text-lg text-muted-foreground">Chargement des acomptes...</p>
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
              Nouvel acompte
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
            <p class="text-sm text-muted-foreground">{{ pagination.totalElements }} acompte(s)</p>

            <!-- Empty state mobile -->
            <div v-if="sortedData.length === 0" class="flex flex-col items-center gap-3 py-12 text-muted-foreground">
              <Banknote class="size-10 opacity-50" />
              <p>Aucun acompte trouvé</p>
            </div>

            <!-- Acompte Cards -->
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
                    <span class="text-lg font-bold text-green-600 dark:text-green-400">{{ formatMontant(item.montant) }}</span>
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
                    <DropdownMenuItem v-if="item.status === 'APPROVED'" @click="togglePaymentStatus(item)">
                      <Wallet class="mr-2 size-4" />
                      {{ item.isPaid ? 'Non payé' : 'Marquer payé' }}
                    </DropdownMenuItem>
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

              <!-- Badges row -->
              <div class="mt-3 flex flex-wrap items-center gap-2">
                <Badge :variant="getStatusVariant(item.status)" :class="getStatusClasses(item.status)">
                  {{ getStatusText(item.status) }}
                </Badge>
                <Badge
                  :variant="item.isPaid ? 'outline' : 'outline'"
                  :class="item.isPaid ? 'border-green-500/50 text-green-600 dark:text-green-400' : 'border-amber-500/50 text-amber-600 dark:text-amber-400'"
                >
                  {{ item.isPaid ? 'Payé' : 'Non payé' }}
                </Badge>
              </div>

              <!-- Raison + date -->
              <div class="mt-2 text-sm">
                <p v-if="item.raison" class="text-muted-foreground line-clamp-2">{{ item.raison }}</p>
                <p class="mt-1 text-xs text-muted-foreground">{{ formatDateTime(item.createdAt) }}</p>
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

                  <!-- Montant -->
                  <TableCell>
                    <span class="font-semibold text-green-600 dark:text-green-400">{{ formatMontant(item.montant) }}</span>
                  </TableCell>

                  <!-- Raison -->
                  <TableCell>
                    <span class="text-sm text-muted-foreground">{{ item.raison || '-' }}</span>
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

                  <!-- Payment -->
                  <TableCell>
                    <div class="flex flex-col items-start gap-1">
                      <Badge
                        :variant="item.isPaid ? 'outline' : 'outline'"
                        :class="item.isPaid ? 'border-green-500/50 text-green-600 dark:text-green-400' : 'border-amber-500/50 text-amber-600 dark:text-amber-400'"
                      >
                        {{ item.isPaid ? 'Payé' : 'Non payé' }}
                      </Badge>
                      <span v-if="item.isPaid && item.paidDate" class="text-xs italic text-muted-foreground">
                        {{ formatDateTime(item.paidDate) }}
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
                        v-if="item.status === 'APPROVED'"
                        size="sm"
                        :variant="item.isPaid ? 'outline' : 'default'"
                        @click.stop="togglePaymentStatus(item)"
                        :title="item.isPaid ? 'Marquer comme non payé' : 'Marquer comme payé'"
                      >
                        {{ item.isPaid ? 'Non payé' : 'Payé' }}
                      </Button>
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
                      <Banknote class="size-10 opacity-50" />
                      <p>Aucun acompte trouvé</p>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
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
    <AcompteEditModal
      v-model="showCreateModal"
      @saved="handleAcompteSaved"
      @close="showCreateModal = false"
    />

    <!-- Modal de détails -->
    <AcompteDetailModal
      v-model="showDetailModal"
      :acompte="selectedAcompte"
      @close="closeDetailModal"
      @approve="handleApproveFromDetail"
      @reject="handleRejectFromDetail"
    />

    <!-- Modal de validation -->
    <AcompteValidateModal
      v-model="showValidateModal"
      :acompte="selectedAcompte"
      :is-approving="isApproving"
      @validated="handleValidated"
      @close="closeValidateModal"
    />

    <!-- Modal de suppression -->
    <AcompteDeleteModal
      v-model="showDeleteModal"
      :acompte="selectedAcompte"
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
      <ContextMenuItem
        v-if="contextMenu.state.value.entity?.status === 'APPROVED'"
        @click="contextMenu.handleAction('togglePayment', handleContextAction)"
      >
        <template #icon><Wallet class="size-4" /></template>
        {{ contextMenu.state.value.entity?.isPaid ? 'Marquer non payé' : 'Marquer payé' }}
      </ContextMenuItem>
      <ContextMenuItem @click="contextMenu.handleAction('details', handleContextAction)">
        <template #icon><Eye class="size-4" /></template>
        Détails
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
import { acomptesService, usersService } from '@/services'
import type { AcompteDTO, UserDTO } from '@/models'
import type { AcompteSearchParams, AcompteStatus } from '@/services/acomptes'
import { useMessages } from '@/composables/useMessages'
import { useContextMenu } from '@/composables/useContextMenu'

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
  LoaderCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Banknote,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Check,
  X,
  Eye,
  Trash2,
  Wallet,
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
import AcompteEditModal from '@/components/acomptes/AcompteEditModal.vue'
import AcompteDetailModal from '@/components/acomptes/AcompteDetailModal.vue'
import AcompteValidateModal from '@/components/acomptes/AcompteValidateModal.vue'
import AcompteDeleteModal from '@/components/acomptes/AcompteDeleteModal.vue'

interface TableColumnDef {
  key: string
  label: string
  sortable?: boolean
  align?: 'left' | 'center' | 'right'
}

const route = useRoute()
const messages = useMessages()

// Données
const acomptes = ref<AcompteDTO[]>([])
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
  status: '',
  userUuid: '',
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
    parts.push(`> ${montantMin}€`)
  } else if (montantMax) {
    parts.push(`< ${montantMax}€`)
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
const showValidateModal = ref(false)
const showDeleteModal = ref(false)
const selectedAcompte = ref<AcompteDTO | null>(null)
const isApproving = ref(true)

// Context menu
const contextMenu = useContextMenu<AcompteDTO>()
const contextMenuRef = ref<InstanceType<typeof ContextMenuPopover> | null>(null)

watch(() => contextMenuRef.value?.menuElement, (el) => {
  contextMenu.menuRef.value = el ?? null
})

const handleContextAction = (acompte: AcompteDTO, action: string) => {
  switch (action) {
    case 'approve':
      openValidateModal(acompte, true)
      break
    case 'reject':
      openValidateModal(acompte, false)
      break
    case 'togglePayment':
      togglePaymentStatus(acompte)
      break
    case 'details':
      openDetailModal(acompte)
      break
    case 'delete':
      openDeleteModal(acompte)
      break
  }
}

// Colonnes du tableau
const tableColumns = computed<TableColumnDef[]>(() => [
  { key: 'userName', label: `Acomptes (${pagination.value.totalElements})`, sortable: true },
  { key: 'montant', label: 'Montant', sortable: true },
  { key: 'raison', label: 'Raison', sortable: true },
  { key: 'status', label: 'Statut', sortable: true },
  { key: 'payment', label: 'Paiement', sortable: true },
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
      { value: 'APPROVED', label: 'Approuvés' },
      { value: 'REJECTED', label: 'Refusés' },
      { value: 'CANCELLED', label: 'Annulés' }
    ]
  },
  {
    key: 'montantMin',
    label: 'Montant min',
    type: 'number',
    placeholder: 'Min €'
  },
  {
    key: 'montantMax',
    label: 'Montant max',
    type: 'number',
    placeholder: 'Max €'
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
  if (key === 'payment') {
    return item.isPaid ? 1 : 0
  }
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
    const userUuid = searchFilters.value.userUuid as string
    const montantMin = searchFilters.value.montantMin as string
    const montantMax = searchFilters.value.montantMax as string

    if (startDate) apiFilters.startDate = startDate
    if (endDate) apiFilters.endDate = endDate
    if (status) apiFilters.status = status as AcompteStatus
    if (userUuid) apiFilters.userUuid = userUuid
    if (montantMin) apiFilters.montantMin = parseFloat(montantMin)
    if (montantMax) apiFilters.montantMax = parseFloat(montantMax)

    const response = await acomptesService.searchAcomptes(apiFilters)

    acomptes.value = response.acomptes || []
    pagination.value = {
      currentPage: response.currentPage || 0,
      totalPages: response.totalPages || 1,
      totalElements: response.totalElements || 0
    }
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Erreur lors du chargement des acomptes'
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
  loadAcomptes(0)
}

const resetFilters = () => {
  searchFilters.value = {
    status: '',
    userUuid: '',
    montantMin: '',
    montantMax: '',
    startDate: '',
    endDate: ''
  }
  loadAcomptes(0)
}

// Helpers
const getInitials = (firstName?: string, lastName?: string): string => {
  const first = firstName ? firstName.charAt(0).toUpperCase() : ''
  const last = lastName ? lastName.charAt(0).toUpperCase() : ''
  return first + last || '?'
}

const formatMontant = (montant?: number): string => {
  if (montant === null || montant === undefined) return '0,00 €'
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(montant)
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
    case 'APPROVED': return 'Approuvé'
    case 'REJECTED': return 'Refusé'
    case 'CANCELLED': return 'Annulé'
    default: return 'Inconnu'
  }
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
  if (!showValidateModal.value) {
    selectedAcompte.value = null
  }
}

const openValidateModal = (acompte: AcompteDTO, approve: boolean) => {
  selectedAcompte.value = acompte
  isApproving.value = approve
  showValidateModal.value = true
}

const closeValidateModal = () => {
  showValidateModal.value = false
  if (!showDetailModal.value) {
    selectedAcompte.value = null
  }
}

const openDeleteModal = (acompte: AcompteDTO) => {
  selectedAcompte.value = acompte
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  selectedAcompte.value = null
}

// Handlers des modals de détail
const handleApproveFromDetail = (acompte: AcompteDTO) => {
  showDetailModal.value = false
  openValidateModal(acompte, true)
}

const handleRejectFromDetail = (acompte: AcompteDTO) => {
  showDetailModal.value = false
  openValidateModal(acompte, false)
}

// Actions
const handleAcompteSaved = () => {
  loadAcomptes(0)
}

const handleValidated = () => {
  loadAcomptes(pagination.value.currentPage)
}

const handleDelete = async () => {
  if (!selectedAcompte.value?.uuid) return

  try {
    await acomptesService.deleteAcompte(selectedAcompte.value.uuid)
    messages.success('Acompte supprimé avec succès', 'Succès')
    closeDeleteModal()
    loadAcomptes(pagination.value.currentPage)
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression'
    messages.error(errorMessage, 'Erreur')
  }
}

// Toggle payment status
const togglePaymentStatus = async (acompte: AcompteDTO) => {
  if (!acompte.uuid) return

  const newIsPaid = !acompte.isPaid
  const previousIsPaid = acompte.isPaid
  const previousPaidDate = acompte.paidDate

  // Mise à jour optimiste (UI instantanée)
  acompte.isPaid = newIsPaid
  acompte.paidDate = newIsPaid ? new Date().toISOString() : undefined

  try {
    await acomptesService.updateAcompte(acompte.uuid, {
      isPaid: newIsPaid
    })
  } catch (err: unknown) {
    // Rollback en cas d'erreur
    acompte.isPaid = previousIsPaid
    acompte.paidDate = previousPaidDate
    error.value = err instanceof Error ? err.message : 'Erreur lors de la mise à jour du statut de paiement'
    messages.error(error.value, 'Erreur')
  }
}

// Lifecycle
onMounted(() => {
  const userUuidFromQuery = route.query.userUuid as string
  if (userUuidFromQuery) {
    searchFilters.value.userUuid = userUuidFromQuery
  }

  loadAcomptes(0, true) // isInitialLoad = true
  loadUsers()
})

// Watch pour les changements de query params
watch(() => route.query.userUuid, (newUserUuid) => {
  if (newUserUuid) {
    searchFilters.value.userUuid = newUserUuid as string
    loadAcomptes(0)
  }
})
</script>
