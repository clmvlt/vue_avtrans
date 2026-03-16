<template>
  <div class="min-h-screen bg-background">
    <!-- Header -->
    <header class="sticky top-0 z-40 border-b bg-background">
      <div class="mx-auto flex max-w-[1400px] flex-col gap-3 px-4 py-3 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-4 md:px-6 md:py-4">
        <Tabs :model-value="periodType" @update:model-value="handlePeriodChange">
          <TabsList>
            <TabsTrigger value="week">Semaine</TabsTrigger>
            <TabsTrigger value="month">Mois</TabsTrigger>
          </TabsList>
        </Tabs>
        <div class="flex items-center justify-center gap-2">
          <Button variant="outline" size="icon-sm" @click="navigatePrevious">
            <ChevronLeft class="size-4" />
          </Button>
          <span class="min-w-[140px] text-center text-sm font-semibold text-foreground md:min-w-[180px]">{{ currentPeriodLabel }}</span>
          <Button variant="outline" size="icon-sm" @click="navigateNext">
            <ChevronRight class="size-4" />
          </Button>
          <Button variant="secondary" size="sm" class="hidden md:inline-flex" @click="goToToday">
            Aujourd'hui
          </Button>
          <Button variant="secondary" size="sm" class="md:hidden" @click="goToToday">
            Auj.
          </Button>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="px-4 py-4 md:px-6 md:py-6">
          <!-- Loading -->
          <div v-if="loading" class="flex flex-col items-center justify-center gap-4 py-16">
            <LoaderCircle class="size-10 animate-spin text-primary" />
            <p class="text-lg text-muted-foreground">Chargement du planning...</p>
          </div>

          <!-- Error -->
          <div v-else-if="error" class="flex flex-col items-center justify-center gap-4 py-16">
            <div class="flex size-16 items-center justify-center rounded-full bg-destructive/10">
              <TriangleAlert class="size-7 text-destructive" />
            </div>
            <p class="text-muted-foreground">{{ error }}</p>
            <Button size="sm" @click="loadPlanning">Réessayer</Button>
          </div>

          <!-- Empty -->
          <div v-else-if="!planningData.users.length" class="flex flex-col items-center justify-center gap-4 py-16">
            <div class="flex size-16 items-center justify-center rounded-full bg-muted">
              <CalendarX2 class="size-7 text-muted-foreground" />
            </div>
            <h3 class="font-semibold text-foreground">Aucun utilisateur</h3>
            <p class="text-muted-foreground">Aucun employé n'est disponible pour cette période.</p>
          </div>

          <!-- Planning Grid -->
          <div v-else class="overflow-hidden rounded-lg border bg-card shadow-sm">
        <div class="overflow-x-auto">
          <div class="min-w-[800px]">
            <!-- Header Row -->
            <div
              class="grid border-b bg-muted/50"
              :style="{ gridTemplateColumns: `220px repeat(${dates.length}, minmax(44px, 1fr))` }"
            >
              <div class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Employé
              </div>
              <div
                v-for="date in dates"
                :key="date.dateStr"
                class="flex min-h-[56px] flex-col items-center justify-center border-l px-1 py-2"
                :class="[
                  date.isToday && !date.isHoliday ? 'bg-primary' : '',
                  date.isToday && date.isHoliday ? 'bg-primary' : '',
                  !date.isToday && date.isHoliday ? 'bg-destructive/10' : '',
                  !date.isToday && !date.isHoliday && date.isWeekend ? 'bg-muted/80' : '',
                ]"
                :title="date.holidayName"
              >
                <span
                  class="text-xs uppercase"
                  :class="[
                    date.isToday ? 'text-primary-foreground' : '',
                    !date.isToday && date.isHoliday ? 'text-destructive' : '',
                    !date.isToday && !date.isHoliday && date.isWeekend ? 'text-muted-foreground/60' : '',
                    !date.isToday && !date.isHoliday && !date.isWeekend ? 'text-muted-foreground' : '',
                  ]"
                >{{ date.dayName }}</span>
                <span
                  class="text-base font-bold"
                  :class="[
                    date.isToday ? 'text-primary-foreground' : '',
                    !date.isToday && date.isHoliday ? 'text-destructive' : '',
                    !date.isToday && !date.isHoliday && date.isWeekend ? 'text-muted-foreground/60' : '',
                    !date.isToday && !date.isHoliday && !date.isWeekend ? 'text-foreground' : '',
                  ]"
                >{{ date.dayNumber }}</span>
                <span
                  v-if="date.isHoliday"
                  class="mt-0.5 text-[6px]"
                  :class="date.isToday ? 'text-primary-foreground' : 'text-destructive'"
                >●</span>
              </div>
            </div>

            <!-- User Rows -->
            <div
              v-for="user in planningData.users"
              :key="user.uuid"
              class="grid border-b last:border-b-0"
              :style="{ gridTemplateColumns: `220px repeat(${dates.length}, minmax(44px, 1fr))` }"
            >
              <div class="flex items-center gap-3 border-r bg-card px-4 py-3">
                <Avatar class="size-9 shrink-0 border-2 border-border">
                  <AvatarImage v-if="user.pictureUrl" :src="user.pictureUrl" :alt="`${user.firstName} ${user.lastName}`" />
                  <AvatarFallback class="bg-primary text-xs font-bold text-primary-foreground">
                    {{ getInitials(user.firstName, user.lastName) }}
                  </AvatarFallback>
                </Avatar>
                <div class="flex min-w-0 flex-1 flex-col">
                  <span class="truncate text-sm font-medium text-foreground">{{ user.firstName }} {{ user.lastName }}</span>
                  <span
                    v-if="user.role"
                    class="text-xs font-medium text-muted-foreground"
                  >{{ user.role.name }}</span>
                </div>
                <router-link
                  :to="`/absences?userUuid=${user.uuid}`"
                  title="Voir les absences"
                  @click.stop
                >
                  <Button variant="ghost" size="icon-sm" as="span">
                    <CalendarDays class="size-3.5" />
                  </Button>
                </router-link>
              </div>
              <div
                v-for="date in dates"
                :key="`${user.uuid}-${date.dateStr}`"
                class="flex min-h-[52px] items-center justify-center border-l transition-colors"
                :class="getDayCellClass(user, date)"
                :style="getDayCellStyle(user, date)"
                @click="handleCellClick(user, date)"
              >
                <span
                  v-if="getAbsenceForDate(user, date)"
                  class="text-lg font-bold"
                  :style="getAbsenceIconStyle(user, date)"
                >
                  {{ getAbsenceIcon(getAbsenceForDate(user, date)) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Legend -->
        <div v-if="absenceTypes.length > 0" class="flex flex-wrap items-center gap-4 border-t bg-muted/50 px-6 py-4">
          <span class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Types d'absence</span>
          <div class="flex flex-wrap gap-4">
            <div v-for="type in absenceTypes" :key="type.uuid" class="flex items-center gap-2 text-sm text-muted-foreground">
              <span class="size-3.5 rounded-sm border border-border" :style="{ backgroundColor: type.color }"></span>
              <span>{{ type.name }}</span>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Absence Detail Dialog -->
    <Dialog v-model:open="showModal">
      <DialogContent class="sm:max-w-lg" @close="closeModal">
        <DialogHeader>
          <DialogTitle>Détails de l'absence</DialogTitle>
          <DialogDescription>Informations complètes sur l'absence sélectionnée</DialogDescription>
        </DialogHeader>

        <div v-if="selectedAbsence" class="space-y-5">
          <!-- Employee Info -->
          <div class="space-y-3 border-b pb-4">
            <h4 class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Employé</h4>
            <div class="flex items-center gap-3">
              <Avatar class="size-12 shrink-0">
                <AvatarImage
                  v-if="selectedAbsence.user?.pictureUrl"
                  :src="selectedAbsence.user.pictureUrl"
                  :alt="`${selectedAbsence.user?.firstName} ${selectedAbsence.user?.lastName}`"
                />
                <AvatarFallback class="bg-primary text-sm font-bold text-primary-foreground">
                  {{ getInitials(selectedAbsence.user?.firstName, selectedAbsence.user?.lastName) }}
                </AvatarFallback>
              </Avatar>
              <div class="flex flex-col">
                <span class="font-semibold text-foreground">
                  {{ selectedAbsence.user?.firstName }} {{ selectedAbsence.user?.lastName }}
                </span>
                <span class="text-sm text-muted-foreground">{{ selectedAbsence.user?.email }}</span>
              </div>
            </div>
          </div>

          <!-- Absence Type -->
          <div v-if="selectedAbsence.absenceType || selectedAbsence.customType" class="space-y-3 border-b pb-4">
            <h4 class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Type d'absence</h4>
            <Badge
              v-if="selectedAbsence.absenceType"
              variant="outline"
              :style="{
                backgroundColor: selectedAbsence.absenceType.color + '20',
                color: selectedAbsence.absenceType.color,
                borderColor: selectedAbsence.absenceType.color,
              }"
            >
              {{ selectedAbsence.absenceType.name }}
            </Badge>
            <Badge v-else variant="secondary">
              {{ selectedAbsence.customType }}
            </Badge>
          </div>

          <!-- Dates -->
          <div class="space-y-3 border-b pb-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="flex flex-col gap-1">
                <span class="text-xs uppercase tracking-wide text-muted-foreground">Début</span>
                <span class="font-medium text-foreground">{{ formatDate(selectedAbsence.startDate) }}</span>
              </div>
              <div class="flex flex-col gap-1">
                <span class="text-xs uppercase tracking-wide text-muted-foreground">Fin</span>
                <span class="font-medium text-foreground">{{ formatDate(selectedAbsence.endDate) }}</span>
              </div>
              <div class="flex flex-col gap-1">
                <span class="text-xs uppercase tracking-wide text-muted-foreground">Durée</span>
                <span class="font-medium text-foreground">{{ calculateDuration(selectedAbsence.startDate, selectedAbsence.endDate) }}</span>
              </div>
              <div class="flex flex-col gap-1">
                <span class="text-xs uppercase tracking-wide text-muted-foreground">Statut</span>
                <Badge :variant="getStatusVariant(selectedAbsence.status)" class="w-fit">
                  {{ getStatusText(selectedAbsence.status) }}
                </Badge>
              </div>
            </div>
          </div>

          <!-- Reason -->
          <div v-if="selectedAbsence.reason" class="space-y-3 border-b pb-4">
            <h4 class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Motif</h4>
            <p class="leading-relaxed text-muted-foreground">{{ selectedAbsence.reason }}</p>
          </div>

          <!-- Validation Info -->
          <div v-if="selectedAbsence.validatedBy" class="space-y-3 border-b pb-4">
            <h4 class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Validation</h4>
            <div class="grid grid-cols-2 gap-4">
              <div class="flex flex-col gap-1">
                <span class="text-xs uppercase tracking-wide text-muted-foreground">Validé par</span>
                <span class="font-medium text-foreground">
                  {{ selectedAbsence.validatedBy.firstName }} {{ selectedAbsence.validatedBy.lastName }}
                </span>
              </div>
              <div class="flex flex-col gap-1">
                <span class="text-xs uppercase tracking-wide text-muted-foreground">Date</span>
                <span class="font-medium text-foreground">{{ formatDateTime(selectedAbsence.validatedAt) }}</span>
              </div>
            </div>
            <div v-if="selectedAbsence.rejectionReason" class="mt-3 rounded-md bg-destructive/10 p-3">
              <span class="text-xs uppercase tracking-wide text-muted-foreground">Motif du refus</span>
              <p class="mt-1 italic text-destructive">{{ selectedAbsence.rejectionReason }}</p>
            </div>
          </div>

          <!-- Actions for PENDING absences -->
          <div v-if="selectedAbsence.status === 'PENDING'" class="-mx-6 space-y-3 bg-amber-500/5 px-6 py-4">
            <h4 class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</h4>

            <!-- Rejection reason input -->
            <div v-if="showRejectInput" class="space-y-3">
              <label class="text-sm font-medium text-muted-foreground">Motif du refus (optionnel)</label>
              <textarea
                v-model="rejectionReason"
                class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
                placeholder="Indiquez la raison du refus..."
                rows="3"
              ></textarea>
              <div class="flex justify-end gap-2">
                <Button variant="ghost" size="sm" @click="cancelReject">Annuler</Button>
                <Button variant="destructive" size="sm" :disabled="isValidating" @click="confirmReject">
                  <LoaderCircle v-if="isValidating" class="size-4 animate-spin" />
                  Confirmer le refus
                </Button>
              </div>
            </div>

            <!-- Main action buttons -->
            <div v-else class="flex gap-3">
              <Button :disabled="isValidating" @click="approveAbsence">
                <LoaderCircle v-if="isValidating" class="size-4 animate-spin" />
                <Check v-else class="size-4" />
                Approuver
              </Button>
              <Button variant="destructive" :disabled="isValidating" @click="showRejectInput = true">
                <X class="size-4" />
                Refuser
              </Button>
            </div>
          </div>

          <!-- Link to absences page -->
          <div class="border-t pt-4">
            <router-link to="/absences" class="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
              <ExternalLink class="size-3.5" />
              Gérer les absences
            </router-link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { absencesService, type PlanningUserDTO } from '@/services/absences'
import { absenceTypesService } from '@/services'
import type { AbsenceDTO, AbsenceTypeDTO } from '@/models'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  LoaderCircle,
  ChevronLeft,
  ChevronRight,
  CalendarX2,
  TriangleAlert,
  CalendarDays,
  Check,
  X,
  ExternalLink,
} from 'lucide-vue-next'

interface DateInfo {
  dateStr: string
  dayName: string
  dayNumber: number
  isToday: boolean
  isWeekend: boolean
  isHoliday: boolean
  holidayName?: string
}

// Calcul de Pâques (algorithme de Meeus/Jones/Butcher)
function getEasterDate(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month - 1, day)
}

// Jours fériés français pour une année donnée
function getFrenchHolidays(year: number): Map<string, string> {
  const holidays = new Map<string, string>()

  // Jours fériés fixes
  holidays.set(`${year}-01-01`, 'Jour de l\'an')
  holidays.set(`${year}-05-01`, 'Fête du travail')
  holidays.set(`${year}-05-08`, 'Victoire 1945')
  holidays.set(`${year}-07-14`, 'Fête nationale')
  holidays.set(`${year}-08-15`, 'Assomption')
  holidays.set(`${year}-11-01`, 'Toussaint')
  holidays.set(`${year}-11-11`, 'Armistice 1918')
  holidays.set(`${year}-12-25`, 'Noël')

  // Jours fériés mobiles (basés sur Pâques)
  const easter = getEasterDate(year)

  // Lundi de Pâques (Pâques + 1 jour)
  const easterMonday = new Date(easter)
  easterMonday.setDate(easter.getDate() + 1)
  holidays.set(easterMonday.toISOString().split('T')[0]!, 'Lundi de Pâques')

  // Ascension (Pâques + 39 jours)
  const ascension = new Date(easter)
  ascension.setDate(easter.getDate() + 39)
  holidays.set(ascension.toISOString().split('T')[0]!, 'Ascension')

  // Lundi de Pentecôte (Pâques + 50 jours)
  const pentecostMonday = new Date(easter)
  pentecostMonday.setDate(easter.getDate() + 50)
  holidays.set(pentecostMonday.toISOString().split('T')[0]!, 'Lundi de Pentecôte')

  return holidays
}

// State
const loading = ref(true)
const error = ref('')
const planningData = ref<{ users: PlanningUserDTO[], startDate: string, endDate: string, periodType: string }>({
  users: [],
  startDate: '',
  endDate: '',
  periodType: 'month'
})
const periodType = ref<'week' | 'month'>('month')
const currentYear = ref(new Date().getFullYear())
const currentMonth = ref(new Date().getMonth() + 1)
const currentWeek = ref(getWeekNumber(new Date()))
const absenceTypes = ref<AbsenceTypeDTO[]>([])

// Modal
const showModal = ref(false)
const selectedAbsence = ref<AbsenceDTO | null>(null)

// Validation
const isValidating = ref(false)
const showRejectInput = ref(false)
const rejectionReason = ref('')

// Computed
const dates = computed<DateInfo[]>(() => {
  if (!planningData.value.startDate || !planningData.value.endDate) return []

  const result: DateInfo[] = []
  const start = new Date(planningData.value.startDate)
  const end = new Date(planningData.value.endDate)
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  // Récupérer les jours fériés pour les années concernées
  const startYear = start.getFullYear()
  const endYear = end.getFullYear()
  const holidays = new Map<string, string>()
  for (let year = startYear; year <= endYear; year++) {
    const yearHolidays = getFrenchHolidays(year)
    yearHolidays.forEach((name, date) => holidays.set(date, name))
  }

  const current = new Date(start)
  while (current <= end) {
    const dayOfWeek = current.getDay()
    const currentStr = current.toISOString().split('T')[0] || ''
    const holidayName = holidays.get(currentStr)
    result.push({
      dateStr: currentStr,
      dayName: current.toLocaleDateString('fr-FR', { weekday: 'short' }),
      dayNumber: current.getDate(),
      isToday: currentStr === todayStr,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      isHoliday: !!holidayName,
      holidayName
    })
    current.setDate(current.getDate() + 1)
  }
  return result
})

const currentPeriodLabel = computed(() => {
  if (periodType.value === 'week') {
    if (!planningData.value.startDate || !planningData.value.endDate) {
      return `Semaine ${currentWeek.value} - ${currentYear.value}`
    }
    const start = new Date(planningData.value.startDate)
    const end = new Date(planningData.value.endDate)
    return `${start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`
  } else {
    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
    return `${monthNames[currentMonth.value - 1]} ${currentYear.value}`
  }
})

// Helpers
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

// API
const loadPlanning = async () => {
  try {
    loading.value = true
    error.value = ''

    const params: { periodType: 'week' | 'month', year: number, week?: number, month?: number } = {
      periodType: periodType.value,
      year: currentYear.value
    }

    if (periodType.value === 'week') {
      params.week = currentWeek.value
    } else {
      params.month = currentMonth.value
    }

    const response = await absencesService.getAbsencePlanning(params)
    if (response.success) {
      planningData.value = {
        users: response.users,
        startDate: response.startDate,
        endDate: response.endDate,
        periodType: response.periodType
      }
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Erreur lors du chargement du planning'
  } finally {
    loading.value = false
  }
}

const handlePeriodChange = (value: string | number) => {
  periodType.value = value as 'week' | 'month'
  loadPlanning()
}

// Navigation
const navigatePrevious = () => {
  if (periodType.value === 'week') {
    currentWeek.value--
    if (currentWeek.value < 1) {
      currentYear.value--
      currentWeek.value = 52
    }
  } else {
    currentMonth.value--
    if (currentMonth.value < 1) {
      currentYear.value--
      currentMonth.value = 12
    }
  }
  loadPlanning()
}

const navigateNext = () => {
  if (periodType.value === 'week') {
    currentWeek.value++
    if (currentWeek.value > 52) {
      currentYear.value++
      currentWeek.value = 1
    }
  } else {
    currentMonth.value++
    if (currentMonth.value > 12) {
      currentYear.value++
      currentMonth.value = 1
    }
  }
  loadPlanning()
}

const goToToday = () => {
  const today = new Date()
  currentYear.value = today.getFullYear()
  currentMonth.value = today.getMonth() + 1
  currentWeek.value = getWeekNumber(today)
  loadPlanning()
}

// User/Cell helpers
const getInitials = (firstName?: string, lastName?: string): string => {
  const first = firstName ? firstName.charAt(0).toUpperCase() : ''
  const last = lastName ? lastName.charAt(0).toUpperCase() : ''
  return first + last || '?'
}

const getAbsenceForDate = (user: PlanningUserDTO, date: DateInfo): AbsenceDTO | undefined => {
  if (!user.absences) return undefined
  return user.absences.find(absence => {
    const start = new Date(absence.startDate || '')
    const end = new Date(absence.endDate || '')
    const current = new Date(date.dateStr)
    return current >= start && current <= end
  })
}

const getDayCellClass = (user: PlanningUserDTO, date: DateInfo): string[] => {
  const absence = getAbsenceForDate(user, date)
  const classes: string[] = []

  if (date.isToday) classes.push('bg-primary/10')
  if (date.isWeekend && !date.isToday) classes.push('bg-muted/50')
  if (date.isHoliday && !date.isToday) classes.push('bg-destructive/5')

  if (absence) {
    classes.push('cursor-pointer')
    classes.push('hover:brightness-95')
    if (!absence.absenceType?.color && absence.status) {
      switch (absence.status) {
        case 'APPROVED': classes.push('bg-destructive/15'); break
        case 'PENDING': classes.push('bg-amber-500/15'); break
        case 'REJECTED': classes.push('bg-muted'); break
      }
    }
  }

  return classes
}

const getDayCellStyle = (user: PlanningUserDTO, date: DateInfo): Record<string, string> => {
  const absence = getAbsenceForDate(user, date)
  if (!absence) return {}

  if (absence.absenceType?.color) {
    const opacity = absence.status === 'APPROVED' ? '30' : (absence.status === 'PENDING' ? '20' : '10')
    return { backgroundColor: absence.absenceType.color + opacity }
  }

  return {}
}

const getAbsenceIconStyle = (user: PlanningUserDTO, date: DateInfo): Record<string, string> => {
  const absence = getAbsenceForDate(user, date)
  if (!absence) return {}

  if (absence.absenceType?.color) {
    return { color: absence.absenceType.color }
  }

  return {}
}

const getAbsenceIcon = (absence?: AbsenceDTO | null): string => {
  if (!absence) return ''
  switch (absence.status) {
    case 'APPROVED': return '✓'
    case 'PENDING': return '?'
    case 'REJECTED': return '✗'
    default: return ''
  }
}

// Modal
const handleCellClick = (user: PlanningUserDTO, date: DateInfo) => {
  const absence = getAbsenceForDate(user, date)
  if (absence) {
    selectedAbsence.value = absence
    showModal.value = true
  }
}

const closeModal = () => {
  showModal.value = false
  selectedAbsence.value = null
  showRejectInput.value = false
  rejectionReason.value = ''
}

// Validation actions
const approveAbsence = async () => {
  if (!selectedAbsence.value?.uuid) return

  isValidating.value = true
  try {
    await absencesService.validateAbsence(selectedAbsence.value.uuid, {
      approved: true
    })
    closeModal()
    await loadPlanning()
  } catch {
    // Ignorer les erreurs d'approbation
  } finally {
    isValidating.value = false
  }
}

const cancelReject = () => {
  showRejectInput.value = false
  rejectionReason.value = ''
}

const confirmReject = async () => {
  if (!selectedAbsence.value?.uuid) return

  isValidating.value = true
  try {
    await absencesService.validateAbsence(selectedAbsence.value.uuid, {
      approved: false,
      rejectionReason: rejectionReason.value || undefined
    })
    closeModal()
    await loadPlanning()
  } catch {
    // Ignorer les erreurs de refus
  } finally {
    isValidating.value = false
  }
}

// Status helpers
const getStatusVariant = (status?: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'APPROVED': return 'default'
    case 'PENDING': return 'secondary'
    case 'REJECTED': return 'destructive'
    case 'CANCELLED': return 'outline'
    default: return 'secondary'
  }
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

// Date formatting
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

const calculateDuration = (startDate?: string, endDate?: string): string => {
  if (!startDate || !endDate) return '-'
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = Math.abs(end.getTime() - start.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
  return `${diffDays} jour${diffDays > 1 ? 's' : ''}`
}

const loadAbsenceTypes = async () => {
  try {
    const response = await absenceTypesService.getAbsenceTypes()
    absenceTypes.value = (response as { types?: AbsenceTypeDTO[] }).types || []
  } catch {
    // Ignorer les erreurs de chargement des types d'absence
  }
}

onMounted(() => {
  loadPlanning()
  loadAbsenceTypes()
})
</script>
