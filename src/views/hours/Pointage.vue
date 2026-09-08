<template>
  <div class="min-h-screen bg-background pb-[calc(5.75rem+env(safe-area-inset-bottom))] md:pb-8">
    <!-- Header -->
    <header class="sticky top-0 z-40 border-b bg-background">
      <div class="mx-auto flex max-w-[1100px] items-center gap-2 px-3 py-3 sm:gap-4 sm:px-6 sm:py-4">
        <Retour fallback="/" />
        <h1 class="flex-1 text-lg font-bold text-foreground sm:text-xl">Pointage</h1>
        <Button variant="outline" size="sm" aria-label="Saisir le kilométrage" @click="openKmModal">
          <Gauge class="size-4" />
          <span class="max-sm:sr-only">Kilométrage</span>
        </Button>
      </div>
    </header>

    <main class="mx-auto max-w-[1100px] px-3 py-3 sm:px-6 sm:py-6">
      <!-- Loading State (squelette de la mise en page) -->
      <div v-if="loading && !activeService" class="grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,4fr)] lg:gap-6">
        <div class="space-y-4">
          <div class="rounded-2xl border bg-card p-5 sm:p-6">
            <Skeleton class="h-3 w-40" />
            <Skeleton class="mt-4 h-12 w-56" />
            <Skeleton class="mt-3 h-3 w-48" />
            <div class="mt-6 hidden md:block">
              <Skeleton class="h-14 w-full" />
            </div>
          </div>
          <div class="grid grid-cols-3 gap-2 sm:gap-3">
            <Skeleton v-for="n in 3" :key="n" class="h-[68px]" />
          </div>
          <Skeleton class="h-40 w-full rounded-2xl" />
        </div>
        <div class="space-y-3">
          <Skeleton class="h-8 w-32" />
          <Skeleton v-for="n in 3" :key="n" class="h-16 w-full rounded-xl" />
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="rounded-xl border border-destructive bg-destructive/10 p-4 text-destructive">
        <p class="font-medium">{{ error }}</p>
        <Button variant="outline" size="sm" class="mt-3" @click="loadData">
          <RefreshCw class="size-4" />
          Réessayer
        </Button>
      </div>

      <!-- Main Content : 1 colonne sur mobile, 2 colonnes sur grand écran -->
      <div v-else class="grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,4fr)] lg:items-start lg:gap-6">
        <!-- ===== Colonne gauche : état + compteurs + services du jour ===== -->
        <div class="space-y-4">
          <!-- Carte d'état (hero) -->
          <section
            class="relative overflow-hidden rounded-2xl border p-5 shadow-sm transition-colors sm:p-6"
            :class="heroClass"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Aujourd'hui · <span class="capitalize">{{ todayDateFormatted }}</span>
                </p>
                <p class="mt-2 font-mono text-4xl font-bold leading-none tabular-nums text-foreground sm:text-5xl">
                  {{ todayClock }}
                </p>
                <p class="mt-2 text-sm text-muted-foreground">{{ heroSubtitle }}</p>
              </div>

              <!-- Pastille d'état -->
              <span
                class="inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold"
                :class="statusPillClass"
              >
                <span class="relative flex size-2">
                  <span
                    v-if="pointageStatus !== 'off'"
                    class="absolute inline-flex size-full animate-ping rounded-full opacity-60"
                    :class="pointageStatus === 'working' ? 'bg-green-500' : 'bg-amber-500'"
                  />
                  <span
                    class="relative inline-flex size-2 rounded-full"
                    :class="pointageStatus === 'working' ? 'bg-green-500' : pointageStatus === 'break' ? 'bg-amber-500' : 'bg-muted-foreground/50'"
                  />
                </span>
                {{ statusText }}
              </span>
            </div>

            <!-- Rappels contextuels -->
            <div v-if="locationPermission === 'denied' || (isUserRole && !hasEnteredKmToday)" class="mt-4 flex flex-wrap gap-2">
              <button
                v-if="locationPermission === 'denied'"
                type="button"
                class="inline-flex items-center gap-1.5 rounded-full border border-destructive/40 bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive transition-colors hover:bg-destructive/15"
                @click="requestLocation()"
              >
                <MapPinOff class="size-3.5" />
                Localisation refusée · Réessayer
              </button>
              <button
                v-if="isUserRole && !hasEnteredKmToday"
                type="button"
                class="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/15"
                @click="openKmModal"
              >
                <Gauge class="size-3.5" />
                Kilométrage du jour à saisir
              </button>
            </div>

            <!-- Actions (PC uniquement — sur mobile elles sont dans la barre fixe en bas) -->
            <div class="mt-5 hidden md:block">
              <PointageActions
                :status="pointageStatus"
                :loading="actionLoading"
                layout="row"
                @start="startService"
                @pause="startBreak"
                @resume="endBreak"
                @end="endService"
              />
            </div>
          </section>

          <!-- Compteurs (le jour est déjà affiché en direct dans la carte d'état) -->
          <section class="grid grid-cols-3 gap-2 sm:gap-3" aria-label="Heures travaillées">
            <div
              v-for="stat in stats"
              :key="stat.label"
              class="flex items-center gap-2.5 rounded-xl border bg-card px-3 py-2.5 sm:px-4 sm:py-3"
            >
              <div
                class="hidden size-9 shrink-0 items-center justify-center rounded-md sm:flex"
                :class="stat.iconClass"
              >
                <component :is="stat.icon" class="size-4" />
              </div>
              <div class="flex min-w-0 flex-col gap-0.5">
                <span class="truncate text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{{ stat.label }}</span>
                <span class="truncate font-mono text-base font-bold tabular-nums text-foreground sm:text-lg">{{ stat.value }}</span>
              </div>
            </div>
          </section>

          <!-- Services du jour -->
          <section class="rounded-2xl border bg-card shadow-sm">
            <div class="flex items-center justify-between gap-3 border-b px-4 py-3 sm:px-5">
              <h2 class="text-base font-semibold text-foreground">Services du jour</h2>
              <span class="text-xs text-muted-foreground">{{ todayCountLabel }}</span>
            </div>
            <div class="px-4 py-2 sm:px-5">
              <ServiceTimeline
                :services="todayServices"
                :active-uuid="activeService?.uuid"
                :elapsed-ms="elapsedTime"
                empty-text="Aucun service enregistré aujourd'hui"
              />
            </div>
          </section>
        </div>

        <!-- ===== Colonne droite : historique ===== -->
        <section class="space-y-3">
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-lg font-semibold text-foreground">Historique</h2>
            <Button
              :variant="activeFilterCount > 0 ? 'default' : 'outline'"
              size="sm"
              @click="showFilters = true"
            >
              <Filter class="size-4" />
              Filtres
              <span
                v-if="activeFilterCount > 0"
                class="flex size-5 items-center justify-center rounded-full bg-background/20 text-[11px] font-bold"
              >
                {{ activeFilterCount }}
              </span>
            </Button>
          </div>

          <!-- Loading -->
          <div v-if="historyLoading" class="space-y-2">
            <Skeleton v-for="n in 4" :key="n" class="h-16 w-full rounded-xl" />
          </div>

          <!-- Empty -->
          <div v-else-if="historyByDay.length === 0" class="rounded-2xl border bg-card p-8 text-center">
            <ClipboardList class="mx-auto mb-3 size-9 text-muted-foreground/70" />
            <p class="text-sm text-muted-foreground">Aucun service trouvé</p>
            <Button v-if="activeFilterCount > 0" variant="ghost" size="sm" class="mt-3" @click="resetFilters">
              Réinitialiser les filtres
            </Button>
          </div>

          <!-- Accordéon par jour -->
          <div v-else class="flex flex-col gap-2">
            <div
              v-for="day in historyByDay"
              :key="day.date"
              class="overflow-hidden rounded-xl border bg-card"
            >
              <button
                type="button"
                class="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
                :aria-expanded="isDayOpen(day.date)"
                @click="toggleDay(day.date)"
              >
                <div class="min-w-0">
                  <p class="truncate font-semibold capitalize text-foreground">{{ day.dayName }} {{ day.dateFormatted }}</p>
                  <p class="text-xs text-muted-foreground">{{ day.countLabel }}</p>
                </div>
                <div class="flex shrink-0 items-center gap-2">
                  <span class="rounded-md bg-primary/10 px-2 py-1 font-mono text-sm font-semibold tabular-nums text-primary">
                    {{ day.totalHours }}
                  </span>
                  <ChevronDown
                    class="size-4 text-muted-foreground transition-transform duration-200"
                    :class="isDayOpen(day.date) && 'rotate-180'"
                  />
                </div>
              </button>

              <div v-if="isDayOpen(day.date)" class="border-t px-4 py-1">
                <ServiceTimeline :services="day.services" />
              </div>
            </div>
          </div>

          <!-- Pagination -->
          <div
            v-if="!historyLoading && totalPages > 1"
            class="flex items-center justify-between gap-2 rounded-xl border bg-card px-3 py-2"
          >
            <Button variant="ghost" size="sm" :disabled="currentPage === 0" @click="changePage(currentPage - 1)">
              <ChevronLeft class="size-4" />
              Précédent
            </Button>
            <span class="text-xs tabular-nums text-muted-foreground">
              Page {{ currentPage + 1 }} / {{ totalPages }}
              <span class="opacity-60">({{ totalElements }})</span>
            </span>
            <Button variant="ghost" size="sm" :disabled="currentPage >= totalPages - 1" @click="changePage(currentPage + 1)">
              Suivant
              <ChevronRight class="size-4" />
            </Button>
          </div>
        </section>
      </div>
    </main>

    <!-- Barre d'actions fixe (mobile uniquement, zone du pouce) -->
    <div
      v-if="!(loading && !activeService) && !error"
      class="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 px-3 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden"
    >
      <div class="mx-auto max-w-[1100px]">
        <PointageActions
          :status="pointageStatus"
          :loading="actionLoading"
          layout="row"
          @start="startService"
          @pause="startBreak"
          @resume="endBreak"
          @end="endService"
        />
      </div>
    </div>

    <!-- Filtres de l'historique : panneau bas sur mobile, latéral sur PC -->
    <Sheet :open="showFilters" @update:open="showFilters = $event">
      <SheetContent
        :side="isMobile ? 'bottom' : 'right'"
        :class="isMobile ? 'rounded-t-2xl pb-[env(safe-area-inset-bottom)]' : ''"
      >
        <SheetHeader>
          <SheetTitle>Filtrer l'historique</SheetTitle>
          <SheetDescription>Limitez l'historique à une période ou à un type.</SheetDescription>
        </SheetHeader>

        <form class="flex flex-col gap-4 px-4" @submit.prevent="applyFilters">
          <div class="grid gap-3">
            <div class="flex flex-col gap-1.5">
              <label for="filter-start" class="text-sm font-medium text-muted-foreground">Du</label>
              <Input id="filter-start" v-model="filters.startDate" type="date" />
            </div>
            <div class="flex flex-col gap-1.5">
              <label for="filter-end" class="text-sm font-medium text-muted-foreground">Au</label>
              <Input id="filter-end" v-model="filters.endDate" type="date" />
            </div>
          </div>
          <Select
            v-model="filters.isBreakString"
            label="Type"
            :options="typeFilterOptions"
            :searchable="false"
            :teleport="false"
          />
        </form>

        <SheetFooter class="flex-row gap-2 sm:justify-end">
          <Button variant="ghost" class="flex-1 sm:flex-none" @click="resetFilters">Réinitialiser</Button>
          <Button class="flex-1 sm:flex-none" @click="applyFilters">Appliquer</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>

    <!-- Kilometrage Modal -->
    <Dialog :open="showKmModal" @update:open="(v: boolean) => { if (!v && isKmModalRequired) return; showKmModal = v }">
      <DialogContent class="max-h-[90dvh] overflow-y-auto sm:max-w-md" :show-close-button="!isKmModalRequired">
        <DialogHeader>
          <div class="flex items-center gap-3">
            <Gauge class="size-5 text-primary" />
            <DialogTitle>Saisie du kilométrage</DialogTitle>
          </div>
          <DialogDescription>
            {{ isKmModalRequired ? 'Avant de commencer votre journée, veuillez renseigner le kilométrage de votre véhicule.' : 'Renseignez le kilométrage actuel d\'un véhicule.' }}
          </DialogDescription>
        </DialogHeader>

        <div v-if="kmError" class="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {{ kmError }}
        </div>

        <form @submit.prevent="submitKilometrage" class="flex flex-col gap-4">
          <!-- Vehicle select -->
          <Select
            v-model="selectedVehicleId"
            label="Véhicule"
            :options="vehicleOptions"
            placeholder="Sélectionner un véhicule..."
            search-placeholder="Rechercher par immat, marque..."
            no-results-text="Aucun véhicule trouvé"
            :disabled="savingKm || loadingVehicles"
            :teleport="false"
            required
          />

          <!-- KM input -->
          <div class="flex flex-col gap-2">
            <label for="km" class="text-sm font-medium text-muted-foreground">Kilométrage actuel *</label>
            <Input
              ref="kmInputRef"
              type="number"
              inputmode="numeric"
              id="km"
              :model-value="kmValue ?? undefined"
              @update:model-value="kmValue = $event ? Number($event) : null"
              required
              min="0"
              :disabled="savingKm"
              placeholder="Ex: 125000"
            />
          </div>

          <!-- Submit -->
          <Button
            type="submit"
            class="w-full"
            :disabled="!selectedVehicleId || !kmValue || savingKm"
          >
            <LoaderCircle v-if="savingKm" class="size-4 animate-spin" />
            <Check v-else class="size-4" />
            Enregistrer
          </Button>
        </form>
      </DialogContent>
    </Dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, type Component } from 'vue'
import { useMediaQuery } from '@vueuse/core'
import { userServicesService, type WorkedHoursDTO, type GpsLocationRequest } from '@/services/userServices'
import { usersService, vehiclesService } from '@/services'
import type { ServiceDTO, VehiculeDTO } from '@/models'
import { useMessages } from '@/composables/useMessages'
import { useAuthStore } from '@/stores/auth'
import { USER_ROLE_UUIDS } from '@/enums'
import { formatDuration, formatHours } from '@/utils/timeFormatters'
import { Retour } from '@/components/ui/retour'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet'
import PointageActions, { type PointageStatus } from '@/components/hours/PointageActions.vue'
import ServiceTimeline from '@/components/hours/ServiceTimeline.vue'
import {
  Gauge, CalendarDays, CalendarRange, Calendar, ClipboardList, Filter,
  Check, ChevronDown, ChevronLeft, ChevronRight, LoaderCircle, MapPinOff, RefreshCw
} from 'lucide-vue-next'

const messages = useMessages()
const authStore = useAuthStore()
const isMobile = useMediaQuery('(max-width: 639px)')

// Computed pour vérifier si l'utilisateur a le rôle "User" (pas mécanicien ni admin)
const isUserRole = computed(() => {
  return authStore.userRoleUuid === USER_ROLE_UUIDS.UTILISATEUR
})

// Types
interface DayGroup {
  date: string
  dayName: string
  dateFormatted: string
  totalHours: string
  countLabel: string
  services: ServiceDTO[]
}

// State
const loading = ref(false)
const error = ref<string | null>(null)
const actionLoading = ref(false)
const activeService = ref<ServiceDTO | null>(null)
const workedHours = ref<WorkedHoursDTO>({
  day: 0,
  week: 0,
  month: 0,
  year: 0,
  lastMonth: 0
})
const todayServices = ref<ServiceDTO[]>([])
const historyLoading = ref(false)
const history = ref<ServiceDTO[]>([])
const currentPage = ref(0)
const totalPages = ref(0)
const totalElements = ref(0)
const showFilters = ref(false)
const openDays = ref<Set<string>>(new Set())

// Elapsed time calculation
const elapsedTime = ref(0)
let elapsedTimeInterval: ReturnType<typeof setInterval> | null = null

// Filters
const filters = ref({
  startDate: '',
  endDate: '',
  isBreak: undefined as boolean | undefined,
  isBreakString: 'all',
  page: 0,
  size: 20
})

// Options pour le filtre type (pause/service)
const typeFilterOptions = [
  { value: 'all', label: 'Tous' },
  { value: 'service', label: 'Services' },
  { value: 'pause', label: 'Pauses' }
]

// Kilométrage modal
const showKmModal = ref(false)
const isKmModalRequired = ref(false)
const hasEnteredKmToday = ref(false)
const vehiclesList = ref<VehiculeDTO[]>([])
const loadingVehicles = ref(false)
const selectedVehicleId = ref<string>('')
const lastUsedVehicleId = ref<string>('')
const kmValue = ref<number | null>(null)
const savingKm = ref(false)
const kmError = ref('')
const kmInputRef = ref<{ $el: HTMLInputElement } | null>(null)

// ===== État du pointage =====
const pointageStatus = computed<PointageStatus>(() => {
  if (!activeService.value) return 'off'
  return activeService.value.isBreak ? 'break' : 'working'
})

const statusText = computed(() => {
  switch (pointageStatus.value) {
    case 'working': return 'En service'
    case 'break': return 'En pause'
    default: return 'Hors service'
  }
})

const heroClass = computed(() => {
  switch (pointageStatus.value) {
    case 'working':
      return 'border-green-500/30 bg-linear-to-br from-green-500/10 via-card to-card'
    case 'break':
      return 'border-amber-500/30 bg-linear-to-br from-amber-500/10 via-card to-card'
    default:
      return 'bg-card'
  }
})

const statusPillClass = computed(() => {
  switch (pointageStatus.value) {
    case 'working':
      return 'border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-400'
    case 'break':
      return 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400'
    default:
      return 'border-border bg-muted text-muted-foreground'
  }
})

const toTime = (date?: Date | string): string => {
  if (!date) return '--:--'
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return '--:--'
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

const heroSubtitle = computed(() => {
  const since = toTime(activeService.value?.debut)
  const elapsed = formatDuration(Math.floor(elapsedTime.value / 1000))
  if (pointageStatus.value === 'working') return `En service depuis ${since} · ${elapsed}`
  if (pointageStatus.value === 'break') return `En pause depuis ${since} · ${elapsed}`

  const lastEnded = [...todayServices.value].reverse().find(s => !s.isBreak && s.fin)
  return lastEnded ? `Dernier service terminé à ${toTime(lastEnded.fin)}` : 'Aucun service en cours'
})

// Vehicle select options for Select component
const vehicleOptions = computed(() => {
  return vehiclesList.value.map(v => ({
    value: v.id || '',
    label: `${v.immat} - ${v.brand} ${v.model}`
  }))
})

// Today's date formatted
const todayDateFormatted = computed(() => {
  const today = new Date()
  return today.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  })
})

// Calculate today's worked time in real-time (excluding breaks)
const todayWorkedTime = computed(() => {
  let totalWorkMs = 0
  let totalBreakMs = 0

  for (const service of todayServices.value) {
    const startTime = service.debut ? new Date(service.debut as string | Date).getTime() : 0
    if (!startTime) continue

    if (service.isBreak) {
      // Break service - only subtract COMPLETED breaks from work time
      // Break in progress should NOT affect displayed time (time stays frozen)
      if (service.fin) {
        if (service.duree) {
          totalBreakMs += service.duree * 1000
        } else {
          const endTime = new Date(service.fin as string | Date).getTime()
          totalBreakMs += endTime - startTime
        }
      }
    } else {
      // Work service
      if (service.fin) {
        if (service.duree) {
          totalWorkMs += service.duree * 1000
        } else {
          const endTime = new Date(service.fin as string | Date).getTime()
          totalWorkMs += endTime - startTime
        }
      } else if (activeService.value && !activeService.value.isBreak) {
        // Work in progress (not on break) - use elapsedTime
        totalWorkMs += elapsedTime.value
      } else if (activeService.value?.isBreak && activeService.value.debut) {
        // Currently on break - work time frozen at break start
        const breakStart = new Date(activeService.value.debut as string | Date).getTime()
        totalWorkMs += breakStart - startTime
      }
    }
  }

  return Math.max(0, totalWorkMs - totalBreakMs)
})

// Chrono du jour au format HH:MM:SS (largeur stable, lisible d'un coup d'œil)
const todayClock = computed(() => {
  const totalSeconds = Math.floor(todayWorkedTime.value / 1000)
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
})

const countLabel = (services: ServiceDTO[]): string => {
  const nbServices = services.filter(s => !s.isBreak).length
  const nbPauses = services.filter(s => s.isBreak).length
  const parts: string[] = []
  if (nbServices > 0) parts.push(`${nbServices} service${nbServices > 1 ? 's' : ''}`)
  if (nbPauses > 0) parts.push(`${nbPauses} pause${nbPauses > 1 ? 's' : ''}`)
  return parts.join(' · ')
}

const todayCountLabel = computed(() => countLabel(todayServices.value))

// Compteurs (semaine / mois / mois dernier). Le jour est affiché en direct dans la carte d'état.
const stats = computed<{ label: string; value: string; icon: Component; iconClass: string }[]>(() => [
  { label: 'Semaine', value: formatHours(workedHours.value.week || 0), icon: CalendarDays, iconClass: 'bg-green-500/15 text-green-600 dark:text-green-400' },
  { label: 'Mois', value: formatHours(workedHours.value.month || 0), icon: CalendarRange, iconClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
  { label: 'Mois dernier', value: formatHours(workedHours.value.lastMonth || 0), icon: Calendar, iconClass: 'bg-primary/15 text-primary' },
])

// Filtres actifs (badge sur le bouton)
const activeFilterCount = computed(() => {
  let n = 0
  if (filters.value.startDate) n++
  if (filters.value.endDate) n++
  if (filters.value.isBreakString !== 'all') n++
  return n
})

// Clé de date locale (YYYY-MM-DD) — évite le décalage UTC de toISOString en soirée
const localDateKey = (date: Date): string => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// Group history by day
const historyByDay = computed((): DayGroup[] => {
  if (!history.value.length) return []

  const groups: Map<string, DayGroup> = new Map()

  for (const service of history.value) {
    if (!service.debut) continue

    const date = new Date(service.debut)
    if (Number.isNaN(date.getTime())) continue
    const dateKey = localDateKey(date)

    if (!groups.has(dateKey)) {
      const dayName = date.toLocaleDateString('fr-FR', { weekday: 'long' })
      const dateFormatted = date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })

      groups.set(dateKey, {
        date: dateKey,
        dayName,
        dateFormatted,
        totalHours: '0h 00m',
        countLabel: '',
        services: []
      })
    }

    groups.get(dateKey)?.services.push(service)
  }

  for (const group of groups.values()) {
    let totalSeconds = 0
    for (const service of group.services) {
      if (!service.isBreak && service.duree) {
        totalSeconds += service.duree
      }
    }
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    group.totalHours = `${hours}h ${minutes.toString().padStart(2, '0')}m`
    group.countLabel = countLabel(group.services)
  }

  return Array.from(groups.values()).sort((a, b) => b.date.localeCompare(a.date))
})

// Accordéon de l'historique
const isDayOpen = (date: string): boolean => openDays.value.has(date)
const toggleDay = (date: string) => {
  if (openDays.value.has(date)) openDays.value.delete(date)
  else openDays.value.add(date)
}

// Methods
const loadData = async () => {
  loading.value = true
  error.value = null

  try {
    const activeResponse = await userServicesService.getCurrentService()
    activeService.value = activeResponse?.service || null

    const hoursResponse = await userServicesService.getWorkedHours()
    workedHours.value = {
      day: hoursResponse?.day || 0,
      week: hoursResponse?.week || 0,
      month: hoursResponse?.month || 0,
      year: hoursResponse?.year || 0,
      lastMonth: hoursResponse?.lastMonth || 0
    }

    const todayResponse = await userServicesService.getDailyServices()
    todayServices.value = Array.isArray(todayResponse) ? todayResponse : []

    updateElapsedTime()
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des données'
    error.value = errorMessage
  } finally {
    loading.value = false
  }
}

const updateElapsedTime = () => {
  if (activeService.value?.debut) {
    const start = new Date(activeService.value.debut)
    const now = new Date()
    elapsedTime.value = now.getTime() - start.getTime()
  } else {
    elapsedTime.value = 0
  }
}

// État de la permission géolocalisation
const locationPermission = ref<'granted' | 'prompt' | 'denied' | 'unsupported'>('prompt')

const checkLocationPermission = async () => {
  if (!navigator.geolocation) {
    locationPermission.value = 'unsupported'
    return
  }
  if (navigator.permissions) {
    try {
      const status = await navigator.permissions.query({ name: 'geolocation' })
      locationPermission.value = status.state as 'granted' | 'prompt' | 'denied'
      // Écouter les changements de permission
      status.addEventListener('change', () => {
        locationPermission.value = status.state as 'granted' | 'prompt' | 'denied'
      })
    } catch {
      // Fallback si permissions API non supportée
    }
  }
}

const getLocationDeniedMessage = (): string => {
  const ua = navigator.userAgent
  if (/android/i.test(ua)) {
    return 'Localisation refusée. Appuyez sur le cadenas (🔒) dans la barre d\'adresse → Autorisations → Localisation → Autoriser.'
  }
  if (/iPad|iPhone|iPod/.test(ua)) {
    return 'Localisation refusée. Allez dans Réglages → Safari → Service de localisation → Autoriser.'
  }
  return 'Localisation refusée. Cliquez sur l\'icône à gauche de la barre d\'adresse → Autoriser la localisation.'
}

// Toutes les notifications de géolocalisation partagent le même id :
// une nouvelle erreur remplace la précédente au lieu de s'empiler.
const GEO_MESSAGE_ID = 'pointage-geolocation'

// L'API accepte des coordonnées null : on n'envoie pas de fausse position (0,0)
const NO_LOCATION: GpsLocationRequest = { latitude: null, longitude: null }

const showGeoError = (text: string, title?: string, duration = 7000, retryLabel?: string) => {
  messages.showMessage({
    id: GEO_MESSAGE_ID,
    text,
    title,
    variant: 'danger',
    duration,
    action: retryLabel ? { label: retryLabel, onClick: () => requestLocation() } : undefined
  })
}

// Une seule demande de position à la fois : les appels rapprochés partagent la même promesse
let pendingLocation: Promise<GpsLocationRequest> | null = null

/**
 * Demande la position GPS.
 * `silent` : pas de notification en cas d'échec (utilisé au chargement de la page,
 * la puce "Localisation refusée" de la carte d'état suffit).
 */
const requestLocation = async (options: { silent?: boolean } = {}): Promise<GpsLocationRequest> => {
  if (!navigator.geolocation) {
    locationPermission.value = 'unsupported'
    if (!options.silent) showGeoError('La géolocalisation n\'est pas disponible sur cet appareil')
    return NO_LOCATION
  }

  if (pendingLocation) return pendingLocation

  pendingLocation = new Promise<GpsLocationRequest>((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        locationPermission.value = 'granted'
        messages.removeMessage(GEO_MESSAGE_ID)
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        })
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          locationPermission.value = 'denied'
          if (!options.silent) {
            showGeoError(getLocationDeniedMessage(), 'Localisation bloquée', 12000, 'Réessayer la localisation')
          }
        } else if (err.code === err.TIMEOUT) {
          if (!options.silent) {
            showGeoError('Impossible d\'obtenir la position (délai dépassé)', undefined, 7000, 'Réessayer')
          }
        } else if (!options.silent) {
          showGeoError('Erreur de géolocalisation')
        }
        resolve(NO_LOCATION)
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    )
  }).finally(() => {
    pendingLocation = null
  })

  return pendingLocation
}

const startService = async () => {
  // Si l'utilisateur n'a pas encore saisi son kilométrage aujourd'hui,
  // on lui demande d'abord (le service démarrera après l'enregistrement).
  if (isUserRole.value && !hasEnteredKmToday.value) {
    await openRequiredKmModal()
    return
  }
  await doStartService()
}

const doStartService = async () => {
  actionLoading.value = true
  error.value = null
  try {
    const location = await requestLocation()
    const response = await userServicesService.startService(location)
    activeService.value = response
    await loadData()
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Erreur lors du démarrage du service'
    error.value = errorMessage
    messages.error(errorMessage)
  } finally {
    actionLoading.value = false
  }
}

const endService = async () => {
  actionLoading.value = true
  error.value = null
  try {
    const location = await requestLocation()
    await userServicesService.endService(location)
    activeService.value = null
    await loadData()
    // Le service terminé apparaît aussitôt dans l'historique
    loadHistory()
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'arrêt du service'
    error.value = errorMessage
    messages.error(errorMessage)
  } finally {
    actionLoading.value = false
  }
}

const startBreak = async () => {
  actionLoading.value = true
  error.value = null
  try {
    const location = await requestLocation()
    const response = await userServicesService.startBreak(location)
    activeService.value = response
    await loadData()
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Erreur lors du démarrage de la pause'
    error.value = errorMessage
    messages.error(errorMessage)
  } finally {
    actionLoading.value = false
  }
}

const endBreak = async () => {
  actionLoading.value = true
  error.value = null
  try {
    const location = await requestLocation()
    const response = await userServicesService.endBreak(location)
    activeService.value = response
    await loadData()
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la fin de la pause'
    error.value = errorMessage
    messages.error(errorMessage)
  } finally {
    actionLoading.value = false
  }
}

const loadHistory = async () => {
  historyLoading.value = true
  try {
    let isBreak: boolean | undefined = undefined
    if (filters.value.isBreakString === 'pause') isBreak = true
    else if (filters.value.isBreakString === 'service') isBreak = false

    const response = await userServicesService.getServiceHistory({
      startDate: filters.value.startDate,
      endDate: filters.value.endDate,
      isBreak,
      page: currentPage.value,
      size: filters.value.size
    })

    history.value = response.content || []
    totalPages.value = response.totalPages || 0
    totalElements.value = response.totalElements || 0

    // Par défaut, seul le jour le plus récent est déplié
    const next = new Set<string>()
    const first = historyByDay.value[0]
    if (first) next.add(first.date)
    openDays.value = next
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement de l\'historique'
    messages.error(errorMessage)
  } finally {
    historyLoading.value = false
  }
}

const applyFilters = () => {
  currentPage.value = 0
  showFilters.value = false
  loadHistory()
}

const resetFilters = () => {
  filters.value = {
    startDate: '',
    endDate: '',
    isBreak: undefined,
    isBreakString: 'all',
    page: 0,
    size: 20
  }
  currentPage.value = 0
  showFilters.value = false
  loadHistory()
}

const changePage = (page: number) => {
  currentPage.value = page
  loadHistory()
}

// Kilométrage functions
// Vérifie le statut du kilométrage du jour SANS ouvrir le popup.
// Le popup obligatoire ne s'affiche que lors du clic sur "Démarrer le service".
const checkKilometrage = async () => {
  if (!isUserRole.value) {
    hasEnteredKmToday.value = true
    return
  }

  try {
    const response = await usersService.getMyLastKilometrage()
    hasEnteredKmToday.value = response.hasEnteredToday

    if (response.lastKilometrage?.vehiculeId) {
      lastUsedVehicleId.value = response.lastKilometrage.vehiculeId
    }
  } catch {
    // En cas d'erreur, on ne bloque pas l'utilisateur
    hasEnteredKmToday.value = true
  }
}

// Ouvre le popup obligatoire de saisie du kilométrage (avant de démarrer le service)
const openRequiredKmModal = async () => {
  await loadVehicles()
  selectedVehicleId.value = lastUsedVehicleId.value || ''
  kmValue.value = null
  kmError.value = ''
  isKmModalRequired.value = true
  showKmModal.value = true
  focusKmInput()
}

const loadVehicles = async () => {
  try {
    loadingVehicles.value = true
    const response = await vehiclesService.getVehicles()
    vehiclesList.value = response.vehicules || []
  } catch {
    kmError.value = 'Erreur lors du chargement des véhicules'
  } finally {
    loadingVehicles.value = false
  }
}

const submitKilometrage = async () => {
  kmError.value = ''

  if (!selectedVehicleId.value) {
    kmError.value = 'Veuillez sélectionner un véhicule'
    return
  }

  if (!kmValue.value || kmValue.value <= 0) {
    kmError.value = 'Veuillez entrer un kilométrage valide'
    return
  }

  try {
    savingKm.value = true
    await vehiclesService.addKilometrage({
      vehiculeId: selectedVehicleId.value,
      km: kmValue.value
    })

    hasEnteredKmToday.value = true
    lastUsedVehicleId.value = selectedVehicleId.value
    const wasRequired = isKmModalRequired.value
    showKmModal.value = false
    isKmModalRequired.value = false
    messages.success('Kilométrage enregistré avec succès')

    selectedVehicleId.value = ''
    kmValue.value = null

    // Si la saisie était requise pour démarrer le service, on le démarre maintenant
    if (wasRequired) {
      await doStartService()
    }
  } catch (err: unknown) {
    kmError.value = err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement du kilométrage'
  } finally {
    savingKm.value = false
  }
}

const focusKmInput = () => {
  setTimeout(() => {
    kmInputRef.value?.$el?.focus()
  }, 100)
}

const openKmModal = async () => {
  if (vehiclesList.value.length === 0) {
    await loadVehicles()
  }

  if (!lastUsedVehicleId.value) {
    try {
      const response = await usersService.getMyLastKilometrage()
      if (response.lastKilometrage?.vehiculeId) {
        lastUsedVehicleId.value = response.lastKilometrage.vehiculeId
      }
    } catch {
      // Ignorer les erreurs de récupération du dernier kilométrage
    }
  }

  selectedVehicleId.value = lastUsedVehicleId.value || ''
  kmValue.value = null
  kmError.value = ''
  isKmModalRequired.value = false
  showKmModal.value = true
  focusKmInput()
}

// Lifecycle
onMounted(async () => {
  // Vérifier/demander la permission de géolocalisation dès le chargement
  await checkLocationPermission()
  if (locationPermission.value === 'prompt') {
    // Déclencher le prompt du navigateur immédiatement, sans notification en cas de refus :
    // la puce "Localisation refusée" de la carte d'état prend le relais.
    requestLocation({ silent: true })
  }

  await checkKilometrage()

  loadData()
  loadHistory()

  elapsedTimeInterval = setInterval(() => {
    if (activeService.value) {
      updateElapsedTime()
    }
  }, 1000)
})

onUnmounted(() => {
  if (elapsedTimeInterval) {
    clearInterval(elapsedTimeInterval)
  }
})
</script>
