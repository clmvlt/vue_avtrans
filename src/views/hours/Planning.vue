<template>
  <div class="min-h-screen bg-background">
    <!-- Header -->
    <header class="sticky top-0 z-40 border-b bg-background">
      <div class="mx-auto flex max-w-[1400px] flex-col gap-3 px-4 py-3 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-4 md:px-6 md:py-4">
        <Tabs :model-value="periodType" @update:model-value="handlePeriodChange">
          <TabsList>
            <TabsTrigger value="week">Semaine</TabsTrigger>
            <TabsTrigger value="month">Mois</TabsTrigger>
            <TabsTrigger value="custom">Personnalisé</TabsTrigger>
          </TabsList>
        </Tabs>

        <!-- Navigation semaine/mois -->
        <div v-if="periodType !== 'custom'" class="flex items-center justify-center gap-2">
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

        <!-- Contrôles mode personnalisé -->
        <div v-else class="flex flex-wrap items-center gap-2">
          <div class="flex items-center gap-2">
            <label class="text-xs font-medium text-muted-foreground">Du</label>
            <input
              v-model="customStartDate"
              type="date"
              class="h-8 rounded-md border border-input bg-background px-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
            />
          </div>
          <div class="flex items-center gap-2">
            <label class="text-xs font-medium text-muted-foreground">Au</label>
            <input
              v-model="customEndDate"
              type="date"
              class="h-8 rounded-md border border-input bg-background px-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
            />
          </div>
          <Button size="sm" :disabled="!isCustomRangeValid" @click="loadPlanning">
            <Search class="size-3.5" />
            <span class="hidden sm:inline">Afficher</span>
          </Button>
          <Separator orientation="vertical" class="mx-1 hidden h-6 md:block" />
          <div class="flex items-center gap-1">
            <Button
              v-for="preset in customPresets"
              :key="preset.label"
              variant="outline"
              size="sm"
              class="h-7 px-2 text-xs"
              @click="applyPreset(preset.months)"
            >{{ preset.label }}</Button>
          </div>
          <p v-if="customDateError" class="w-full text-xs text-destructive">{{ customDateError }}</p>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="px-4 py-4 md:px-6 md:py-6">
      <!-- Export bar -->
      <div v-if="!loading && !error && planningData.users.length" class="mb-4 flex items-center justify-between">
        <span class="text-sm text-muted-foreground">
          {{ planningData.users.length }} employé{{ planningData.users.length > 1 ? 's' : '' }} &middot; {{ dates.length }} jours
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="outline" size="sm" :disabled="isExporting">
              <LoaderCircle v-if="isExporting" class="size-4 animate-spin" />
              <Printer v-else class="size-4" />
              Exporter
              <ChevronDown class="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Format d'export</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem @click="exportPlanning('pdf')">
              <FileText class="size-4" />
              PDF (A4 paysage)
            </DropdownMenuItem>
            <DropdownMenuItem @click="exportPlanning('png')">
              <ImageIcon class="size-4" />
              Image PNG
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
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
              :style="{ gridTemplateColumns: gridColumns }"
            >
              <div class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Employé
              </div>
              <div
                v-for="date in dates"
                :key="date.dateStr"
                class="flex flex-col items-center justify-center border-l px-0.5"
                :class="[
                  isCompactGrid ? 'min-h-[40px] py-1' : 'min-h-[56px] py-2 px-1',
                  date.isToday && !date.isHoliday ? 'bg-primary' : '',
                  date.isToday && date.isHoliday ? 'bg-primary' : '',
                  !date.isToday && date.isHoliday ? 'bg-destructive/10' : '',
                  !date.isToday && !date.isHoliday && date.isWeekend ? 'bg-muted/80' : '',
                ]"
                :title="date.holidayName || date.dateStr"
              >
                <span
                  class="uppercase leading-tight"
                  :class="[
                    isCompactGrid ? 'text-[9px]' : 'text-xs',
                    date.isToday ? 'text-primary-foreground' : '',
                    !date.isToday && date.isHoliday ? 'text-destructive' : '',
                    !date.isToday && !date.isHoliday && date.isWeekend ? 'text-muted-foreground/60' : '',
                    !date.isToday && !date.isHoliday && !date.isWeekend ? 'text-muted-foreground' : '',
                  ]"
                >{{ isCompactGrid ? date.dayName.charAt(0) : date.dayName }}</span>
                <span
                  class="font-bold leading-tight"
                  :class="[
                    isCompactGrid ? 'text-xs' : 'text-base',
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
              :style="{ gridTemplateColumns: gridColumns }"
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
                    class="text-xs font-medium"
                    :style="user.role.color ? { color: user.role.color } : undefined"
                  >{{ user.role.nom }}</span>
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
                class="relative flex items-center justify-center border-l transition-colors"
                :class="[isCompactGrid ? 'min-h-[36px]' : 'min-h-[52px]', ...getDayCellClass(user, date)]"
                :style="getDayCellStyle(user, date)"
                @click="handleCellClick(user, date)"
              >
                <template v-if="getAbsenceForDate(user, date)">
                  <span
                    class="font-bold"
                    :class="isCompactGrid ? 'text-sm' : 'text-lg'"
                    :style="getAbsenceIconStyle(user, date)"
                  >
                    {{ getAbsenceIcon(getAbsenceForDate(user, date)) }}
                  </span>
                  <span
                    v-if="!isCompactGrid && getAbsenceForDate(user, date)?.period === 'MORNING'"
                    class="absolute bottom-0.5 text-[8px] leading-none text-muted-foreground"
                  >AM</span>
                  <span
                    v-else-if="!isCompactGrid && getAbsenceForDate(user, date)?.period === 'AFTERNOON'"
                    class="absolute bottom-0.5 text-[8px] leading-none text-muted-foreground"
                  >PM</span>
                </template>
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
import { ref, computed, onMounted, nextTick } from 'vue'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  LoaderCircle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CalendarX2,
  TriangleAlert,
  CalendarDays,
  Check,
  X,
  ExternalLink,
  Search,
  Printer,
  FileText,
  ImageIcon,
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
const periodType = ref<'week' | 'month' | 'custom'>('month')
const currentYear = ref(new Date().getFullYear())
const currentMonth = ref(new Date().getMonth() + 1)
const currentWeek = ref(getWeekNumber(new Date()))
const absenceTypes = ref<AbsenceTypeDTO[]>([])

// Custom period
const customStartDate = ref('')
const customEndDate = ref('')
const customDateError = ref('')

const customPresets = [
  { label: '2 mois', months: 2 },
  { label: '3 mois', months: 3 },
  { label: '6 mois', months: 6 },
]

const isCustomRangeValid = computed(() => {
  if (!customStartDate.value || !customEndDate.value) return false
  return customStartDate.value <= customEndDate.value
})

const gridColumns = computed(() => {
  const count = dates.value.length
  // Adapter la taille min des colonnes selon le nombre de jours
  // pour minimiser le scroll horizontal sur les grandes plages
  let minCol = 44
  if (count > 60) minCol = 24
  else if (count > 45) minCol = 28
  else if (count > 31) minCol = 32
  return `200px repeat(${count}, minmax(${minCol}px, 1fr))`
})

const isCompactGrid = computed(() => dates.value.length > 31)

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
  }
  const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
  return `${monthNames[currentMonth.value - 1]} ${currentYear.value}`
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
    customDateError.value = ''

    if (periodType.value === 'custom') {
      if (!customStartDate.value || !customEndDate.value) {
        customDateError.value = 'Les deux dates sont requises.'
        return
      }
      if (customStartDate.value > customEndDate.value) {
        customDateError.value = 'La date de début doit être avant la date de fin.'
        return
      }
    }

    loading.value = true
    error.value = ''

    let params: Record<string, string | number>

    if (periodType.value === 'custom') {
      params = {
        periodType: 'custom',
        startDate: customStartDate.value,
        endDate: customEndDate.value,
      }
    } else {
      params = {
        periodType: periodType.value,
        year: currentYear.value,
      }
      if (periodType.value === 'week') {
        params.week = currentWeek.value
      } else {
        params.month = currentMonth.value
      }
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
  periodType.value = value as 'week' | 'month' | 'custom'
  if (periodType.value === 'custom') {
    // Initialiser avec le mois en cours si vide
    if (!customStartDate.value) {
      const today = new Date()
      customStartDate.value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`
      const endMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0)
      customEndDate.value = `${endMonth.getFullYear()}-${String(endMonth.getMonth() + 1).padStart(2, '0')}-${String(endMonth.getDate()).padStart(2, '0')}`
    }
    loadPlanning()
  } else {
    loadPlanning()
  }
}

const applyPreset = (months: number) => {
  const today = new Date()
  const start = new Date(today.getFullYear(), today.getMonth(), 1)
  const end = new Date(today.getFullYear(), today.getMonth() + months, 0)
  customStartDate.value = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`
  customEndDate.value = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`
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

function hexToRgba(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

const getDayCellClass = (user: PlanningUserDTO, date: DateInfo): string[] => {
  const absence = getAbsenceForDate(user, date)
  const classes: string[] = []

  if (!absence) {
    if (date.isToday) classes.push('bg-primary/10')
    if (date.isWeekend && !date.isToday) classes.push('bg-muted/50')
    if (date.isHoliday && !date.isToday) classes.push('bg-destructive/5')
  }

  if (absence) {
    classes.push('cursor-pointer')
    classes.push('hover:brightness-95')
    if (!absence.absenceType?.color && absence.status) {
      switch (absence.status) {
        case 'APPROVED': classes.push('bg-emerald-500/15'); break
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
    const opacity = absence.status === 'APPROVED' ? 0.25 : 0.15
    const color = hexToRgba(absence.absenceType.color, opacity)
    const transparent = 'transparent'

    if (absence.period === 'MORNING') {
      return { background: `linear-gradient(to bottom, ${color} 50%, ${transparent} 50%)` }
    }
    if (absence.period === 'AFTERNOON') {
      return { background: `linear-gradient(to bottom, ${transparent} 50%, ${color} 50%)` }
    }
    return { backgroundColor: color }
  }

  return {}
}

const getAbsenceIconStyle = (user: PlanningUserDTO, date: DateInfo): Record<string, string> => {
  const absence = getAbsenceForDate(user, date)
  if (!absence) return {}

  if (absence.status === 'APPROVED' && absence.absenceType?.color) {
    return { color: absence.absenceType.color }
  }

  switch (absence.status) {
    case 'APPROVED': return { color: '#16a34a' }
    case 'PENDING': return { color: '#d97706' }
    case 'REJECTED': return { color: '#dc2626' }
    default: return {}
  }
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

// Export
const isExporting = ref(false)

function getExportPeriodLabel(): string {
  if (!planningData.value.startDate || !planningData.value.endDate) return ''
  const start = new Date(planningData.value.startDate)
  const end = new Date(planningData.value.endDate)
  const fmt = (d: Date) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  return `${fmt(start)} — ${fmt(end)}`
}

function getExportFileName(ext: string): string {
  const s = planningData.value.startDate
  const e = planningData.value.endDate
  return `planning-absences_${s}_${e}.${ext}`
}

function generateAbbreviation(name: string): string {
  if (!name) return '?'
  if (name.length <= 3) return name.toUpperCase()
  const words = name.trim().split(/\s+/)
  if (words.length >= 2) {
    return words.map(w => w.charAt(0).toUpperCase()).join('').slice(0, 3)
  }
  return name.slice(0, 3).toUpperCase()
}

function darkenHex(hex: string): string {
  const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - 90)
  const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - 90)
  const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - 90)
  return `rgb(${r},${g},${b})`
}

function buildExportHtml(): string {
  // Abbreviation map
  const abbrMap = new Map<string, { abbr: string; color: string; name: string }>()
  const usedAbbrs = new Set<string>()
  for (const type of absenceTypes.value) {
    if (!type.uuid || !type.name) continue
    let abbr = generateAbbreviation(type.name)
    while (usedAbbrs.has(abbr)) abbr += type.name.charAt(abbr.length) || '+'
    usedAbbrs.add(abbr)
    abbrMap.set(type.uuid, { abbr, color: type.color || '#888888', name: type.name })
  }

  // Month spans for header
  const monthSpans: { label: string; colspan: number }[] = []
  let curMonthKey = ''
  for (const date of dates.value) {
    const d = new Date(date.dateStr)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    const label = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    if (key !== curMonthKey) {
      monthSpans.push({ label: label.charAt(0).toUpperCase() + label.slice(1), colspan: 1 })
      curMonthKey = key
    } else {
      monthSpans[monthSpans.length - 1]!.colspan++
    }
  }

  // Adaptive sizing
  const nDays = dates.value.length
  let colW = 32, empW = 180, fs = 10, rowH = 30
  if (nDays > 62) { colW = 22; empW = 150; fs = 8; rowH = 24 }
  else if (nDays > 31) { colW = 26; empW = 160; fs = 9; rowH = 26 }

  const B = '1px solid #aaa'
  const BB = '2px solid #333'

  let h = `<div style="font-family:Arial,Helvetica,sans-serif;background:#fff;padding:24px 20px;color:#111;">`

  // Title
  h += `<div style="margin-bottom:14px;">`
  h += `<div style="font-size:16px;font-weight:800;letter-spacing:.5px;text-transform:uppercase;">Planning des absences</div>`
  h += `<div style="font-size:11px;color:#555;margin-top:3px;">${getExportPeriodLabel()} &nbsp;·&nbsp; Généré le ${new Date().toLocaleDateString('fr-FR')}</div>`
  h += `</div>`

  // Table
  h += `<table style="border-collapse:collapse;font-size:${fs}px;line-height:1.3;">`

  // Month header
  h += `<tr>`
  h += `<th style="border:${BB};padding:4px;background:#e0e0e0;min-width:${empW}px;width:${empW}px;"></th>`
  for (const span of monthSpans) {
    h += `<th colspan="${span.colspan}" style="border:${BB};padding:3px 2px;background:#e0e0e0;text-align:center;font-size:${fs}px;font-weight:700;">${span.label}</th>`
  }
  h += `</tr>`

  // Day header
  h += `<tr>`
  h += `<th style="border:${BB};padding:4px 8px;background:#f2f2f2;text-align:left;font-weight:700;">Employé</th>`
  let prevM = -1
  for (const date of dates.value) {
    const d = new Date(date.dateStr)
    const m = d.getMonth()
    const lb = m !== prevM && prevM !== -1 ? BB : B
    prevM = m
    let bg = '#f2f2f2', clr = '#222'
    if (date.isWeekend) { bg = '#d9d9d9'; clr = '#555' }
    if (date.isHoliday) { bg = '#f5c6cb'; clr = '#721c24' }
    const dl = date.dayName.charAt(0).toUpperCase()
    h += `<th style="border:${B};border-left:${lb};border-top:${BB};padding:2px 0;min-width:${colW}px;width:${colW}px;text-align:center;background:${bg};color:${clr};font-weight:600;">`
    h += `${dl}<br><span style="font-size:${Math.max(fs, 8)}px;">${date.dayNumber}</span>`
    if (date.isHoliday) h += `<br><span style="font-size:5px;color:#721c24;">●</span>`
    h += `</th>`
  }
  h += `</tr>`

  // User rows
  for (let i = 0; i < planningData.value.users.length; i++) {
    const user = planningData.value.users[i]!
    // Alternate row bg for readability
    const rowBg = i % 2 === 0 ? '#fff' : '#f9f9f9'
    h += `<tr>`
    h += `<td style="border:${BB};padding:4px 8px;background:${rowBg};font-weight:600;white-space:nowrap;height:${rowH}px;">`
    h += `${user.firstName} ${user.lastName}`
    h += `</td>`

    prevM = -1
    for (const date of dates.value) {
      const d = new Date(date.dateStr)
      const m = d.getMonth()
      const lb = m !== prevM && prevM !== -1 ? BB : B
      prevM = m

      const absence = getAbsenceForDate(user, date)
      let bg = rowBg, txt = '', clr = '#333', fw = 'normal', bdr = `border:${B};border-left:${lb};`

      if (!absence) {
        if (date.isWeekend) bg = '#ececec'
        if (date.isHoliday) bg = '#fde8e8'
      } else {
        const info = absence.absenceType?.uuid ? abbrMap.get(absence.absenceType.uuid) : null
        const abbr = info?.abbr || (absence.customType ? generateAbbreviation(absence.customType) : '')
        const color = info?.color || absence.absenceType?.color || '#888888'

        if (absence.status === 'APPROVED') {
          bg = hexToRgba(color, 0.35)
          clr = darkenHex(color)
          txt = abbr
          fw = 'bold'
        } else if (absence.status === 'PENDING') {
          bg = hexToRgba(color, 0.15)
          clr = '#444'
          txt = abbr + '?'
          bdr = `border:1px dashed #999;border-left:${lb};`
        }
        if (absence.period === 'MORNING') txt += '↑'
        else if (absence.period === 'AFTERNOON') txt += '↓'
      }

      h += `<td style="${bdr}padding:1px;text-align:center;background:${bg};color:${clr};font-weight:${fw};font-size:${Math.max(fs - 1, 7)}px;height:${rowH}px;">${txt}</td>`
    }
    h += `</tr>`
  }

  h += `</table>`

  // Legend
  h += `<div style="margin-top:14px;display:flex;flex-wrap:wrap;gap:12px;font-size:${fs}px;align-items:center;">`
  h += `<span style="font-weight:700;color:#444;text-transform:uppercase;letter-spacing:.5px;font-size:${fs - 1}px;">Légende :</span>`
  for (const [, info] of abbrMap) {
    h += `<span style="display:inline-flex;align-items:center;gap:4px;">`
    h += `<span style="display:inline-block;width:14px;height:14px;background:${hexToRgba(info.color, 0.35)};border:2px solid ${info.color};border-radius:2px;"></span>`
    h += `<strong>${info.abbr}</strong> = ${info.name}`
    h += `</span>`
  }
  h += `</div>`
  h += `<div style="margin-top:6px;font-size:${Math.max(fs - 1, 7)}px;color:#777;">? = En attente · ↑ = Matin · ↓ = Après-midi · ● = Jour férié · Lignes alternées pour lisibilité N&B</div>`
  h += `</div>`

  return h
}

async function exportPlanning(format: 'pdf' | 'png') {
  if (!planningData.value.users.length || isExporting.value) return
  isExporting.value = true

  try {
    // Build offscreen print-optimized element
    const container = document.createElement('div')
    container.style.cssText = 'position:absolute;left:-9999px;top:0;'
    container.innerHTML = buildExportHtml()
    document.body.appendChild(container)
    await nextTick()

    const html2canvas = (await import('html2canvas-pro')).default
    const canvas = await html2canvas(container, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false,
    })
    document.body.removeChild(container)

    if (format === 'png') {
      const link = document.createElement('a')
      link.download = getExportFileName('png')
      link.href = canvas.toDataURL('image/png')
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      return
    }

    // PDF — A4 paysage avec pagination
    const { jsPDF } = await import('jspdf')
    const A4_W = 297, A4_H = 210, MARGIN = 8, HEADER_H = 14
    const usableW = A4_W - MARGIN * 2
    const usableH = A4_H - MARGIN * 2 - HEADER_H

    const ratio = usableW / canvas.width
    const scaledH = canvas.height * ratio

    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

    const drawPageHeader = (pageNum: number, totalPages: number) => {
      pdf.setFontSize(11)
      pdf.setTextColor(30, 30, 30)
      pdf.text(`Planning des absences — ${getExportPeriodLabel()}`, MARGIN, MARGIN + 5)
      pdf.setFontSize(8)
      pdf.setTextColor(120, 120, 120)
      pdf.text(`Page ${pageNum}/${totalPages}`, A4_W - MARGIN, MARGIN + 5, { align: 'right' })
      pdf.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, A4_W - MARGIN, MARGIN + 9, { align: 'right' })
    }

    if (scaledH <= usableH) {
      drawPageHeader(1, 1)
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', MARGIN, MARGIN + HEADER_H, usableW, scaledH)
    } else {
      const totalPages = Math.ceil(scaledH / usableH)
      const sliceHeightPx = usableH / ratio

      for (let page = 0; page < totalPages; page++) {
        if (page > 0) pdf.addPage()
        drawPageHeader(page + 1, totalPages)

        const srcY = page * sliceHeightPx
        const srcH = Math.min(sliceHeightPx, canvas.height - srcY)
        const destH = srcH * ratio

        const sliceCanvas = document.createElement('canvas')
        sliceCanvas.width = canvas.width
        sliceCanvas.height = srcH
        const ctx = sliceCanvas.getContext('2d')!
        ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH)

        pdf.addImage(sliceCanvas.toDataURL('image/png'), 'PNG', MARGIN, MARGIN + HEADER_H, usableW, destH)
      }
    }

    pdf.save(getExportFileName('pdf'))
  } catch (err) {
    console.error('Export failed:', err)
    error.value = 'Erreur lors de l\'export. Veuillez réessayer.'
  } finally {
    isExporting.value = false
  }
}

onMounted(() => {
  loadPlanning()
  loadAbsenceTypes()
})
</script>
