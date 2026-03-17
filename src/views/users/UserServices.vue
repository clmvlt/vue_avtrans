<template>
  <div class="min-h-screen bg-background">
    <main class="px-4 py-4 md:px-6 md:py-6">
      <div class="mx-auto max-w-[1200px] space-y-6">
        <!-- User name header -->
        <div v-if="userName" class="flex items-center gap-3">
          <div class="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <User class="size-5" />
          </div>
          <h1 class="text-xl font-bold text-foreground">{{ userName }}</h1>
        </div>

        <!-- Status card -->
        <div class="rounded-lg border bg-card p-5 shadow-sm">
          <div class="mb-4 flex flex-wrap items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <span class="text-sm text-muted-foreground">Statut actuel</span>
              <Badge
                :variant="userStatus === 'ABSENT' ? 'secondary' : 'outline'"
                :class="getStatusBadgeClass(userStatus)"
              >
                <span
                  class="mr-2 inline-block size-2 rounded-full"
                  :class="getStatusDotClass(userStatus)"
                />
                {{ getStatusText(userStatus) }}
              </Badge>
            </div>
            <div v-if="activeServiceStart" class="flex items-center gap-2 text-sm text-muted-foreground">
              <Play class="size-4 text-green-500" />
              <span>Depuis {{ formatTime(activeServiceStart) }}</span>
              <span class="rounded bg-muted px-2 py-0.5 font-mono font-medium">{{ calculateDuration(activeServiceStart) }}</span>
            </div>
          </div>
          <div class="flex flex-wrap gap-3">
            <!-- No active service -->
            <Button
              v-if="userStatus === 'ABSENT'"
              class="bg-green-600 text-white hover:bg-green-700"
              @click="startService"
              :disabled="actionLoading"
            >
              <LoaderCircle v-if="actionLoading" class="mr-2 size-4 animate-spin" />
              <Play v-else class="mr-2 size-4" />
              Demarrer le service
            </Button>

            <!-- Active service (not on break) -->
            <template v-else-if="userStatus === 'PRESENT'">
              <Button
                class="bg-amber-500 text-white hover:bg-amber-600"
                @click="startBreak"
                :disabled="actionLoading"
              >
                <LoaderCircle v-if="actionLoading" class="mr-2 size-4 animate-spin" />
                <Pause v-else class="mr-2 size-4" />
                Demarrer une pause
              </Button>
              <Button
                variant="destructive"
                @click="endService"
                :disabled="actionLoading"
              >
                <LoaderCircle v-if="actionLoading" class="mr-2 size-4 animate-spin" />
                <Square v-else class="mr-2 size-4" />
                Terminer le service
              </Button>
            </template>

            <!-- On break -->
            <template v-else-if="userStatus === 'ON_BREAK'">
              <Button
                class="bg-amber-500 text-white hover:bg-amber-600"
                @click="endBreak"
                :disabled="actionLoading"
              >
                <LoaderCircle v-if="actionLoading" class="mr-2 size-4 animate-spin" />
                <Play v-else class="mr-2 size-4" />
                Terminer la pause
              </Button>
            </template>
          </div>
        </div>

        <!-- Stats cards -->
        <div v-if="hours" class="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
          <div class="flex items-center gap-3 rounded-lg border bg-card p-3 shadow-sm transition-shadow hover:shadow-md sm:gap-4 sm:p-5">
            <div class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500 sm:size-10">
              <Sun class="size-4 sm:size-5" />
            </div>
            <div>
              <p class="text-[10px] uppercase tracking-wide text-muted-foreground sm:text-xs">Aujourd'hui</p>
              <p class="font-mono text-lg font-bold text-foreground sm:text-xl">{{ formatHoursMinutes(hours.day) }}</p>
            </div>
          </div>
          <div class="flex items-center gap-3 rounded-lg border bg-card p-3 shadow-sm transition-shadow hover:shadow-md sm:gap-4 sm:p-5">
            <div class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-green-500/10 text-green-500 sm:size-10">
              <CalendarDays class="size-4 sm:size-5" />
            </div>
            <div>
              <p class="text-[10px] uppercase tracking-wide text-muted-foreground sm:text-xs">Semaine</p>
              <p class="font-mono text-lg font-bold text-foreground sm:text-xl">{{ formatHoursMinutes(hours.week) }}</p>
            </div>
          </div>
          <div class="flex items-center gap-3 rounded-lg border bg-card p-3 shadow-sm transition-shadow hover:shadow-md sm:gap-4 sm:p-5">
            <div class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500 sm:size-10">
              <CalendarRange class="size-4 sm:size-5" />
            </div>
            <div>
              <p class="text-[10px] uppercase tracking-wide text-muted-foreground sm:text-xs">Mois</p>
              <p class="font-mono text-lg font-bold text-foreground sm:text-xl">{{ formatHoursMinutes(hours.month) }}</p>
            </div>
          </div>
          <div class="flex items-center gap-3 rounded-lg border bg-card p-3 shadow-sm transition-shadow hover:shadow-md sm:gap-4 sm:p-5">
            <div class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary sm:size-10">
              <Calendar class="size-4 sm:size-5" />
            </div>
            <div>
              <p class="text-[10px] uppercase tracking-wide text-muted-foreground sm:text-xs">Mois dernier</p>
              <p class="font-mono text-lg font-bold text-foreground sm:text-xl">{{ formatHoursMinutes(hours.lastMonth) }}</p>
            </div>
          </div>
        </div>

        <!-- Filters -->
        <div class="space-y-4">
          <div class="flex flex-wrap items-center gap-2">
            <Button
              :variant="hasActiveFilters ? 'default' : 'outline'"
              size="sm"
              @click="showFilters = !showFilters"
            >
              <Filter class="mr-2 size-4" />
              {{ showFilters ? 'Masquer' : 'Filtres' }}
              <span v-if="hasActiveFilters" class="ml-1 font-bold text-amber-300">!</span>
            </Button>
            <Button size="sm" @click="openCreateModal">
              <Plus class="mr-2 size-4" />
              Ajouter un service
            </Button>
          </div>

          <div v-if="showFilters" class="rounded-lg border bg-card p-4">
            <div class="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div class="flex flex-col gap-2">
                <label class="text-sm font-medium text-muted-foreground">Date de debut</label>
                <Input type="date" v-model="searchFilters.startDate" />
              </div>
              <div class="flex flex-col gap-2">
                <label class="text-sm font-medium text-muted-foreground">Date de fin</label>
                <Input type="date" v-model="searchFilters.endDate" />
              </div>
              <div class="flex flex-col gap-2">
                <Select
                  v-model="searchFilters.isBreakString"
                  label="Type"
                  :options="selectTypeOptions"
                  :searchable="false"
                />
              </div>
            </div>
            <div class="flex justify-end gap-2">
              <Button variant="ghost" size="sm" @click="resetFilters">Reinitialiser</Button>
              <Button size="sm" @click="applyFilters">Appliquer</Button>
            </div>
          </div>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="flex flex-col items-center justify-center gap-4 py-16">
          <LoaderCircle class="size-10 animate-spin text-primary" />
          <p class="text-lg text-muted-foreground">Chargement des services...</p>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="flex flex-col items-center gap-4 py-12">
          <CircleAlert class="size-10 text-destructive" />
          <p class="text-muted-foreground">{{ error }}</p>
          <Button size="sm" @click="loadServices()">Reessayer</Button>
        </div>

        <!-- Services grouped by day -->
        <div v-else-if="servicesByDay.length > 0" class="space-y-6">
          <div v-for="day in servicesByDay" :key="day.date" class="overflow-hidden rounded-lg border bg-card shadow-sm">
            <div class="flex items-center justify-between border-b bg-muted/50 px-5 py-4">
              <div class="flex flex-col gap-0.5">
                <span class="font-semibold capitalize text-foreground">{{ day.dayName }}</span>
                <span class="text-sm text-muted-foreground">{{ day.dateFormatted }}</span>
              </div>
              <div class="flex items-center gap-3">
                <div class="flex items-center gap-2 rounded-md bg-background px-3 py-1.5 text-sm font-semibold text-primary">
                  <Clock class="size-4" />
                  <span>{{ day.totalHours }}</span>
                </div>
                <Button
                  size="sm"
                  class="bg-primary text-primary-foreground hover:bg-primary/90"
                  @click="openCreateModalForDate(day.date)"
                >
                  <Plus class="mr-1.5 size-4" />
                  Ajouter un service
                </Button>
              </div>
            </div>

            <div class="flex flex-col gap-2 p-3">
              <!-- All services in chronological order -->
              <div
                v-for="service in day.allServices"
                :key="service.uuid"
                class="flex items-center gap-3 rounded-md p-3 transition-colors hover:bg-muted/50"
              >
                <div class="h-8 w-1 shrink-0 rounded-full" :class="service.isBreak ? 'bg-amber-500' : 'bg-green-500'" />
                <div class="flex flex-1 items-center justify-between gap-3">
                  <div class="flex flex-wrap items-center gap-2 font-mono text-sm">
                    <Badge v-if="service.isBreak" variant="outline" class="border-amber-500/50 font-sans text-amber-600 dark:text-amber-400">Pause</Badge>
                    <span class="font-medium text-foreground">{{ formatTime(service.debut) }}</span>
                    <ArrowRight class="size-3 text-muted-foreground" />
                    <span class="font-medium text-foreground">{{ formatTime(service.fin) || '--:--' }}</span>
                    <Badge v-if="!service.fin" variant="outline" class="border-green-500/50 font-sans text-green-600 animate-pulse dark:text-green-400">En cours</Badge>
                  </div>
                  <span v-if="service.duree" class="font-mono text-sm text-muted-foreground">{{ formatDuration(service.duree) }}</span>
                </div>
                <!-- Desktop actions -->
                <div class="hidden shrink-0 gap-1 md:flex">
                  <Button
                    v-if="hasLocationData(service)"
                    variant="ghost"
                    size="icon-sm"
                    @click="showLocationMap(service, formatTime)"
                    title="Localisation"
                    :class="isLocationInvalid(service) ? 'text-destructive hover:text-destructive' : ''"
                  >
                    <MapPin class="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    @click="editService(service)"
                    title="Modifier"
                  >
                    <Pencil class="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    class="hover:text-destructive"
                    @click="confirmDelete(service)"
                    title="Supprimer"
                  >
                    <Trash2 class="size-3.5" />
                  </Button>
                </div>
                <!-- Mobile actions -->
                <DropdownMenu>
                  <DropdownMenuTrigger as-child class="md:hidden">
                    <Button variant="ghost" size="icon-sm">
                      <MoreVertical class="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" class="w-44">
                    <DropdownMenuItem v-if="hasLocationData(service)" @click="showLocationMap(service, formatTime)" :class="isLocationInvalid(service) ? 'text-destructive focus:text-destructive' : ''">
                      <MapPin class="mr-2 size-4" />
                      Localisation
                    </DropdownMenuItem>
                    <DropdownMenuItem @click="editService(service)">
                      <Pencil class="mr-2 size-4" />
                      Modifier
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem class="text-destructive focus:text-destructive" @click="confirmDelete(service)">
                      <Trash2 class="mr-2 size-4" />
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <div v-else class="flex flex-col items-center justify-center gap-4 py-16">
          <ClipboardList class="size-10 text-muted-foreground opacity-50" />
          <p class="text-muted-foreground">Aucun service trouve</p>
          <Button @click="openCreateModal">
            <Plus class="mr-2 size-4" />
            Ajouter un service
          </Button>
        </div>

        <!-- Pagination -->
        <div v-if="!loading && services.length > 0" class="flex items-center justify-between rounded-lg border bg-card p-4">
          <span class="text-sm text-muted-foreground">
            Page {{ pagination.page + 1 }}/{{ pagination.totalPages }}
            <span class="text-muted-foreground/60">({{ pagination.totalElements }})</span>
          </span>
          <div class="flex gap-1">
            <Button variant="ghost" size="icon-sm" @click="goToPage(0)" :disabled="pagination.first">
              <ChevronsLeft class="size-4" />
            </Button>
            <Button variant="ghost" size="icon-sm" @click="goToPage(pagination.page - 1)" :disabled="pagination.first">
              <ChevronLeft class="size-4" />
            </Button>
            <Button variant="ghost" size="icon-sm" @click="goToPage(pagination.page + 1)" :disabled="pagination.last">
              <ChevronRight class="size-4" />
            </Button>
            <Button variant="ghost" size="icon-sm" @click="goToPage(pagination.totalPages - 1)" :disabled="pagination.last">
              <ChevronsRight class="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </main>

    <!-- Create/Edit service modal -->
    <Dialog v-model:open="showServiceModal">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{{ showEditModal ? (formData.isBreak ? 'Modifier la pause' : 'Modifier le service') : 'Nouveau service' }}</DialogTitle>
          <DialogDescription>{{ showEditModal ? 'Modifiez les informations du service.' : 'Creez un nouveau service ou une pause.' }}</DialogDescription>
        </DialogHeader>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <!-- Type tabs (Service / Pause) — lecture seule en édition -->
          <div v-if="showEditModal" class="flex items-center gap-2 rounded-lg bg-muted px-4 py-2.5">
            <component :is="formData.isBreak ? Pause : Play" class="size-4" :class="formData.isBreak ? 'text-amber-500' : 'text-green-500'" />
            <span class="text-sm font-medium" :class="formData.isBreak ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'">
              {{ formData.isBreak ? 'Pause' : 'Service' }}
            </span>
          </div>
          <div v-else class="grid grid-cols-2 gap-2 rounded-lg bg-muted p-1">
            <button
              type="button"
              :class="[
                'flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-all',
                !formData.isBreak
                  ? 'bg-background text-green-600 shadow-sm dark:text-green-400'
                  : 'text-muted-foreground hover:text-foreground'
              ]"
              @click="formData.isBreak = false"
            >
              <Play class="size-4" />
              Service
            </button>
            <button
              type="button"
              :class="[
                'flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-all',
                formData.isBreak
                  ? 'bg-background text-amber-600 shadow-sm dark:text-amber-400'
                  : 'text-muted-foreground hover:text-foreground'
              ]"
              @click="formData.isBreak = true"
            >
              <Pause class="size-4" />
              Pause
            </button>
          </div>

          <!-- Start section -->
          <div class="rounded-lg bg-muted/50 p-4">
            <span class="mb-3 block text-sm font-semibold text-muted-foreground">Debut</span>
            <div class="grid grid-cols-2 gap-3">
              <div class="flex flex-col gap-2">
                <label class="text-sm font-medium text-muted-foreground">Date</label>
                <Input type="date" v-model="formData.debutDate" required />
              </div>
              <div class="flex flex-col gap-2">
                <label class="text-sm font-medium text-muted-foreground">Heure</label>
                <Input type="time" v-model="formData.debutTime" required />
              </div>
            </div>
          </div>

          <!-- End section -->
          <div class="rounded-lg bg-muted/50 p-4">
            <span class="mb-3 block text-sm font-semibold text-muted-foreground">
              Fin <span class="font-normal text-muted-foreground/60">(optionnel)</span>
            </span>
            <div class="grid grid-cols-2 gap-3">
              <div class="flex flex-col gap-2">
                <label class="text-sm font-medium text-muted-foreground">Date</label>
                <Input type="date" v-model="formData.finDate" />
              </div>
              <div class="flex flex-col gap-2">
                <label class="text-sm font-medium text-muted-foreground">Heure</label>
                <Input type="time" v-model="formData.finTime" />
              </div>
            </div>
          </div>

          <!-- Form error -->
          <div v-if="formError" class="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            <CircleAlert class="size-4 shrink-0" />
            {{ formError }}
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" @click="closeModal">Annuler</Button>
            <Button type="submit" :disabled="submitting">
              <LoaderCircle v-if="submitting" class="mr-2 size-4 animate-spin" />
              {{ showEditModal ? 'Modifier' : 'Creer' }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <!-- Delete confirmation modal -->
    <Dialog v-model:open="showDeleteModal">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Supprimer ce {{ serviceToDelete?.isBreak ? 'pause' : 'service' }} ?</DialogTitle>
          <DialogDescription>Cette action est irreversible.</DialogDescription>
        </DialogHeader>
        <div v-if="serviceToDelete" class="flex items-center gap-3 rounded-md bg-muted/50 px-4 py-3">
          <div class="h-6 w-1 shrink-0 rounded-full" :class="serviceToDelete.isBreak ? 'bg-amber-500' : 'bg-green-500'" />
          <span class="font-mono text-sm font-medium">
            {{ formatTime(serviceToDelete.debut) }} → {{ formatTime(serviceToDelete.fin) || '--:--' }}
          </span>
          <span v-if="serviceToDelete.duree" class="font-mono text-sm text-muted-foreground">
            ({{ formatDuration(serviceToDelete.duree) }})
          </span>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="cancelDelete">Annuler</Button>
          <Button variant="destructive" @click="handleDelete" :disabled="deleting">
            <LoaderCircle v-if="deleting" class="mr-2 size-4 animate-spin" />
            Supprimer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Map modal -->
    <Dialog v-model:open="showMapModal">
      <DialogContent class="overflow-hidden p-0 sm:max-w-[600px]">
        <DialogHeader class="border-b px-5 py-4">
          <DialogTitle class="flex items-center gap-2">
            <MapPin class="size-5" />
            Localisation
          </DialogTitle>
        </DialogHeader>
        <div class="flex flex-col gap-2 bg-muted/50 px-5 py-3 text-sm">
          <div class="flex items-center justify-between">
            <span class="font-medium text-foreground">{{ mapServiceTime }}</span>
          </div>
          <div v-if="mapCoords" class="flex items-center gap-2">
            <span class="inline-block size-2.5 rounded-full" :class="mapCoords === 'Position non disponible' ? 'bg-destructive' : 'bg-green-500'" />
            <span class="text-xs text-muted-foreground">Début :</span>
            <span class="font-mono" :class="mapCoords === 'Position non disponible' ? 'text-destructive' : 'text-muted-foreground'">{{ mapCoords }}</span>
          </div>
          <div v-if="mapCoordsEnd" class="flex items-center gap-2">
            <span class="inline-block size-2.5 rounded-full" :class="mapCoordsEnd === 'Position non disponible' ? 'bg-destructive' : 'bg-purple-800'" />
            <span class="text-xs text-muted-foreground">Fin :</span>
            <span class="font-mono" :class="mapCoordsEnd === 'Position non disponible' ? 'text-destructive' : 'text-muted-foreground'">{{ mapCoordsEnd }}</span>
          </div>
        </div>
        <div ref="mapContainer" class="h-[350px] w-full" />
        <div class="border-t px-5 py-4">
          <div class="flex justify-end">
            <Button @click="closeMapModal">Fermer</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useUserServices, typeFilterOptions } from '@/composables/useUserServices'
import { useMapModal } from '@/composables/useMapModal'
import { userServicesService } from '@/services/userServices'

// shadcn components
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

// Lucide icons
import {
  Clock,
  Plus,
  Play,
  Pause,
  Square,
  Sun,
  CalendarDays,
  CalendarRange,
  Calendar,
  Filter,
  ArrowRight,
  MapPin,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  LoaderCircle,
  CircleAlert,
  ClipboardList,
  MoreVertical,
  User,
} from 'lucide-vue-next'

// DropdownMenu for mobile actions
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import {
  formatTime,
  formatHoursMinutes,
  formatDuration,
  calculateDuration,
  getTodayDate,
  getCurrentTime,
  toLocalDateTimeString
} from '@/utils/timeFormatters'

const route = useRoute()

const userUuid = computed(() => route.params.uuid as string)

// Composables
const {
  services,
  loading,
  error,
  userName,
  userStatus,
  activeServiceStart,
  actionLoading,
  showFilters,
  searchFilters,
  pagination,
  hasActiveFilters,
  servicesByDay,
  loadUserData,
  loadUserStatus,
  loadServices,
  applyFilters,
  resetFilters,
  goToPage,
  startService,
  endService,
  startBreak,
  endBreak,
  deleteService: deleteServiceAPI,
  createService,
  updateService,
  getStatusText,
  hasLocationData,
  isLocationInvalid
} = useUserServices(userUuid.value)

// Convert typeFilterOptions to Select-compatible format
const selectTypeOptions = typeFilterOptions.map(opt => ({
  value: opt.value,
  label: opt.label
}))

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'PRESENT':
      return 'border-green-500/50 text-green-600 dark:text-green-400'
    case 'ON_BREAK':
      return 'border-amber-500/50 text-amber-600 dark:text-amber-400'
    default:
      return ''
  }
}

const getStatusDotClass = (status: string) => {
  switch (status) {
    case 'PRESENT':
      return 'bg-green-500 animate-pulse'
    case 'ON_BREAK':
      return 'bg-amber-500 animate-pulse'
    default:
      return 'bg-muted-foreground'
  }
}

// Hours stats
const hours = ref<{ day?: number; week?: number; month?: number; year?: number; lastMonth?: number } | null>(null)

const loadHours = async () => {
  try {
    const response = await userServicesService.getUserWorkedHours(userUuid.value, {})
    hours.value = (response.data || response) as { day?: number; week?: number; month?: number; year?: number; lastMonth?: number }
  } catch {
    // Silently ignore hour loading errors
  }
}

// Hours modal
const {
  showMapModal,
  mapContainer,
  mapServiceTime,
  mapCoords,
  mapCoordsEnd,
  showLocationMap,
  closeMapModal
} = useMapModal()

// Modal states
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const serviceToDelete = ref<any>(null)
const serviceToEdit = ref<any>(null)
const submitting = ref(false)
const deleting = ref(false)
const formError = ref('')

// Combined modal open state
const showServiceModal = computed({
  get: () => showCreateModal.value || showEditModal.value,
  set: (val: boolean) => {
    if (!val) closeModal()
  }
})

// Form data
const formData = ref({
  debutDate: '',
  debutTime: '',
  finDate: '',
  finTime: '',
  latitude: null as number | null,
  longitude: null as number | null,
  latitudeEnd: null as number | null,
  longitudeEnd: null as number | null,
  isBreak: false
})

const openCreateModal = () => {
  formData.value = {
    debutDate: getTodayDate(),
    debutTime: getCurrentTime(),
    finDate: '',
    finTime: '',
    latitude: null,
    longitude: null,
    latitudeEnd: null,
    longitudeEnd: null,
    isBreak: false
  }
  formError.value = ''
  showCreateModal.value = true
}

const openCreateModalForDate = (date: string) => {
  formData.value = {
    debutDate: date,
    debutTime: '',
    finDate: date,
    finTime: '',
    latitude: null,
    longitude: null,
    latitudeEnd: null,
    longitudeEnd: null,
    isBreak: false
  }
  formError.value = ''
  showCreateModal.value = true
}

const editService = (service: any) => {
  serviceToEdit.value = service
  const debutLocal = toLocalDateTimeString(service.debut)
  const finLocal = service.fin ? toLocalDateTimeString(service.fin) : ''

  formData.value = {
    debutDate: debutLocal.split('T')[0] || '',
    debutTime: debutLocal.split('T')[1] || '',
    finDate: finLocal ? finLocal.split('T')[0] || '' : '',
    finTime: finLocal ? finLocal.split('T')[1] || '' : '',
    latitude: service.latitude,
    longitude: service.longitude,
    latitudeEnd: service.latitudeEnd ?? null,
    longitudeEnd: service.longitudeEnd ?? null,
    isBreak: service.isBreak
  }
  formError.value = ''
  showEditModal.value = true
}

const closeModal = () => {
  showCreateModal.value = false
  showEditModal.value = false
  serviceToEdit.value = null
  formError.value = ''
}

const handleSubmit = async () => {
  try {
    submitting.value = true
    formError.value = ''

    if (showEditModal.value && serviceToEdit.value) {
      await updateService(serviceToEdit.value.uuid, formData.value)
    } else {
      await createService(formData.value)
    }

    closeModal()
  } catch (err: any) {
    formError.value = err.message || 'Une erreur est survenue'
  } finally {
    submitting.value = false
  }
}

const confirmDelete = (service: any) => {
  serviceToDelete.value = service
  showDeleteModal.value = true
}

const cancelDelete = () => {
  serviceToDelete.value = null
  showDeleteModal.value = false
}

const handleDelete = async () => {
  if (!serviceToDelete.value) return

  try {
    deleting.value = true
    await deleteServiceAPI(serviceToDelete.value.uuid)
    cancelDelete()
  } catch {
    // Silently ignore delete errors
  } finally {
    deleting.value = false
  }
}

// Initial load
onMounted(async () => {
  await loadUserData()
  await loadUserStatus()
  await loadServices()
  await loadHours()
})
</script>
