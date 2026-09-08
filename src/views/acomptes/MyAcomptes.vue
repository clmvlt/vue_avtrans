<template>
  <div class="min-h-screen bg-background">
    <!-- Header -->
    <header class="sticky top-0 z-40 border-b bg-background">
      <div class="mx-auto flex max-w-[1100px] items-center gap-2 px-3 py-3 sm:gap-4 sm:px-6 sm:py-4">
        <Retour fallback="/" />
        <h1 class="flex-1 text-lg font-bold text-foreground sm:text-xl">Mes acomptes</h1>
        <Button variant="default" size="sm" aria-label="Nouvelle demande d'acompte" @click="openCreateModal">
          <Plus class="size-4" />
          <span class="max-sm:sr-only">Nouvelle demande</span>
        </Button>
      </div>
    </header>

    <main class="mx-auto max-w-[1100px] px-3 py-3 sm:px-6 sm:py-6">
      <!-- Barre de filtres : puces de statut + bouton Filtres -->
      <div class="flex items-center gap-2">
        <div
          class="flex flex-1 gap-2 overflow-x-auto py-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label="Filtrer par statut"
        >
          <button
            v-for="chip in statusChips"
            :key="chip.value"
            type="button"
            role="tab"
            class="shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors"
            :class="currentStatus === chip.value
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground'"
            :aria-selected="currentStatus === chip.value"
            :disabled="loading || searchLoading"
            @click="selectStatus(chip.value)"
          >
            {{ chip.label }}
          </button>
        </div>

        <Button
          :variant="activeFilterCount > 0 ? 'default' : 'outline'"
          size="sm"
          class="shrink-0"
          aria-label="Autres filtres"
          @click="showFilters = true"
        >
          <SlidersHorizontal class="size-4" />
          <span class="max-sm:sr-only">Filtres</span>
          <span
            v-if="activeFilterCount > 0"
            class="flex size-5 items-center justify-center rounded-full bg-background/20 text-[11px] font-bold"
          >
            {{ activeFilterCount }}
          </span>
        </Button>
      </div>

      <!-- Résumé des filtres + compteur -->
      <p class="mt-2 truncate text-xs text-muted-foreground">
        {{ activeFiltersText }}
        <template v-if="!loading && !error"> · {{ countLabel }}</template>
      </p>

      <!-- Loading (squelette des cartes) -->
      <div v-if="loading || searchLoading" class="mt-4 grid gap-3 lg:grid-cols-2">
        <Skeleton v-for="n in 4" :key="n" class="h-[84px] w-full rounded-xl" />
      </div>

      <!-- Error -->
      <div v-else-if="error" class="mt-4 rounded-xl border border-destructive bg-destructive/10 p-4 text-destructive">
        <p class="font-medium">{{ error }}</p>
        <Button variant="outline" size="sm" class="mt-3" @click="loadAcomptes(pagination.currentPage)">
          <RefreshCw class="size-4" />
          Réessayer
        </Button>
      </div>

      <!-- Empty state -->
      <div
        v-else-if="acomptes.length === 0"
        class="mt-4 flex flex-col items-center gap-4 rounded-2xl border border-dashed px-4 py-12 text-center"
      >
        <div class="flex size-14 items-center justify-center rounded-full bg-muted">
          <Banknote class="size-7 text-muted-foreground" />
        </div>
        <div class="space-y-1">
          <p class="font-medium text-foreground">
            {{ hasAnyFilter ? 'Aucune demande ne correspond' : 'Aucune demande d\'acompte' }}
          </p>
          <p class="text-sm text-muted-foreground">
            {{ hasAnyFilter ? 'Essayez d\'élargir vos filtres.' : 'Commencez par créer votre première demande.' }}
          </p>
        </div>
        <Button v-if="hasAnyFilter" variant="ghost" size="sm" @click="resetFilters">
          <RotateCcw class="size-4" />
          Réinitialiser les filtres
        </Button>
        <Button v-else variant="default" size="sm" @click="openCreateModal">
          <Plus class="size-4" />
          Faire une demande
        </Button>
      </div>

      <!-- Liste des demandes : 1 colonne sur mobile, 2 sur grand écran -->
      <template v-else>
        <div class="mt-4 grid gap-3 lg:grid-cols-2">
          <MyAcompteCard
            v-for="acompte in acomptes"
            :key="acompte.uuid"
            :acompte="acompte"
            @open="openDetailModal"
            @cancel="openCancelModal"
          />
        </div>

        <!-- Pagination -->
        <div
          v-if="pagination.totalPages > 1"
          class="mt-4 flex items-center justify-between gap-2 rounded-xl border bg-card px-3 py-2"
        >
          <Button
            variant="ghost"
            size="sm"
            :disabled="pagination.currentPage === 0"
            @click="loadAcomptes(pagination.currentPage - 1)"
          >
            <ChevronLeft class="size-4" />
            Précédent
          </Button>
          <span class="text-xs tabular-nums text-muted-foreground">
            Page {{ pagination.currentPage + 1 }} / {{ pagination.totalPages }}
          </span>
          <Button
            variant="ghost"
            size="sm"
            :disabled="pagination.currentPage >= pagination.totalPages - 1"
            @click="loadAcomptes(pagination.currentPage + 1)"
          >
            Suivant
            <ChevronRight class="size-4" />
          </Button>
        </div>
      </template>
    </main>

    <!-- Filtres : panneau bas sur mobile, latéral sur PC -->
    <Sheet :open="showFilters" @update:open="showFilters = $event">
      <SheetContent
        :side="isMobile ? 'bottom' : 'right'"
        :class="isMobile ? 'rounded-t-2xl pb-[env(safe-area-inset-bottom)]' : ''"
      >
        <SheetHeader>
          <SheetTitle>Filtrer mes acomptes</SheetTitle>
          <SheetDescription>Limitez la liste à un montant ou à une période.</SheetDescription>
        </SheetHeader>

        <form class="flex flex-col gap-4 px-4" @submit.prevent="applyFilters">
          <div class="grid grid-cols-2 gap-3 *:min-w-0">
            <div class="flex flex-col gap-1.5">
              <label for="filter-montant-min" class="text-sm font-medium text-muted-foreground">Montant min (€)</label>
              <Input
                id="filter-montant-min"
                type="number"
                inputmode="decimal"
                min="0"
                placeholder="Min"
                :model-value="searchFilters.montantMin"
                @update:model-value="searchFilters.montantMin = String($event)"
              />
            </div>
            <div class="flex flex-col gap-1.5">
              <label for="filter-montant-max" class="text-sm font-medium text-muted-foreground">Montant max (€)</label>
              <Input
                id="filter-montant-max"
                type="number"
                inputmode="decimal"
                min="0"
                placeholder="Max"
                :model-value="searchFilters.montantMax"
                @update:model-value="searchFilters.montantMax = String($event)"
              />
            </div>
          </div>
          <div class="grid gap-3">
            <div class="flex flex-col gap-1.5">
              <label for="filter-start" class="text-sm font-medium text-muted-foreground">Du</label>
              <Input
                id="filter-start"
                type="date"
                :model-value="searchFilters.startDate"
                @update:model-value="searchFilters.startDate = String($event)"
              />
            </div>
            <div class="flex flex-col gap-1.5">
              <label for="filter-end" class="text-sm font-medium text-muted-foreground">Au</label>
              <Input
                id="filter-end"
                type="date"
                :model-value="searchFilters.endDate"
                @update:model-value="searchFilters.endDate = String($event)"
              />
            </div>
          </div>
        </form>

        <SheetFooter class="flex-row gap-2 sm:justify-end">
          <Button variant="ghost" class="flex-1 sm:flex-none" @click="resetFilters">Réinitialiser</Button>
          <Button class="flex-1 sm:flex-none" @click="applyFilters">Appliquer</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>

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
      <DialogContent class="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Annuler la demande</DialogTitle>
          <DialogDescription>Cette action est irréversible.</DialogDescription>
        </DialogHeader>

        <div v-if="selectedAcompte" class="space-y-3 rounded-lg border bg-muted/50 p-4">
          <div class="flex justify-between gap-3 text-sm">
            <span class="text-muted-foreground">Montant</span>
            <span class="font-medium tabular-nums">{{ formatMontant(selectedAcompte.montant) }}</span>
          </div>
          <div v-if="selectedAcompte.raison" class="flex justify-between gap-3 text-sm">
            <span class="shrink-0 text-muted-foreground">Raison</span>
            <span class="text-right font-medium">{{ selectedAcompte.raison }}</span>
          </div>
          <div class="flex justify-between gap-3 text-sm">
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
import { useMediaQuery } from '@vueuse/core'
import { acomptesService } from '@/services'
import type { AcompteDTO } from '@/models'
import type { AcompteSearchParams } from '@/services/acomptes'
import { useMessages } from '@/composables/useMessages'
import { formatMontant } from '@/utils/acompteFormatters'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Retour } from '@/components/ui/retour'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet'

import {
  Plus,
  LoaderCircle,
  Banknote,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  RotateCcw,
  RefreshCw,
} from 'lucide-vue-next'

import MyAcompteCard from '@/components/myacomptes/MyAcompteCard.vue'
import MyAcompteEditModal from '@/components/myacomptes/MyAcompteEditModal.vue'
import MyAcompteDetailModal from '@/components/myacomptes/MyAcompteDetailModal.vue'

const messages = useMessages()
const isMobile = useMediaQuery('(max-width: 639px)')

// Données
const acomptes = ref<AcompteDTO[]>([])

// États
const loading = ref(true)
const searchLoading = ref(false)
const error = ref('')
const cancelling = ref(false)
const showFilters = ref(false)

// Pagination
const pagination = ref({
  currentPage: 0,
  totalPages: 0,
  totalElements: 0
})

// Filtres
const searchFilters = ref({
  status: '',
  montantMin: '',
  montantMax: '',
  startDate: '',
  endDate: ''
})

// Puces de statut (filtre le plus fréquent, toujours visible).
// Seules PENDING | APPROVED | REJECTED existent côté API.
const statusChips: { value: string; label: string }[] = [
  { value: '', label: 'Tous' },
  { value: 'PENDING', label: 'En attente' },
  { value: 'APPROVED', label: 'Approuvés' },
  { value: 'REJECTED', label: 'Refusés' },
]

const currentStatus = computed(() => searchFilters.value.status || '')

const selectStatus = (status: string) => {
  if (currentStatus.value === status) return
  searchFilters.value.status = status
  loadAcomptes(0)
}

// Filtres du panneau (hors statut) actifs → badge sur le bouton
const activeFilterCount = computed(() => {
  let n = 0
  if (searchFilters.value.montantMin) n++
  if (searchFilters.value.montantMax) n++
  if (searchFilters.value.startDate) n++
  if (searchFilters.value.endDate) n++
  return n
})

const hasAnyFilter = computed(() => activeFilterCount.value > 0 || !!currentStatus.value)

// Texte descriptif des filtres actifs
const activeFiltersText = computed(() => {
  const parts: string[] = []

  const status = searchFilters.value.status
  if (status) {
    const chip = statusChips.find(c => c.value === status)
    if (chip) parts.push(chip.label)
  }

  const { montantMin, montantMax, startDate, endDate } = searchFilters.value
  if (montantMin && montantMax) {
    parts.push(`${montantMin} € à ${montantMax} €`)
  } else if (montantMin) {
    parts.push(`≥ ${montantMin} €`)
  } else if (montantMax) {
    parts.push(`≤ ${montantMax} €`)
  }

  if (startDate && endDate) {
    parts.push(`du ${formatDateShort(startDate)} au ${formatDateShort(endDate)}`)
  } else if (startDate) {
    parts.push(`à partir du ${formatDateShort(startDate)}`)
  } else if (endDate) {
    parts.push(`jusqu'au ${formatDateShort(endDate)}`)
  }

  return parts.length > 0 ? parts.join(' · ') : 'Toutes vos demandes d\'acompte'
})

const countLabel = computed(() => {
  const n = pagination.value.totalElements
  return `${n} demande${n > 1 ? 's' : ''}`
})

// Format court pour les dates dans le résumé
const formatDateShort = (dateString: string): string => {
  if (!dateString) return ''
  const d = new Date(dateString)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

// Modals
const showCreateModal = ref(false)
const showDetailModal = ref(false)
const showCancelModal = ref(false)
const selectedAcompte = ref<AcompteDTO | null>(null)

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

    const { startDate, endDate, status, montantMin, montantMax } = searchFilters.value

    if (startDate) apiFilters.startDate = startDate
    if (endDate) apiFilters.endDate = endDate
    // Seules PENDING | APPROVED | REJECTED existent côté API (autre valeur → 500)
    if (status === 'PENDING' || status === 'APPROVED' || status === 'REJECTED') apiFilters.status = status
    const min = Number.parseFloat(montantMin)
    const max = Number.parseFloat(montantMax)
    if (!Number.isNaN(min)) apiFilters.montantMin = min
    if (!Number.isNaN(max)) apiFilters.montantMax = max

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
  showFilters.value = false
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
  showFilters.value = false
  loadAcomptes(0)
}

// Helpers de formatage
const formatDateCompact = (dateString?: string | Date): string => {
  if (!dateString) return '-'
  const d = new Date(dateString)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
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
