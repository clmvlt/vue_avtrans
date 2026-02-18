<template>
  <div class="min-h-screen bg-background">
    <!-- Header -->
    <header class="sticky top-0 z-40 border-b bg-background">
      <div class="mx-auto flex max-w-[1000px] items-center gap-4 px-6 py-4">
        <Retour fallback="/" />
        <h1 class="flex-1 text-xl font-bold text-foreground">Pointage</h1>
        <Button variant="outline" size="sm" @click="openKmModal">
          <Gauge class="size-4" />
          Kilométrage
        </Button>
      </div>
    </header>

    <main class="px-6 py-6 max-sm:px-3 max-sm:py-3">
      <div class="mx-auto max-w-[1000px]">
        <!-- Loading State -->
        <div v-if="loading && !activeService" class="flex flex-col items-center justify-center gap-4 py-16">
          <LoaderCircle class="size-10 animate-spin text-primary" />
          <p class="text-lg text-muted-foreground">Chargement...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="mb-4 rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
          {{ error }}
        </div>

        <!-- Main Content -->
        <div v-else class="space-y-6">
          <!-- Current Status Card -->
          <div class="rounded-lg border bg-card p-6 shadow-sm max-md:p-4">
            <div class="mb-5 flex items-center justify-between">
              <h2 class="text-xl font-semibold text-foreground">État actuel</h2>
              <Badge
                :variant="!activeService ? 'secondary' : 'outline'"
                :class="activeService && !activeService.isBreak
                  ? 'border-green-500/50 text-green-600 dark:text-green-400'
                  : activeService?.isBreak
                    ? 'border-amber-500/50 text-amber-600 dark:text-amber-400'
                    : ''"
              >
                {{ statusText }}
              </Badge>
            </div>

            <!-- Action Buttons -->
            <div class="flex flex-col gap-3">
              <template v-if="!activeService">
                <Button
                  class="h-14 w-full bg-green-600 text-base text-white hover:bg-green-700"
                  size="lg"
                  :disabled="actionLoading"
                  @click="startService"
                >
                  <LoaderCircle v-if="actionLoading" class="size-4 animate-spin" />
                  <Play v-else class="size-4" />
                  Démarrer le service
                </Button>
              </template>

              <template v-else-if="!activeService.isBreak">
                <Button
                  class="h-14 w-full bg-amber-600 text-base text-white hover:bg-amber-700"
                  size="lg"
                  :disabled="actionLoading"
                  @click="startBreak"
                >
                  <LoaderCircle v-if="actionLoading" class="size-4 animate-spin" />
                  <Pause v-else class="size-4" />
                  Commencer une pause
                </Button>
                <Button
                  class="h-14 w-full bg-rose-600 text-base text-white hover:bg-rose-700"
                  size="lg"
                  :disabled="actionLoading"
                  @click="endService"
                >
                  <LoaderCircle v-if="actionLoading" class="size-4 animate-spin" />
                  <Square v-else class="size-4" />
                  Terminer le service
                </Button>
              </template>

              <template v-else>
                <Button
                  class="h-14 w-full bg-green-600 text-base text-white hover:bg-green-700"
                  size="lg"
                  :disabled="actionLoading"
                  @click="endBreak"
                >
                  <LoaderCircle v-if="actionLoading" class="size-4 animate-spin" />
                  <Play v-else class="size-4" />
                  Reprendre le service
                </Button>
              </template>
            </div>
          </div>

          <!-- Hours Summary -->
          <section class="grid grid-cols-4 gap-4 max-md:grid-cols-2 max-md:gap-3">
            <div class="flex items-center gap-3 rounded-lg border bg-card p-4 max-md:p-3">
              <div class="flex size-10 shrink-0 items-center justify-center rounded-md bg-violet-500/15 text-violet-500 max-md:size-9">
                <Sun class="size-5" />
              </div>
              <div class="flex min-w-0 flex-col gap-0.5">
                <span class="text-xs uppercase tracking-wide text-muted-foreground">Jour</span>
                <span class="font-mono text-lg font-bold text-foreground max-md:text-base">{{ formatHours(workedHours.day || 0) }}</span>
              </div>
            </div>
            <div class="flex items-center gap-3 rounded-lg border bg-card p-4 max-md:p-3">
              <div class="flex size-10 shrink-0 items-center justify-center rounded-md bg-green-500/15 text-green-500 max-md:size-9">
                <CalendarDays class="size-5" />
              </div>
              <div class="flex min-w-0 flex-col gap-0.5">
                <span class="text-xs uppercase tracking-wide text-muted-foreground">Semaine</span>
                <span class="font-mono text-lg font-bold text-foreground max-md:text-base">{{ formatHours(workedHours.week || 0) }}</span>
              </div>
            </div>
            <div class="flex items-center gap-3 rounded-lg border bg-card p-4 max-md:p-3">
              <div class="flex size-10 shrink-0 items-center justify-center rounded-md bg-amber-500/15 text-amber-500 max-md:size-9">
                <CalendarRange class="size-5" />
              </div>
              <div class="flex min-w-0 flex-col gap-0.5">
                <span class="text-xs uppercase tracking-wide text-muted-foreground">Mois</span>
                <span class="font-mono text-lg font-bold text-foreground max-md:text-base">{{ formatHours(workedHours.month || 0) }}</span>
              </div>
            </div>
            <div class="flex items-center gap-3 rounded-lg border bg-card p-4 max-md:p-3">
              <div class="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary max-md:size-9">
                <Calendar class="size-5" />
              </div>
              <div class="flex min-w-0 flex-col gap-0.5">
                <span class="text-xs uppercase tracking-wide text-muted-foreground">Mois dernier</span>
                <span class="font-mono text-lg font-bold text-foreground max-md:text-base">{{ formatHours(workedHours.lastMonth || 0) }}</span>
              </div>
            </div>
          </section>

          <!-- Today's Services -->
          <section class="overflow-hidden rounded-lg border bg-card shadow-sm">
            <div class="flex items-center justify-between border-b bg-muted/50 px-5 py-4 max-sm:flex-col max-sm:gap-2 max-sm:text-center max-md:px-4 max-md:py-3">
              <div class="flex flex-col gap-1 max-sm:items-center">
                <h2 class="text-lg font-semibold text-foreground">Aujourd'hui</h2>
                <span class="text-sm capitalize text-muted-foreground">{{ todayDateFormatted }}</span>
              </div>
              <div class="flex flex-wrap items-center justify-center gap-2 rounded-md bg-background px-4 py-2 text-sm text-primary max-md:gap-1 max-md:px-3">
                <Clock class="size-4" />
                <span class="font-mono text-lg font-bold max-md:text-base">{{ todayWorkedTimeFormatted }}</span>
                <span
                  v-if="activeService && !activeService.isBreak"
                  class="ml-2 flex items-center gap-1 border-l border-border pl-2 text-xs font-medium text-green-600 max-md:ml-0 max-md:w-full max-md:justify-center max-md:border-l-0 max-md:pl-0 max-md:mt-1"
                >
                  <span class="size-2 animate-pulse rounded-full bg-green-500"></span>
                  En cours
                </span>
              </div>
            </div>

            <div v-if="todayServices.length === 0" class="flex flex-col items-center justify-center gap-3 py-8">
              <ClipboardList class="size-8 text-muted-foreground" />
              <p class="text-sm text-muted-foreground">Aucun service enregistré aujourd'hui</p>
            </div>

            <div v-else class="flex flex-col gap-2 p-3 max-md:p-2">
              <div
                v-for="service in todayServices"
                :key="service.uuid"
                class="flex items-center gap-3 rounded-md bg-muted/50 px-4 py-3 transition-colors hover:bg-muted max-md:px-3 max-md:py-2"
              >
                <div
                  class="h-8 w-1 shrink-0 rounded-full"
                  :class="service.isBreak ? 'bg-amber-500' : 'bg-green-500'"
                ></div>
                <div class="flex flex-1 items-center justify-between gap-3 max-md:flex-col max-md:items-start">
                  <div class="flex items-center gap-2 font-mono">
                    <Badge v-if="service.isBreak" variant="outline" class="border-amber-500/50 font-sans text-xs text-amber-600 dark:text-amber-400">Pause</Badge>
                    <span class="font-medium text-foreground">{{ formatTime(service.debut) }}</span>
                    <ArrowRight class="size-3 text-muted-foreground" />
                    <span class="font-medium text-foreground">{{ service.fin ? formatTime(service.fin) : 'En cours' }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <Button
                      v-if="hasValidLocation(service)"
                      variant="ghost"
                      size="icon-sm"
                      @click="showLocationMap(service, formatTime)"
                      title="Localisation"
                    >
                      <MapPin class="size-4" />
                    </Button>
                    <span class="whitespace-nowrap font-mono text-sm text-muted-foreground">{{ getServiceDuration(service) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- History Section -->
          <section class="space-y-4">
            <div class="flex items-center justify-between">
              <h2 class="text-xl font-semibold text-foreground max-md:text-lg">Historique</h2>
              <Button
                :variant="showFilters ? 'default' : 'ghost'"
                size="sm"
                @click="showFilters = !showFilters"
              >
                <Filter class="size-4" />
                {{ showFilters ? 'Masquer' : 'Filtres' }}
              </Button>
            </div>

            <!-- Filters Panel -->
            <Transition
              enter-active-class="transition duration-200 ease-out"
              enter-from-class="scale-[0.98] opacity-0"
              enter-to-class="scale-100 opacity-100"
              leave-active-class="transition duration-150 ease-in"
              leave-from-class="scale-100 opacity-100"
              leave-to-class="scale-[0.98] opacity-0"
            >
              <div v-if="showFilters" class="rounded-lg border bg-card p-4">
                <div class="mb-4 grid grid-cols-3 gap-4 max-md:grid-cols-1">
                  <div class="flex flex-col gap-2">
                    <label class="text-sm font-medium text-muted-foreground">Date de début</label>
                    <Input type="date" v-model="filters.startDate" />
                  </div>
                  <div class="flex flex-col gap-2">
                    <label class="text-sm font-medium text-muted-foreground">Date de fin</label>
                    <Input type="date" v-model="filters.endDate" />
                  </div>
                  <div class="flex flex-col gap-2">
                    <Select
                      v-model="filters.isBreakString"
                      label="Type"
                      :options="typeFilterOptions"
                      :searchable="false"
                    />
                  </div>
                </div>
                <div class="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" @click="resetFilters">Réinitialiser</Button>
                  <Button variant="default" size="sm" @click="loadHistory">Appliquer</Button>
                </div>
              </div>
            </Transition>

            <!-- History Loading -->
            <div v-if="historyLoading" class="flex items-center justify-center gap-3 py-8">
              <LoaderCircle class="size-6 animate-spin text-primary" />
              <p class="text-muted-foreground">Chargement de l'historique...</p>
            </div>

            <!-- History Empty -->
            <div v-else-if="historyByDay.length === 0" class="rounded-lg border bg-card p-12 text-center max-sm:p-8">
              <ClipboardList class="mx-auto mb-4 size-12 text-muted-foreground max-sm:size-9" />
              <p class="text-muted-foreground">Aucun service trouvé</p>
            </div>

            <!-- History grouped by day -->
            <div v-else class="flex flex-col gap-4">
              <div v-for="day in historyByDay" :key="day.date" class="overflow-hidden rounded-lg border bg-card">
                <div class="flex items-center justify-between border-b bg-muted/50 px-5 py-4 max-md:px-4 max-md:py-3">
                  <div class="flex flex-col gap-1">
                    <span class="font-semibold capitalize text-foreground">{{ day.dayName }}</span>
                    <span class="text-sm text-muted-foreground">{{ day.dateFormatted }}</span>
                  </div>
                  <div class="flex items-center gap-2 rounded-md bg-background px-3 py-2 text-sm font-semibold text-primary">
                    <Clock class="size-4" />
                    <span>{{ day.totalHours }}</span>
                  </div>
                </div>

                <div class="flex flex-col gap-2 p-3 max-md:p-2">
                  <div
                    v-for="service in day.services"
                    :key="service.uuid"
                    class="flex items-center gap-3 rounded-md bg-muted/50 px-4 py-3 transition-colors hover:bg-muted max-md:px-3 max-md:py-2"
                  >
                    <div
                      class="h-8 w-1 shrink-0 rounded-full"
                      :class="service.isBreak ? 'bg-amber-500' : 'bg-green-500'"
                    ></div>
                    <div class="flex flex-1 items-center justify-between gap-3 max-md:flex-col max-md:items-start">
                      <div class="flex items-center gap-2 font-mono">
                        <Badge v-if="service.isBreak" variant="outline" class="border-amber-500/50 font-sans text-xs text-amber-600 dark:text-amber-400">Pause</Badge>
                        <span class="font-medium text-foreground">{{ formatTime(service.debut) }}</span>
                        <ArrowRight class="size-3 text-muted-foreground" />
                        <span class="font-medium text-foreground">{{ service.fin ? formatTime(service.fin) : '--:--' }}</span>
                      </div>
                      <div class="flex items-center gap-2">
                        <Button
                          v-if="hasValidLocation(service)"
                          variant="ghost"
                          size="icon-sm"
                          @click="showLocationMap(service, formatTime)"
                          title="Localisation"
                        >
                          <MapPin class="size-4" />
                        </Button>
                        <span class="whitespace-nowrap font-mono text-sm text-muted-foreground">{{ formatDurationFromSeconds(service.duree || 0) }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Pagination -->
            <div v-if="!historyLoading && totalPages > 1" class="flex items-center justify-between rounded-lg border bg-card p-4 max-md:flex-col max-md:gap-3">
              <span class="text-sm text-muted-foreground">
                Page {{ currentPage + 1 }}/{{ totalPages }}
                <span class="opacity-60">({{ totalElements }})</span>
              </span>
              <div class="flex gap-1">
                <Button variant="ghost" size="icon-sm" @click="changePage(0)" :disabled="currentPage === 0">
                  <ChevronsLeft class="size-4" />
                </Button>
                <Button variant="ghost" size="icon-sm" @click="changePage(currentPage - 1)" :disabled="currentPage === 0">
                  <ChevronLeft class="size-4" />
                </Button>
                <Button variant="ghost" size="icon-sm" @click="changePage(currentPage + 1)" :disabled="currentPage === totalPages - 1">
                  <ChevronRight class="size-4" />
                </Button>
                <Button variant="ghost" size="icon-sm" @click="changePage(totalPages - 1)" :disabled="currentPage === totalPages - 1">
                  <ChevronsRight class="size-4" />
                </Button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>

    <!-- Kilometrage Modal -->
    <Dialog :open="showKmModal" @update:open="(v: boolean) => { if (!v && isKmModalRequired) return; showKmModal = v }">
      <DialogContent class="sm:max-w-md" :show-close-button="!isKmModalRequired">
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

    <!-- Map Modal -->
    <Dialog v-model:open="showMapModal">
      <DialogContent class="gap-0 p-0 sm:max-w-[600px]">
        <DialogHeader class="px-5 pt-5">
          <div class="flex items-center gap-3">
            <MapPin class="size-5 text-primary" />
            <DialogTitle>Localisation</DialogTitle>
          </div>
        </DialogHeader>
        <div class="flex items-center justify-between border-y bg-muted/50 px-5 py-3 text-sm max-sm:flex-col max-sm:items-start max-sm:gap-1">
          <span class="font-medium text-foreground">{{ mapServiceTime }}</span>
          <span class="font-mono text-muted-foreground">{{ mapCoords }}</span>
        </div>
        <div ref="mapContainer" class="h-[350px] w-full max-sm:h-[280px]"></div>
        <DialogFooter class="px-5 pb-5 pt-4">
          <Button @click="showMapModal = false">Fermer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { userServicesService, type WorkedHoursDTO, type GpsLocationRequest } from '@/services/userServices'
import { usersService, vehiclesService } from '@/services'
import type { ServiceDTO, VehiculeDTO } from '@/models'
import { useMessages } from '@/composables/useMessages'
import { useMapModal } from '@/composables/useMapModal'
import { useAuthStore } from '@/stores/auth'
import { USER_ROLE_UUIDS } from '@/enums'
import { Retour } from '@/components/ui/retour'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import {
  Gauge, Play, Pause, Square, Sun, CalendarDays, CalendarRange,
  Calendar, Clock, ClipboardList, ArrowRight, MapPin, Filter,
  Check, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight,
  LoaderCircle
} from 'lucide-vue-next'

const messages = useMessages()
const authStore = useAuthStore()

// Computed pour vérifier si l'utilisateur a le rôle "User" (pas mécanicien ni admin)
const isUserRole = computed(() => {
  return authStore.userRoleUuid === USER_ROLE_UUIDS.UTILISATEUR
})

// Map modal
const {
  showMapModal,
  mapContainer,
  mapServiceTime,
  mapCoords,
  showLocationMap,
} = useMapModal()

// Helper to check if service has valid location
const hasValidLocation = (service: ServiceDTO): boolean => {
  return !!(service.latitude && service.longitude)
}

// Types
interface DayGroup {
  date: string
  dayName: string
  dateFormatted: string
  totalHours: string
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

// Computed
const statusText = computed(() => {
  if (!activeService.value) return 'Hors service'
  return activeService.value.isBreak ? 'En pause' : 'En service'
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
      // Note: we don't add break in progress - work time stays frozen
    } else {
      // Work service
      if (service.fin) {
        // Completed work service
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

// Format today's worked time (avec secondes)
const todayWorkedTimeFormatted = computed(() => {
  return formatDuration(todayWorkedTime.value, true)
})

// Get duration for a service (real-time for active service)
const getServiceDuration = (service: ServiceDTO): string => {
  if (service.fin) {
    return formatDurationFromSeconds(service.duree || 0)
  } else if (activeService.value && service.uuid === activeService.value.uuid) {
    return formatDuration(elapsedTime.value)
  }
  return '--:--'
}

// Group history by day
const historyByDay = computed((): DayGroup[] => {
  if (!history.value.length) return []

  const groups: Map<string, DayGroup> = new Map()

  for (const service of history.value) {
    if (!service.debut) continue

    const date = new Date(service.debut)
    const dateKey = date.toISOString().split('T')[0] || ''

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
        services: []
      })
    }

    const group = groups.get(dateKey)
    if (group) {
      group.services.push(service)
    }
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
  }

  return Array.from(groups.values()).sort((a, b) => b.date.localeCompare(a.date))
})

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

const requestLocation = (): Promise<GpsLocationRequest> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ latitude: 0, longitude: 0 })
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        })
      },
      () => {
        resolve({ latitude: 0, longitude: 0 })
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  })
}

const startService = async () => {
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
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement de l\'historique'
    error.value = errorMessage
    messages.error(errorMessage)
  } finally {
    historyLoading.value = false
  }
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
  loadHistory()
}

const changePage = (page: number) => {
  currentPage.value = page
  loadHistory()
}

// Formatters
const formatTime = (date: Date | string | undefined): string => {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatDuration = (milliseconds: number, showSeconds = false): string => {
  if (milliseconds < 0) milliseconds = 0

  const totalSeconds = Math.floor(milliseconds / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  // Moins d'une minute : afficher en secondes
  if (hours === 0 && minutes === 0) {
    return `${seconds} s`
  }

  // Moins d'une heure : afficher minutes et secondes
  if (hours === 0) {
    return showSeconds && seconds > 0 ? `${minutes} min ${seconds} s` : `${minutes} min`
  }

  // Une heure ou plus : afficher heures et minutes
  if (showSeconds && seconds > 0) {
    return `${hours}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`
  }
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
}

const formatDurationFromSeconds = (seconds: number): string => {
  if (seconds < 0) seconds = 0

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  // Moins d'une minute : afficher en secondes
  if (hours === 0 && minutes === 0) {
    return `${secs} s`
  }

  // Moins d'une heure : afficher minutes et secondes
  if (hours === 0) {
    return secs > 0 ? `${minutes} min ${secs} s` : `${minutes} min`
  }

  // Une heure ou plus : afficher heures et minutes
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
}

const formatHours = (hours: number): string => {
  // Convertir en secondes totales pour un calcul précis
  const totalSeconds = Math.round(hours * 3600)
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60

  // Moins d'une minute : afficher en secondes
  if (h === 0 && m === 0) {
    return `${s} s`
  }

  // Moins d'une heure : afficher minutes et secondes
  if (h === 0) {
    return s > 0 ? `${m} min ${s} s` : `${m} min`
  }

  // Une heure ou plus : afficher heures et minutes
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

// Kilométrage functions
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

    if (!response.hasEnteredToday) {
      await loadVehicles()
      if (lastUsedVehicleId.value) {
        selectedVehicleId.value = lastUsedVehicleId.value
      }
      isKmModalRequired.value = true
      showKmModal.value = true
      focusKmInput()
    }
  } catch {
    // En cas d'erreur, on ne bloque pas l'utilisateur
  }
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
    showKmModal.value = false
    messages.success('Kilométrage enregistré avec succès')

    selectedVehicleId.value = ''
    kmValue.value = null
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
