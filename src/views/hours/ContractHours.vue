<template>
  <div class="min-h-screen bg-background">
    <main class="px-4 py-4 md:px-6 md:py-6">
      <div class="mx-auto max-w-[1400px]">
        <!-- Loading -->
        <div v-if="loading" class="flex flex-col items-center justify-center gap-4 py-16">
          <LoaderCircle class="size-10 animate-spin text-primary" />
          <p class="text-lg text-muted-foreground">Chargement des données contrat...</p>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="mb-4 rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
          {{ error }}
        </div>

        <!-- Content -->
        <div v-else class="space-y-4">
          <!-- Action bar -->
          <div class="flex flex-wrap items-center justify-between gap-3">
            <!-- Month/Year selector -->
            <div class="flex items-center gap-2">
              <Button variant="outline" size="icon" @click="prevMonth" :disabled="loading">
                <ChevronLeft class="size-4" />
              </Button>

              <div class="flex items-center gap-2">
                <Select
                  v-model="selectedMonthStr"
                  :options="monthOptions"
                  placeholder="Mois"
                  :searchable="false"
                  class="w-[140px]"
                />
                <Select
                  v-model="selectedYearStr"
                  :options="yearOptions"
                  placeholder="Année"
                  :searchable="false"
                  class="w-[100px]"
                />
              </div>

              <Button variant="outline" size="icon" @click="nextMonth" :disabled="loading">
                <ChevronRight class="size-4" />
              </Button>

              <Button variant="outline" size="sm" @click="goToCurrentMonth" :disabled="loading">
                Mois actuel
              </Button>
            </div>

            <Button variant="outline" size="sm" @click="loadData" :disabled="loading">
              <RefreshCw class="mr-2 size-4" :class="{ 'animate-spin': loading }" />
              Actualiser
            </Button>
          </div>

          <!-- Stats cards -->
          <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <!-- Total heures effectuées -->
            <div class="flex items-center gap-4 rounded-lg border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
              <div class="flex size-12 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500">
                <Clock class="size-6" />
              </div>
              <div>
                <p class="text-sm text-muted-foreground">Heures effectuées</p>
                <p class="text-2xl font-bold text-foreground">{{ formatHours(totalHeuresEffectuees) }}</p>
              </div>
            </div>

            <!-- Total heures contrat -->
            <div class="flex items-center gap-4 rounded-lg border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
              <div class="flex size-12 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                <FileText class="size-6" />
              </div>
              <div>
                <p class="text-sm text-muted-foreground">Heures contrat</p>
                <p class="text-2xl font-bold text-foreground">{{ formatHours(totalHeuresContrat) }}</p>
              </div>
            </div>

            <!-- Jours ouvrés -->
            <div class="flex items-center gap-4 rounded-lg border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
              <div class="flex size-12 shrink-0 items-center justify-center rounded-lg bg-green-500/10 text-green-500">
                <CalendarDays class="size-6" />
              </div>
              <div>
                <p class="text-sm text-muted-foreground">Jours ouvrés</p>
                <p class="text-2xl font-bold text-foreground">{{ joursOuvresMois ?? '-' }}</p>
              </div>
            </div>

            <!-- Employés avec contrat -->
            <div class="flex items-center gap-4 rounded-lg border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
              <div class="flex size-12 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-500">
                <Users class="size-6" />
              </div>
              <div>
                <p class="text-sm text-muted-foreground">Avec contrat</p>
                <p class="text-2xl font-bold text-foreground">{{ usersWithContract }} / {{ comparisons.length }}</p>
              </div>
            </div>
          </div>

          <!-- Search bar -->
          <div class="relative">
            <Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              v-model="searchQuery"
              type="search"
              placeholder="Rechercher un employé..."
              class="pl-9"
            />
          </div>

          <!-- Mobile Cards View -->
          <div class="space-y-3 md:hidden">
            <p class="text-sm text-muted-foreground">{{ filteredData.length }} employé(s)</p>

            <div v-if="filteredData.length === 0" class="flex flex-col items-center gap-3 py-12 text-muted-foreground">
              <FileText class="size-10 opacity-50" />
              <p>Aucun employé trouvé</p>
            </div>

            <div
              v-for="item in sortedData"
              :key="item.user.uuid"
              class="rounded-lg border bg-card p-4 shadow-sm"
            >
              <!-- Header: User info -->
              <div class="flex items-center gap-3">
                <div class="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
                  <img
                    v-if="item.user.pictureUrl"
                    :src="item.user.pictureUrl"
                    :alt="`Photo de ${item.user.firstName}`"
                    class="size-full object-cover"
                  />
                  <span v-else class="flex size-full items-center justify-center bg-primary text-sm font-semibold text-primary-foreground">
                    {{ getInitials(item.user.firstName, item.user.lastName) }}
                  </span>
                </div>
                <div class="flex flex-1 flex-col">
                  <span class="font-medium text-foreground">{{ item.user.firstName }} {{ item.user.lastName }}</span>
                  <span v-if="item.heureContrat != null" class="text-xs text-muted-foreground">
                    Contrat : {{ item.heureContrat }}h/mois
                  </span>
                  <span v-else class="text-xs text-muted-foreground italic">Pas de contrat défini</span>
                </div>
              </div>

              <!-- Stats grid -->
              <div class="mt-3 grid grid-cols-2 gap-2 text-center">
                <div class="rounded bg-muted/50 p-2">
                  <p class="text-xs text-muted-foreground">Effectuées</p>
                  <p class="text-lg font-bold text-violet-600 dark:text-violet-400">{{ formatHours(item.heuresEffectuees) }}</p>
                </div>
                <div class="rounded bg-muted/50 p-2">
                  <p class="text-xs text-muted-foreground">Contrat</p>
                  <p class="text-lg font-bold text-foreground">{{ item.heureContrat != null ? formatHours(item.heureContrat) : '-' }}</p>
                </div>
                <div class="rounded bg-muted/50 p-2">
                  <p class="text-xs text-muted-foreground">Différence</p>
                  <p class="text-lg font-bold" :class="getDifferenceClass(item.difference)">
                    {{ formatDifference(item.difference) }}
                  </p>
                </div>
                <div class="rounded bg-muted/50 p-2">
                  <p class="text-xs text-muted-foreground">Réalisation</p>
                  <p class="text-lg font-bold" :class="getPercentageClass(item.pourcentageRealisation)">
                    {{ formatPercentage(item.pourcentageRealisation) }}
                  </p>
                </div>
              </div>

              <div class="mt-2 grid grid-cols-3 gap-2 text-center">
                <div class="rounded bg-muted/50 p-2">
                  <p class="text-xs text-muted-foreground">Jours trav.</p>
                  <p class="text-sm font-semibold text-foreground">{{ item.joursTravailles }}</p>
                </div>
                <div class="rounded bg-muted/50 p-2">
                  <p class="text-xs text-muted-foreground">Absences</p>
                  <p class="text-sm font-semibold text-foreground">{{ item.joursAbsence }}j</p>
                </div>
                <div class="rounded bg-muted/50 p-2">
                  <p class="text-xs text-muted-foreground">Moy/jour</p>
                  <p class="text-sm font-semibold text-foreground">{{ item.moyenneHeuresParJour != null ? formatHours(item.moyenneHeuresParJour) : '-' }}</p>
                </div>
              </div>

              <!-- Progress bar -->
              <div v-if="item.heureContrat != null && item.heureContrat > 0" class="mt-3">
                <div class="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    class="h-full rounded-full transition-all duration-500"
                    :class="getProgressBarClass(item.pourcentageRealisation)"
                    :style="{ width: `${Math.min(item.pourcentageRealisation ?? 0, 100)}%` }"
                  />
                </div>
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
                      col.align === 'center' && 'text-center',
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
                <TableRow v-for="item in sortedData" :key="item.user.uuid">
                  <!-- User -->
                  <TableCell>
                    <div class="flex items-center gap-3">
                      <div class="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
                        <img
                          v-if="item.user.pictureUrl"
                          :src="item.user.pictureUrl"
                          :alt="`Photo de ${item.user.firstName}`"
                          class="size-full object-cover"
                        />
                        <span v-else class="flex size-full items-center justify-center bg-primary text-sm font-semibold text-primary-foreground">
                          {{ getInitials(item.user.firstName, item.user.lastName) }}
                        </span>
                      </div>
                      <div class="flex flex-col">
                        <span class="font-medium text-foreground">{{ item.user.firstName }} {{ item.user.lastName }}</span>
                        <span class="text-sm text-muted-foreground">{{ item.user.email }}</span>
                      </div>
                    </div>
                  </TableCell>

                  <!-- Contrat -->
                  <TableCell class="text-center">
                    <span v-if="item.heureContrat != null" class="font-medium text-foreground">
                      {{ formatHours(item.heureContrat) }}
                    </span>
                    <span v-else class="text-sm italic text-muted-foreground">Non défini</span>
                  </TableCell>

                  <!-- Effectuées -->
                  <TableCell class="text-center">
                    <span class="text-lg font-bold text-violet-600 dark:text-violet-400">
                      {{ formatHours(item.heuresEffectuees) }}
                    </span>
                  </TableCell>

                  <!-- Différence -->
                  <TableCell class="text-center">
                    <span class="text-lg font-bold" :class="getDifferenceClass(item.difference)">
                      {{ formatDifference(item.difference) }}
                    </span>
                  </TableCell>

                  <!-- Réalisation -->
                  <TableCell class="text-center">
                    <div v-if="item.pourcentageRealisation != null" class="flex flex-col items-center gap-1">
                      <span class="text-sm font-bold" :class="getPercentageClass(item.pourcentageRealisation)">
                        {{ formatPercentage(item.pourcentageRealisation) }}
                      </span>
                      <div class="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                        <div
                          class="h-full rounded-full transition-all duration-500"
                          :class="getProgressBarClass(item.pourcentageRealisation)"
                          :style="{ width: `${Math.min(item.pourcentageRealisation, 100)}%` }"
                        />
                      </div>
                    </div>
                    <span v-else class="text-sm text-muted-foreground">-</span>
                  </TableCell>

                  <!-- Jours travaillés -->
                  <TableCell class="text-center">
                    <span class="font-medium text-foreground">{{ item.joursTravailles }}</span>
                    <span class="text-muted-foreground"> / {{ item.joursOuvres }}</span>
                  </TableCell>

                  <!-- Absences -->
                  <TableCell class="text-center">
                    <span :class="item.joursAbsence > 0 ? 'font-medium text-amber-600 dark:text-amber-400' : 'text-muted-foreground'">
                      {{ item.joursAbsence }}j
                    </span>
                  </TableCell>

                  <!-- Moy/jour -->
                  <TableCell class="text-center">
                    <span v-if="item.moyenneHeuresParJour != null" class="font-medium text-foreground">
                      {{ formatHours(item.moyenneHeuresParJour) }}
                    </span>
                    <span v-else class="text-muted-foreground">-</span>
                  </TableCell>
                </TableRow>

                <!-- Empty state -->
                <TableRow v-if="sortedData.length === 0">
                  <TableCell :col-span="tableColumns.length" class="py-12 text-center">
                    <div class="flex flex-col items-center gap-3 text-muted-foreground">
                      <FileText class="size-10 opacity-50" />
                      <p>Aucun employé trouvé</p>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { usersService } from '@/services'
import type { UserContractComparisonDTO } from '@/models'

// shadcn components
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

// Lucide icons
import {
  Search,
  LoaderCircle,
  RefreshCw,
  Clock,
  CalendarDays,
  FileText,
  Users,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-vue-next'

interface TableColumnDef {
  key: string
  label: string
  sortable?: boolean
  align?: 'left' | 'center' | 'right'
}

interface ComparisonSortable extends UserContractComparisonDTO {
  fullName: string
}

const now = new Date()
const selectedMonth = ref(now.getMonth() + 1)
const selectedYear = ref(now.getFullYear())

const comparisons = ref<UserContractComparisonDTO[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const searchQuery = ref('')

// Sort state
const sortKey = ref<string | null>(null)
const sortDirection = ref<'asc' | 'desc'>('asc')

// Select bindings (string)
const selectedMonthStr = computed({
  get: () => String(selectedMonth.value),
  set: (val: string) => { selectedMonth.value = parseInt(val) || 1 },
})
const selectedYearStr = computed({
  get: () => String(selectedYear.value),
  set: (val: string) => { selectedYear.value = parseInt(val) || now.getFullYear() },
})

const monthOptions = [
  { value: '1', label: 'Janvier' },
  { value: '2', label: 'Février' },
  { value: '3', label: 'Mars' },
  { value: '4', label: 'Avril' },
  { value: '5', label: 'Mai' },
  { value: '6', label: 'Juin' },
  { value: '7', label: 'Juillet' },
  { value: '8', label: 'Août' },
  { value: '9', label: 'Septembre' },
  { value: '10', label: 'Octobre' },
  { value: '11', label: 'Novembre' },
  { value: '12', label: 'Décembre' },
]

const yearOptions = computed(() => {
  const currentYear = now.getFullYear()
  const years = []
  for (let y = currentYear - 2; y <= currentYear + 1; y++) {
    years.push({ value: String(y), label: String(y) })
  }
  return years
})

const prevMonth = () => {
  if (selectedMonth.value === 1) {
    selectedMonth.value = 12
    selectedYear.value--
  } else {
    selectedMonth.value--
  }
}

const nextMonth = () => {
  if (selectedMonth.value === 12) {
    selectedMonth.value = 1
    selectedYear.value++
  } else {
    selectedMonth.value++
  }
}

const goToCurrentMonth = () => {
  selectedMonth.value = now.getMonth() + 1
  selectedYear.value = now.getFullYear()
}

// Charger les données
const loadData = async () => {
  loading.value = true
  error.value = null
  try {
    const response = await usersService.getContractComparison(selectedYear.value, selectedMonth.value)
    comparisons.value = response.users || []
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Erreur lors du chargement des données'
  } finally {
    loading.value = false
  }
}

// Recharger quand mois/année changent
watch([selectedMonth, selectedYear], () => {
  loadData()
})

// Stats
const totalHeuresEffectuees = computed(() =>
  comparisons.value.reduce((sum, c) => sum + (c.heuresEffectuees || 0), 0)
)

const totalHeuresContrat = computed(() =>
  comparisons.value.reduce((sum, c) => sum + (c.heureContrat || 0), 0)
)

const joursOuvresMois = computed(() =>
  comparisons.value.length > 0 ? comparisons.value[0]?.joursOuvres ?? null : null
)

const usersWithContract = computed(() =>
  comparisons.value.filter(c => c.heureContrat != null).length
)

// Helpers
const getInitials = (firstName?: string, lastName?: string): string => {
  const first = firstName ? firstName.charAt(0).toUpperCase() : ''
  const last = lastName ? lastName.charAt(0).toUpperCase() : ''
  return first + last || '?'
}

const formatHours = (hours: number | null | undefined): string => {
  if (hours === null || hours === undefined) return '0h'
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  if (m === 0) return `${h}h`
  return `${h}h${m.toString().padStart(2, '0')}`
}

const formatDifference = (diff: number | null | undefined): string => {
  if (diff === null || diff === undefined) return '-'
  const sign = diff >= 0 ? '+' : ''
  return `${sign}${formatHours(Math.abs(diff))}`
}

const formatPercentage = (pct: number | null | undefined): string => {
  if (pct === null || pct === undefined) return '-'
  return `${pct.toFixed(1)}%`
}

const getDifferenceClass = (diff: number | null | undefined): string => {
  if (diff === null || diff === undefined) return 'text-muted-foreground'
  if (diff >= 0) return 'text-green-600 dark:text-green-400'
  return 'text-red-600 dark:text-red-400'
}

const getPercentageClass = (pct: number | null | undefined): string => {
  if (pct === null || pct === undefined) return 'text-muted-foreground'
  if (pct >= 100) return 'text-green-600 dark:text-green-400'
  if (pct >= 80) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
}

const getProgressBarClass = (pct: number | null | undefined): string => {
  if (pct === null || pct === undefined) return 'bg-muted-foreground'
  if (pct >= 100) return 'bg-green-500'
  if (pct >= 80) return 'bg-amber-500'
  return 'bg-red-500'
}

// Filtered & sorted data
const filteredData = computed<ComparisonSortable[]>(() => {
  const mapped = comparisons.value.map(c => ({
    ...c,
    fullName: `${c.user.firstName || ''} ${c.user.lastName || ''}`.trim(),
  }))

  if (!searchQuery.value.trim()) return mapped

  const query = searchQuery.value.toLowerCase()
  return mapped.filter(item => {
    const name = item.fullName.toLowerCase()
    const email = (item.user.email || '').toLowerCase()
    return name.includes(query) || email.includes(query)
  })
})

const tableColumns = computed<TableColumnDef[]>(() => [
  { key: 'fullName', label: `Employés (${filteredData.value.length})`, sortable: true },
  { key: 'heureContrat', label: 'Contrat', align: 'center', sortable: true },
  { key: 'heuresEffectuees', label: 'Effectuées', align: 'center', sortable: true },
  { key: 'difference', label: 'Différence', align: 'center', sortable: true },
  { key: 'pourcentageRealisation', label: 'Réalisation', align: 'center', sortable: true },
  { key: 'joursTravailles', label: 'Jours trav.', align: 'center', sortable: true },
  { key: 'joursAbsence', label: 'Absences', align: 'center', sortable: true },
  { key: 'moyenneHeuresParJour', label: 'Moy/jour', align: 'center', sortable: true },
])

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
  if (!sortKey.value) return filteredData.value

  return [...filteredData.value].sort((a, b) => {
    const aValue = getValue(a, sortKey.value!)
    const bValue = getValue(b, sortKey.value!)

    if (aValue == null && bValue == null) return 0
    if (aValue == null) return sortDirection.value === 'asc' ? 1 : -1
    if (bValue == null) return sortDirection.value === 'asc' ? -1 : 1

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection.value === 'asc' ? aValue - bValue : bValue - aValue
    }

    const aStr = String(aValue).toLowerCase()
    const bStr = String(bValue).toLowerCase()
    const comparison = aStr.localeCompare(bStr, 'fr')
    return sortDirection.value === 'asc' ? comparison : -comparison
  })
})

onMounted(() => {
  loadData()
})
</script>
