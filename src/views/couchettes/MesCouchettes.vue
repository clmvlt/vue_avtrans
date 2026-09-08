<template>
  <div class="min-h-screen bg-background">
    <!-- Header -->
    <header class="sticky top-0 z-40 border-b bg-background">
      <div class="mx-auto flex max-w-[1100px] items-center gap-2 px-3 py-3 sm:gap-4 sm:px-6 sm:py-4">
        <Retour fallback="/" />
        <h1 class="flex-1 text-lg font-bold text-foreground sm:text-xl">Mes couchettes</h1>
      </div>
    </header>

    <main class="mx-auto max-w-[1100px] px-3 py-3 sm:px-6 sm:py-6">
      <!-- Loading (squelette de la mise en page) -->
      <div v-if="loading && !hasLoadedOnce" class="grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,4fr)] lg:gap-6">
        <div class="space-y-4">
          <div class="rounded-2xl border bg-card p-5 sm:p-6">
            <Skeleton class="h-3 w-40" />
            <Skeleton class="mt-4 h-8 w-64" />
            <Skeleton class="mt-3 h-3 w-48" />
            <Skeleton class="mt-6 h-14 w-full" />
          </div>
          <div class="grid grid-cols-2 gap-2 sm:gap-3">
            <Skeleton v-for="n in 2" :key="n" class="h-[68px]" />
          </div>
        </div>
        <div class="space-y-3">
          <Skeleton class="h-8 w-32" />
          <Skeleton v-for="n in 4" :key="n" class="h-16 w-full rounded-xl" />
        </div>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="rounded-xl border border-destructive bg-destructive/10 p-4 text-destructive">
        <p class="font-medium">{{ error }}</p>
        <Button variant="outline" size="sm" class="mt-3" @click="loadCouchettes(currentPage)">
          <RefreshCw class="size-4" />
          Réessayer
        </Button>
      </div>

      <!-- Content : 1 colonne sur mobile, 2 colonnes sur grand écran -->
      <div v-else class="grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,4fr)] lg:items-start lg:gap-6">
        <!-- ===== Colonne gauche : état du jour + compteurs ===== -->
        <div class="space-y-4">
          <!-- Carte d'état (hero) -->
          <section
            class="relative overflow-hidden rounded-2xl border p-5 shadow-sm transition-colors sm:p-6"
            :class="hasTodayCouchette
              ? 'border-green-500/30 bg-linear-to-br from-green-500/10 via-card to-card'
              : 'bg-card'"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Aujourd'hui · <span class="capitalize">{{ todayDateFormatted }}</span>
                </p>
                <h2 class="mt-2 text-xl font-bold text-foreground sm:text-2xl">
                  {{ hasTodayCouchette ? 'Couchette déclarée' : 'Couchette du jour' }}
                </h2>
                <p class="mt-1 text-sm text-muted-foreground">
                  <template v-if="hasTodayCouchette && todayCouchette">
                    Déclarée le {{ formatDateTime(todayCouchette.createdAt) }}
                  </template>
                  <template v-else>
                    Vous dormez en couchette ce soir ? Déclarez-la en un appui.
                  </template>
                </p>
              </div>

              <!-- Pastille d'état -->
              <span
                class="inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold"
                :class="hasTodayCouchette
                  ? 'border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-400'
                  : 'border-border bg-muted text-muted-foreground'"
              >
                <BedDouble class="size-3.5" />
                {{ hasTodayCouchette ? 'Déclarée' : 'Non déclarée' }}
              </span>
            </div>

            <div class="mt-5">
              <Button
                v-if="!hasTodayCouchette"
                class="h-14 w-full text-base font-semibold shadow-sm"
                :disabled="creating"
                @click="createTodayCouchette"
              >
                <LoaderCircle v-if="creating" class="size-5 animate-spin" />
                <Plus v-else class="size-5" />
                Déclarer ma couchette du jour
              </Button>
              <Button
                v-else
                variant="outline"
                class="h-12 w-full border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                :disabled="deleting"
                @click="confirmDeleteToday"
              >
                <LoaderCircle v-if="deleting" class="size-4 animate-spin" />
                <Trash2 v-else class="size-4" />
                Annuler ma couchette du jour
              </Button>
            </div>
          </section>

          <!-- Compteurs -->
          <section class="grid grid-cols-2 gap-2 sm:gap-3" aria-label="Compteurs de couchettes">
            <div class="flex items-center gap-2.5 rounded-xl border bg-card px-3 py-2.5 sm:px-4 sm:py-3">
              <div class="hidden size-9 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary sm:flex">
                <CalendarCheck class="size-4" />
              </div>
              <div class="flex min-w-0 flex-col gap-0.5">
                <span class="truncate text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Ce mois</span>
                <span class="font-mono text-base font-bold tabular-nums text-foreground sm:text-lg">{{ monthCount }}</span>
              </div>
            </div>
            <div class="flex items-center gap-2.5 rounded-xl border bg-card px-3 py-2.5 sm:px-4 sm:py-3">
              <div class="hidden size-9 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary sm:flex">
                <BedDouble class="size-4" />
              </div>
              <div class="flex min-w-0 flex-col gap-0.5">
                <span class="truncate text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Total</span>
                <span class="font-mono text-base font-bold tabular-nums text-foreground sm:text-lg">{{ totalElements }}</span>
              </div>
            </div>
          </section>
        </div>

        <!-- ===== Colonne droite : historique ===== -->
        <section class="space-y-3">
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-lg font-semibold text-foreground">Historique</h2>
            <span class="text-xs text-muted-foreground">{{ countLabel }}</span>
          </div>

          <!-- Loading (changement de page) -->
          <div v-if="loading" class="space-y-2">
            <Skeleton v-for="n in 4" :key="n" class="h-16 w-full rounded-xl" />
          </div>

          <!-- Empty -->
          <div v-else-if="couchettes.length === 0" class="rounded-2xl border border-dashed p-8 text-center">
            <BedDouble class="mx-auto mb-3 size-9 text-muted-foreground/70" />
            <p class="text-sm text-muted-foreground">Aucune couchette déclarée pour l'instant</p>
          </div>

          <!-- Liste groupée par mois -->
          <div v-else class="flex flex-col gap-4">
            <div v-for="group in couchettesByMonth" :key="group.key">
              <div class="mb-2 flex items-center justify-between px-1">
                <h3 class="text-sm font-semibold capitalize text-foreground">{{ group.label }}</h3>
                <span class="text-xs tabular-nums text-muted-foreground">
                  {{ group.items.length }} nuit{{ group.items.length > 1 ? 's' : '' }}
                </span>
              </div>
              <ul class="flex flex-col gap-2">
                <li
                  v-for="couchette in group.items"
                  :key="couchette.uuid"
                  class="flex items-center gap-3 rounded-xl border bg-card p-3 shadow-sm"
                  :class="isToday(couchette.date) && 'border-green-500/40'"
                >
                  <!-- Tuile de date -->
                  <div
                    class="flex w-14 shrink-0 flex-col items-center justify-center rounded-lg py-1.5"
                    :class="isToday(couchette.date) ? 'bg-green-500/10 text-green-700 dark:text-green-400' : 'bg-primary/10 text-primary'"
                  >
                    <span class="text-xl font-bold leading-none tabular-nums">{{ getDayNumber(couchette.date) }}</span>
                    <span class="mt-1 text-[11px] font-semibold uppercase leading-none">{{ getDayShort(couchette.date) }}</span>
                  </div>

                  <div class="min-w-0 flex-1">
                    <p class="truncate font-medium capitalize text-foreground">
                      {{ isToday(couchette.date) ? "Aujourd'hui" : formatDate(couchette.date) }}
                    </p>
                    <p class="truncate text-xs text-muted-foreground">
                      Déclarée le {{ formatDateTime(couchette.createdAt) }}
                    </p>
                  </div>

                  <Button
                    v-if="isToday(couchette.date)"
                    variant="ghost"
                    size="icon-sm"
                    class="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    aria-label="Supprimer la couchette du jour"
                    @click="confirmDelete(couchette)"
                  >
                    <Trash2 class="size-4" />
                  </Button>
                </li>
              </ul>
            </div>
          </div>

          <!-- Pagination -->
          <div
            v-if="!loading && totalPages > 1"
            class="flex items-center justify-between gap-2 rounded-xl border bg-card px-3 py-2"
          >
            <Button variant="ghost" size="sm" :disabled="currentPage === 0" @click="goToPage(currentPage - 1)">
              <ChevronLeft class="size-4" />
              Précédent
            </Button>
            <span class="text-xs tabular-nums text-muted-foreground">
              Page {{ currentPage + 1 }} / {{ totalPages }}
            </span>
            <Button variant="ghost" size="sm" :disabled="currentPage >= totalPages - 1" @click="goToPage(currentPage + 1)">
              Suivant
              <ChevronRight class="size-4" />
            </Button>
          </div>
        </section>
      </div>
    </main>

    <!-- Delete Dialog -->
    <Dialog v-model:open="showDeleteModal">
      <DialogContent class="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Supprimer la couchette</DialogTitle>
          <DialogDescription>Cette action est irréversible.</DialogDescription>
        </DialogHeader>

        <div v-if="couchetteToDelete" class="space-y-3 rounded-lg border bg-muted/50 p-4">
          <div class="flex justify-between gap-3 text-sm">
            <span class="text-muted-foreground">Date</span>
            <span class="font-medium capitalize">{{ formatDate(couchetteToDelete.date) }}</span>
          </div>
          <div class="flex justify-between gap-3 text-sm">
            <span class="text-muted-foreground">Déclarée le</span>
            <span class="font-medium">{{ formatDateTime(couchetteToDelete.createdAt) }}</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="cancelDelete">Retour</Button>
          <Button variant="destructive" :disabled="deleting" @click="executeDelete">
            <LoaderCircle v-if="deleting" class="size-4 animate-spin" />
            Supprimer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { couchettesService } from '@/services'
import type { CouchetteDTO } from '@/models'
import { useMessages } from '@/composables/useMessages'

import { Button } from '@/components/ui/button'
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

import {
  BedDouble,
  CalendarCheck,
  Plus,
  Trash2,
  LoaderCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-vue-next'

interface MonthGroup {
  key: string
  label: string
  items: CouchetteDTO[]
}

const messages = useMessages()

// State
const loading = ref(true)
const hasLoadedOnce = ref(false)
const error = ref<string | null>(null)
const creating = ref(false)
const deleting = ref(false)
const couchettes = ref<CouchetteDTO[]>([])
const currentPage = ref(0)
const totalPages = ref(0)
const totalElements = ref(0)
const pageSize = ref(20)

// Delete confirmation
const showDeleteModal = ref(false)
const couchetteToDelete = ref<CouchetteDTO | null>(null)

// Clé de date locale (YYYY-MM-DD) — évite le décalage UTC de toISOString en soirée
const localDateKey = (date: Date): string => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const todayKey = computed(() => localDateKey(new Date()))

const todayDateFormatted = computed(() =>
  new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
)

// Computed
const todayCouchette = computed(() => couchettes.value.find(c => c.date === todayKey.value))
const hasTodayCouchette = computed(() => !!todayCouchette.value)

// Nombre de nuits du mois courant parmi les couchettes chargées (page courante)
const monthCount = computed(() => {
  const now = new Date()
  return couchettes.value.filter(c => {
    const date = parseDate(c.date)
    return !!date && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
  }).length
})

const countLabel = computed(() => `${totalElements.value} nuit${totalElements.value > 1 ? 's' : ''}`)

// Historique groupé par mois (ordre décroissant)
const couchettesByMonth = computed((): MonthGroup[] => {
  const groups = new Map<string, MonthGroup>()

  for (const couchette of couchettes.value) {
    const date = parseDate(couchette.date)
    if (!date) continue
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        label: date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
        items: []
      })
    }
    groups.get(key)?.items.push(couchette)
  }

  for (const group of groups.values()) {
    group.items.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  }

  return Array.from(groups.values()).sort((a, b) => b.key.localeCompare(a.key))
})

// Load data
const loadCouchettes = async (page: number = 0) => {
  try {
    loading.value = true
    error.value = null

    const response = await couchettesService.getMyCouchettes({
      page,
      size: pageSize.value
    })

    couchettes.value = response.content || []
    currentPage.value = response.page ?? 0
    totalPages.value = response.totalPages ?? 0
    totalElements.value = response.totalElements ?? 0
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Erreur lors du chargement des couchettes'
    console.error('Error loading couchettes:', err)
  } finally {
    loading.value = false
    hasLoadedOnce.value = true
  }
}

// Create couchette
const createTodayCouchette = async () => {
  try {
    creating.value = true
    await couchettesService.createCouchette()
    messages.success('Couchette déclarée avec succès')
    await loadCouchettes(0)
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la déclaration'
    messages.error(errorMessage)
  } finally {
    creating.value = false
  }
}

// Delete couchette
const confirmDeleteToday = () => {
  if (todayCouchette.value) {
    couchetteToDelete.value = todayCouchette.value
    showDeleteModal.value = true
  }
}

const confirmDelete = (couchette: CouchetteDTO) => {
  couchetteToDelete.value = couchette
  showDeleteModal.value = true
}

const cancelDelete = () => {
  showDeleteModal.value = false
  couchetteToDelete.value = null
}

const executeDelete = async () => {
  if (!couchetteToDelete.value?.uuid) return

  try {
    deleting.value = true
    await couchettesService.deleteMyCouchette(couchetteToDelete.value.uuid)
    messages.success('Couchette supprimée')
    showDeleteModal.value = false
    couchetteToDelete.value = null
    await loadCouchettes(currentPage.value)
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression'
    messages.error(errorMessage)
  } finally {
    deleting.value = false
  }
}

// Pagination
const goToPage = (page: number) => {
  if (page >= 0 && page < totalPages.value) {
    loadCouchettes(page)
  }
}

// Helpers
const parseDate = (value?: string | Date): Date | null => {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

const isToday = (dateStr?: string): boolean => !!dateStr && dateStr === todayKey.value

const getDayNumber = (dateStr?: string): string => {
  const d = parseDate(dateStr)
  return d ? String(d.getDate()) : '--'
}

const getDayShort = (dateStr?: string): string => {
  const d = parseDate(dateStr)
  return d ? d.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '') : ''
}

const formatDate = (dateStr?: string): string => {
  const d = parseDate(dateStr)
  if (!d) return '-'
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}

const formatDateTime = (value?: Date | string): string => {
  const d = parseDate(value)
  if (!d) return '-'
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Lifecycle
onMounted(() => {
  loadCouchettes()
})
</script>
