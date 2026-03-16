<template>
  <Dialog :open="isOpen" @update:open="val => { if (!val) close() }">
    <DialogContent class="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
      <DialogHeader>
        <div class="flex items-center gap-4">
          <div class="flex size-14 items-center justify-center rounded-full bg-violet-500/10 text-violet-500">
            <Clock class="size-7" />
          </div>
          <div>
            <DialogTitle>Heures travaillees</DialogTitle>
            <DialogDescription>{{ userName }}</DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <!-- Period selector -->
      <div class="flex flex-wrap gap-2">
        <Button
          v-for="period in periods"
          :key="period.value"
          :variant="selectedPeriod === period.value ? 'default' : 'outline'"
          size="sm"
          @click="selectPeriod(period.value)"
        >
          {{ period.label }}
        </Button>
      </div>

      <!-- Date selectors (when not 'all') -->
      <div v-if="selectedPeriod !== 'all'" class="rounded-lg border bg-muted/50 p-4">

        <!-- Year selector -->
        <div v-if="selectedPeriod === 'year'" class="space-y-3">
          <div class="flex items-center gap-2 rounded-lg border bg-background p-2">
            <Button variant="ghost" size="icon-sm" @click="previousYear" title="Annee precedente">
              <ChevronLeft class="size-4" />
            </Button>
            <div class="relative flex flex-1 cursor-pointer flex-col items-center gap-1 rounded-md px-2 py-1 hover:bg-accent" @click="openYearPicker">
              <span class="font-semibold text-foreground">{{ dateParams.year }}</span>
              <Calendar class="size-3 text-muted-foreground" />
              <input
                ref="yearInputRef"
                type="number"
                class="absolute inset-0 w-[90px] mx-auto rounded-md border-2 border-primary bg-background p-2 text-center text-lg font-semibold text-foreground opacity-0 focus:opacity-100 focus:z-10"
                v-model.number="dateParams.year"
                min="2020"
                :max="currentYear"
                @blur="showYearInput = false"
              />
            </div>
            <Button variant="ghost" size="icon-sm" @click="nextYear" title="Annee suivante" :disabled="dateParams.year >= currentYear">
              <ChevronRight class="size-4" />
            </Button>
          </div>
          <Button variant="outline" size="sm" class="w-full" @click="goToCurrentYear">Annee actuelle</Button>
        </div>

        <!-- Month selector -->
        <div v-else-if="selectedPeriod === 'month'" class="space-y-3">
          <div class="flex items-center gap-2 rounded-lg border bg-background p-2">
            <Button variant="ghost" size="icon-sm" @click="previousMonth">
              <ChevronLeft class="size-4" />
            </Button>
            <div class="relative flex flex-1 cursor-pointer flex-col items-center gap-1 rounded-md px-2 py-1 hover:bg-accent" @click="toggleMonthDropdown">
              <span class="font-semibold text-foreground">{{ getMonthName(dateParams.month) }} {{ dateParams.year }}</span>
              <Calendar class="size-3 text-muted-foreground" />

              <!-- Month dropdown -->
              <div v-if="showMonthDropdown" class="absolute left-1/2 top-full z-10 mt-2 min-w-[240px] -translate-x-1/2 rounded-lg border bg-popover p-3 shadow-lg" @click.stop>
                <div class="mb-3 flex gap-2">
                  <select
                    v-model="dateParams.monthString"
                    class="flex-1 rounded-md border bg-background p-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option v-for="opt in monthOptions" :key="opt.value" :value="opt.value">
                      {{ opt.label }}
                    </option>
                  </select>
                  <select
                    v-model="dateParams.yearString"
                    class="flex-1 rounded-md border bg-background p-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option v-for="opt in yearOptions" :key="opt.value" :value="opt.value">
                      {{ opt.label }}
                    </option>
                  </select>
                </div>
                <Button variant="default" size="sm" class="w-full" @click="showMonthDropdown = false">Valider</Button>
              </div>
            </div>
            <Button variant="ghost" size="icon-sm" @click="nextMonth" :disabled="isCurrentMonth">
              <ChevronRight class="size-4" />
            </Button>
          </div>
          <Button variant="outline" size="sm" class="w-full" @click="goToCurrentMonth">Mois actuel</Button>
        </div>

        <!-- Week selector -->
        <div v-else-if="selectedPeriod === 'week'" class="space-y-3">
          <div class="flex items-center gap-2 rounded-lg border bg-background p-2">
            <Button variant="ghost" size="icon-sm" @click="previousWeek">
              <ChevronLeft class="size-4" />
            </Button>
            <div class="relative flex flex-1 cursor-pointer flex-col items-center gap-1 rounded-md px-2 py-1 hover:bg-accent">
              <span class="font-semibold text-foreground">Semaine {{ dateParams.week }} / {{ dateParams.year }}</span>
              <span class="text-sm text-muted-foreground">{{ weekDateRange }}</span>
              <CalendarRange class="size-3 text-muted-foreground" />
              <input
                type="week"
                class="absolute inset-0 cursor-pointer opacity-0"
                :value="weekInputValue"
                @change="onWeekInputChange"
              />
            </div>
            <Button variant="ghost" size="icon-sm" @click="nextWeek">
              <ChevronRight class="size-4" />
            </Button>
          </div>
          <Button variant="outline" size="sm" class="w-full" @click="goToCurrentWeek">Semaine actuelle</Button>
        </div>

        <!-- Day selector -->
        <div v-else-if="selectedPeriod === 'day'" class="space-y-3">
          <div class="flex items-center gap-2 rounded-lg border bg-background p-2">
            <Button variant="ghost" size="icon-sm" @click="previousDay">
              <ChevronLeft class="size-4" />
            </Button>
            <div class="relative flex flex-1 cursor-pointer flex-col items-center gap-1 rounded-md px-2 py-1 hover:bg-accent" @click="openDatePicker">
              <span class="font-semibold text-foreground">{{ formatDayDisplay }}</span>
              <span class="text-sm text-muted-foreground">{{ getDayOfWeek }}</span>
              <CalendarDays class="size-3 text-muted-foreground" />
              <input
                ref="dateInputRef"
                type="date"
                class="absolute inset-0 opacity-0"
                :value="dateParams.dateString"
                @change="onDateInputChange"
              />
            </div>
            <Button variant="ghost" size="icon-sm" @click="nextDay" :disabled="isToday">
              <ChevronRight class="size-4" />
            </Button>
          </div>
          <Button variant="outline" size="sm" class="w-full" @click="goToToday">Aujourd'hui</Button>
        </div>
      </div>

      <!-- Hours content -->
      <div class="relative min-h-[120px]">
        <!-- Loading overlay -->
        <div v-if="loadingHours" class="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-background/80">
          <LoaderCircle class="size-8 animate-spin text-primary" />
        </div>

        <!-- Error -->
        <div v-if="hoursError" class="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
          {{ hoursError }}
        </div>

        <!-- No data -->
        <div v-else-if="!loadingHours && !hoursData" class="flex items-center justify-center py-12 italic text-muted-foreground">
          Aucune donnee disponible pour cette periode
        </div>

        <!-- Stats cards -->
        <div v-else-if="hoursData" class="grid grid-cols-2 gap-4 sm:grid-cols-3" :class="{ 'pointer-events-none opacity-50': loadingHours }">
          <div v-if="hoursData.day !== undefined" class="flex items-center gap-4 rounded-lg border-l-4 border-l-violet-500 bg-muted/50 p-4">
            <div class="flex size-12 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500">
              <Sun class="size-6" />
            </div>
            <div>
              <p class="text-sm text-muted-foreground">Jour</p>
              <p class="text-2xl font-semibold text-foreground">{{ formatHours(hoursData.day) }}</p>
            </div>
          </div>

          <div v-if="hoursData.week !== undefined" class="flex items-center gap-4 rounded-lg border-l-4 border-l-green-500 bg-muted/50 p-4">
            <div class="flex size-12 items-center justify-center rounded-lg bg-green-500/10 text-green-500">
              <CalendarRange class="size-6" />
            </div>
            <div>
              <p class="text-sm text-muted-foreground">Semaine</p>
              <p class="text-2xl font-semibold text-foreground">{{ formatHours(hoursData.week) }}</p>
            </div>
          </div>

          <div v-if="hoursData.month !== undefined" class="flex items-center gap-4 rounded-lg border-l-4 border-l-amber-500 bg-muted/50 p-4">
            <div class="flex size-12 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <CalendarDays class="size-6" />
            </div>
            <div>
              <p class="text-sm text-muted-foreground">Mois</p>
              <p class="text-2xl font-semibold text-foreground">{{ formatHours(hoursData.month) }}</p>
            </div>
          </div>

          <div v-if="hoursData.year !== undefined" class="flex items-center gap-4 rounded-lg border-l-4 border-l-purple-500 bg-muted/50 p-4">
            <div class="flex size-12 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
              <Calendar class="size-6" />
            </div>
            <div>
              <p class="text-sm text-muted-foreground">Annee</p>
              <p class="text-2xl font-semibold text-foreground">{{ formatHours(hoursData.year) }}</p>
            </div>
          </div>

          <div v-if="hoursData.lastMonth !== undefined" class="flex items-center gap-4 rounded-lg border-l-4 border-l-sky-500 bg-muted/50 p-4">
            <div class="flex size-12 items-center justify-center rounded-lg bg-sky-500/10 text-sky-500">
              <CalendarMinus class="size-6" />
            </div>
            <div>
              <p class="text-sm text-muted-foreground">Mois dernier</p>
              <p class="text-2xl font-semibold text-foreground">{{ formatHours(hoursData.lastMonth) }}</p>
            </div>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { userServicesService } from '@/services/userServices'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Clock, Sun, CalendarDays, CalendarRange, Calendar, CalendarMinus, ChevronLeft, ChevronRight, LoaderCircle } from 'lucide-vue-next'

// Type pour les donnees des heures
interface HoursData {
  year?: number
  month?: number
  week?: number
  day?: number
  lastMonth?: number
}

// ===== Fonctions utilitaires de calcul de semaine ISO 8601 =====

/**
 * Calcule le numero de semaine ISO 8601 pour une date donnee
 */
const getISOWeek = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

/**
 * Calcule l'annee ISO 8601 (peut differer de l'annee calendaire en debut/fin d'annee)
 */
const getISOWeekYear = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  return d.getUTCFullYear()
}

/**
 * Retourne la date du lundi d'une semaine ISO donnee
 */
const getDateFromISOWeek = (year: number, week: number): Date => {
  const jan4 = new Date(Date.UTC(year, 0, 4))
  const dayOfWeek = jan4.getUTCDay() || 7
  const monday = new Date(jan4)
  monday.setUTCDate(jan4.getUTCDate() - dayOfWeek + 1 + (week - 1) * 7)
  return monday
}

/**
 * Retourne le nombre de semaines ISO dans une annee
 */
const getISOWeeksInYear = (year: number): number => {
  const dec31 = new Date(Date.UTC(year, 11, 31))
  const week = getISOWeek(dec31)
  return week === 1 ? getISOWeek(new Date(Date.UTC(year, 11, 24))) : week
}

/**
 * Formate une date en francais court (ex: "13 jan.")
 */
const formatDateShort = (date: Date): string => {
  const months = ['jan.', 'fev.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'aout', 'sept.', 'oct.', 'nov.', 'dec.']
  return `${date.getUTCDate()} ${months[date.getUTCMonth()]}`
}

// ===== Etat interne =====
const isOpen = ref(false)
const userUuid = ref('')
const userName = ref('')
const loadingHours = ref(false)
const hoursError = ref('')
const hoursData = ref<HoursData | null>(null)
const selectedPeriod = ref<'all' | 'day' | 'week' | 'month' | 'year'>('all')

// Refs pour les inputs de date
const yearInputRef = ref<HTMLInputElement | null>(null)
const dateInputRef = ref<HTMLInputElement | null>(null)
const showYearInput = ref(false)
const showMonthDropdown = ref(false)

// Dates - Calcul ISO 8601 correct
const now = new Date()
const currentYear = now.getFullYear()
const currentMonth = now.getMonth() + 1
const currentWeek = getISOWeek(now)
const currentISOYear = getISOWeekYear(now)

const dateParams = ref({
  year: currentISOYear,
  month: currentMonth,
  week: currentWeek,
  day: null as number | null,
  dateString: now.toISOString().split('T')[0] || '',
  // Versions string pour les selects natifs (qui nécessitent des strings)
  monthString: String(currentMonth),
  yearString: String(currentISOYear)
})

// Liste des années disponibles (de 2020 à l'année courante)
const availableYears = computed(() => {
  const years = []
  for (let y = 2020; y <= currentYear; y++) {
    years.push(y)
  }
  return years
})

// Options pour les selects natifs mois et année
const monthOptions = computed(() => {
  return Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: getMonthName(i + 1)
  }))
})

const yearOptions = computed(() => {
  return availableYears.value.map(y => ({
    value: String(y),
    label: String(y)
  }))
})

// Watchers pour synchroniser les versions string avec les valeurs numériques
watch(() => dateParams.value.monthString, (newVal) => {
  const parsed = parseInt(newVal, 10)
  if (dateParams.value.month !== parsed) {
    dateParams.value.month = parsed
  }
})

watch(() => dateParams.value.yearString, (newVal) => {
  const parsed = parseInt(newVal, 10)
  if (dateParams.value.year !== parsed) {
    dateParams.value.year = parsed
  }
})

// Watchers inversés pour mettre à jour les strings quand les numériques changent
watch(() => dateParams.value.month, (newVal) => {
  const str = String(newVal)
  if (dateParams.value.monthString !== str) {
    dateParams.value.monthString = str
  }
})

watch(() => dateParams.value.year, (newVal) => {
  const str = String(newVal)
  if (dateParams.value.yearString !== str) {
    dateParams.value.yearString = str
  }
})

const toggleMonthDropdown = () => {
  showMonthDropdown.value = !showMonthDropdown.value
}

// ===== Computed pour l'affichage de la plage de dates =====
const weekDateRange = computed(() => {
  const monday = getDateFromISOWeek(dateParams.value.year, dateParams.value.week)
  const sunday = new Date(monday)
  sunday.setUTCDate(monday.getUTCDate() + 6)

  const startStr = formatDateShort(monday)
  const endStr = formatDateShort(sunday)

  // Ajouter l'annee si differente ou si on affiche pour une autre annee
  if (monday.getUTCFullYear() !== sunday.getUTCFullYear()) {
    return `${startStr} ${monday.getUTCFullYear()} - ${endStr} ${sunday.getUTCFullYear()}`
  }
  return `${startStr} - ${endStr} ${sunday.getUTCFullYear()}`
})

// ===== Navigation de semaine =====
const previousWeek = () => {
  if (dateParams.value.week > 1) {
    dateParams.value.week--
  } else {
    // Passer a l'annee precedente
    dateParams.value.year--
    dateParams.value.week = getISOWeeksInYear(dateParams.value.year)
  }
}

const nextWeek = () => {
  const maxWeeks = getISOWeeksInYear(dateParams.value.year)
  if (dateParams.value.week < maxWeeks) {
    dateParams.value.week++
  } else {
    // Passer a l'annee suivante
    dateParams.value.year++
    dateParams.value.week = 1
  }
}

const goToCurrentWeek = () => {
  dateParams.value.year = currentISOYear
  dateParams.value.week = currentWeek
}

// ===== Navigation de jour =====
const formatDayDisplay = computed(() => {
  if (!dateParams.value.dateString) return ''
  const date = new Date(dateParams.value.dateString)
  const day = date.getDate()
  const months = ['janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin', 'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre']
  return `${day} ${months[date.getMonth()]} ${date.getFullYear()}`
})

const getDayOfWeek = computed(() => {
  if (!dateParams.value.dateString) return ''
  const date = new Date(dateParams.value.dateString)
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
  return days[date.getDay()]
})

const isToday = computed(() => {
  return dateParams.value.dateString === now.toISOString().split('T')[0]
})

const previousDay = () => {
  const date = new Date(dateParams.value.dateString)
  date.setDate(date.getDate() - 1)
  dateParams.value.dateString = date.toISOString().split('T')[0] ?? ''
}

const nextDay = () => {
  const date = new Date(dateParams.value.dateString)
  date.setDate(date.getDate() + 1)
  dateParams.value.dateString = date.toISOString().split('T')[0] ?? ''
}

const goToToday = () => {
  dateParams.value.dateString = now.toISOString().split('T')[0] ?? ''
}

// ===== Navigation de mois =====
const isCurrentMonth = computed(() => {
  return dateParams.value.year === currentYear && dateParams.value.month === currentMonth
})

const previousMonth = () => {
  if (dateParams.value.month > 1) {
    dateParams.value.month--
  } else {
    dateParams.value.year--
    dateParams.value.month = 12
  }
}

const nextMonth = () => {
  if (dateParams.value.month < 12) {
    dateParams.value.month++
  } else {
    dateParams.value.year++
    dateParams.value.month = 1
  }
}

const goToCurrentMonth = () => {
  dateParams.value.year = currentYear
  dateParams.value.month = currentMonth
}

// ===== Navigation d'annee =====
const previousYear = () => {
  dateParams.value.year--
}

const nextYear = () => {
  if (dateParams.value.year < currentYear) {
    dateParams.value.year++
  }
}

const goToCurrentYear = () => {
  dateParams.value.year = currentYear
}

// ===== Fonctions pour ouvrir les pickers =====
const openYearPicker = () => {
  showYearInput.value = true
  setTimeout(() => {
    yearInputRef.value?.focus()
    yearInputRef.value?.select()
  }, 0)
}

const openDatePicker = () => {
  const input = dateInputRef.value
  if (input) {
    if (typeof input.showPicker === 'function') {
      input.showPicker()
    } else {
      input.focus()
      input.click()
    }
  }
}


// ===== Valeurs computed pour les inputs =====
const weekInputValue = computed(() => {
  const week = dateParams.value.week.toString().padStart(2, '0')
  return `${dateParams.value.year}-W${week}`
})

// ===== Handlers pour les changements d'input =====
const onWeekInputChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const value = target.value // Format: "2025-W03"
  if (value) {
    const match = value.match(/^(\d{4})-W(\d{2})$/)
    if (match) {
      dateParams.value.year = parseInt(match[1] ?? '0', 10)
      dateParams.value.week = parseInt(match[2] ?? '0', 10)
    }
  }
}

const onDateInputChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const value = target.value // Format: "2025-01-17"
  if (value) {
    dateParams.value.dateString = value
  }
}

// Periodes disponibles
const periods = [
  { value: 'all', label: 'Toutes' },
  { value: 'day', label: 'Jour' },
  { value: 'week', label: 'Semaine' },
  { value: 'month', label: 'Mois' },
  { value: 'year', label: 'Annee' }
]

// Methode publique pour ouvrir la modal
const open = (uuid: string, name: string) => {
  userUuid.value = uuid
  userName.value = name
  selectedPeriod.value = 'all'
  hoursData.value = null
  hoursError.value = ''

  // Reset des dates à la date actuelle
  const today = new Date()
  const resetYear = getISOWeekYear(today)
  const resetMonth = today.getMonth() + 1
  dateParams.value = {
    year: resetYear,
    month: resetMonth,
    week: getISOWeek(today),
    day: null,
    dateString: today.toISOString().split('T')[0] || '',
    monthString: String(resetMonth),
    yearString: String(resetYear)
  }

  // Fermer les dropdowns
  showMonthDropdown.value = false
  showYearInput.value = false

  isOpen.value = true
  loadHoursData()
}

const close = () => {
  isOpen.value = false
}

const selectPeriod = (period: string) => {
  selectedPeriod.value = period as 'all' | 'day' | 'week' | 'month' | 'year'
  // Charger automatiquement les données pour toutes les périodes
  loadHoursData()
}

// Watcher pour recharger automatiquement quand les paramètres de date changent
watch(
  () => ({
    year: dateParams.value.year,
    month: dateParams.value.month,
    week: dateParams.value.week,
    dateString: dateParams.value.dateString
  }),
  () => {
    // Ne recharger que si une période spécifique est sélectionnée et que la modal est ouverte
    if (selectedPeriod.value !== 'all' && isOpen.value && userUuid.value) {
      loadHoursData()
    }
  }
)

const loadHoursData = async () => {
  if (!userUuid.value) return

  try {
    loadingHours.value = true
    hoursError.value = ''

    const params: Record<string, any> = {}

    if (selectedPeriod.value !== 'all') {
      params.period = selectedPeriod.value
    }

    // Ajouter les parametres de date selon la periode selectionnee
    if (selectedPeriod.value === 'day' && dateParams.value.dateString) {
      const date = new Date(dateParams.value.dateString)
      params.year = date.getFullYear()
      params.month = date.getMonth() + 1
      params.day = date.getDate()
    } else if (selectedPeriod.value === 'week') {
      params.year = dateParams.value.year
      params.week = dateParams.value.week
    } else if (selectedPeriod.value === 'month') {
      params.year = dateParams.value.year
      params.month = dateParams.value.month
    } else if (selectedPeriod.value === 'year') {
      params.year = dateParams.value.year
    }

    const response = await userServicesService.getUserWorkedHours(userUuid.value, params)
    hoursData.value = (response.data ? response.data : response) as HoursData
  } catch (err: any) {
    hoursError.value = err.message || 'Erreur lors du chargement des heures'
  } finally {
    loadingHours.value = false
  }
}

const formatHours = (hours?: number) => {
  if (hours === null || hours === undefined) return '-'
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return `${h}h ${m.toString().padStart(2, '0')}m`
}

const getMonthName = (month: number): string => {
  const months = ['Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin',
                  'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre']
  return months[month - 1] ?? 'Janvier'
}

// Exposer la methode open pour l'utilisation externe
defineExpose({ open })
</script>
