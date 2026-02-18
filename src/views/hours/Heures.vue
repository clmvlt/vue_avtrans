<template>
  <div class="min-h-screen bg-background">
    <main class="px-4 py-4 md:px-6 md:py-6">
      <div class="mx-auto max-w-[1400px]">
        <!-- Loading -->
        <div v-if="loading" class="flex flex-col items-center justify-center gap-4 py-16">
          <LoaderCircle class="size-10 animate-spin text-primary" />
          <p class="text-lg text-muted-foreground">Chargement des heures...</p>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="mb-4 rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
          {{ error }}
        </div>

        <!-- Content -->
        <div v-else class="space-y-4">
          <!-- Action bar -->
          <div class="flex justify-end">
            <Button variant="outline" size="sm" @click="loadHours" :disabled="loading">
              <RefreshCw class="mr-2 size-4" :class="{ 'animate-spin': loading }" />
              Actualiser
            </Button>
          </div>

          <!-- Stats globales -->
          <div class="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <!-- Today -->
            <div class="flex items-center gap-4 rounded-lg border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
              <div class="flex size-12 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500">
                <CalendarDays class="size-6" />
              </div>
              <div>
                <p class="text-sm text-muted-foreground">Aujourd'hui</p>
                <p class="text-2xl font-bold text-foreground">{{ formatHours(totalHours.day) }}</p>
              </div>
            </div>

            <!-- Week -->
            <div class="flex items-center gap-4 rounded-lg border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
              <div class="flex size-12 shrink-0 items-center justify-center rounded-lg bg-green-500/10 text-green-500">
                <CalendarRange class="size-6" />
              </div>
              <div>
                <p class="text-sm text-muted-foreground">Cette semaine</p>
                <p class="text-2xl font-bold text-foreground">{{ formatHours(totalHours.week) }}</p>
              </div>
            </div>

            <!-- Month -->
            <div class="flex items-center gap-4 rounded-lg border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
              <div class="flex size-12 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                <Calendar class="size-6" />
              </div>
              <div>
                <p class="text-sm text-muted-foreground">Ce mois</p>
                <p class="text-2xl font-bold text-foreground">{{ formatHours(totalHours.month) }}</p>
              </div>
            </div>

            <!-- Last month -->
            <div class="flex items-center gap-4 rounded-lg border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
              <div class="flex size-12 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-500">
                <History class="size-6" />
              </div>
              <div>
                <p class="text-sm text-muted-foreground">Mois dernier</p>
                <p class="text-2xl font-bold text-foreground">{{ formatHours(totalHours.lastMonth) }}</p>
              </div>
            </div>

            <!-- Year -->
            <div class="flex items-center gap-4 rounded-lg border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
              <div class="flex size-12 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
                <TrendingUp class="size-6" />
              </div>
              <div>
                <p class="text-sm text-muted-foreground">Cette annee</p>
                <p class="text-2xl font-bold text-foreground">{{ formatHours(totalHours.year) }}</p>
              </div>
            </div>
          </div>

          <!-- Search bar -->
          <div class="relative">
            <Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              v-model="searchQuery"
              type="search"
              placeholder="Rechercher un employe..."
              class="pl-9"
            />
          </div>

          <!-- Mobile Cards View -->
          <div class="space-y-3 md:hidden">
            <p class="text-sm text-muted-foreground">{{ filteredUsers.length }} employé(s)</p>

            <!-- Empty state mobile -->
            <div v-if="sortedData.length === 0" class="flex flex-col items-center gap-3 py-12 text-muted-foreground">
              <Clock class="size-10 opacity-50" />
              <p>Aucun employé trouvé</p>
            </div>

            <!-- User Cards -->
            <div
              v-for="item in sortedData"
              :key="item.user?.uuid || Math.random()"
              class="rounded-lg border bg-card p-4 shadow-sm"
            >
              <!-- Header: User info -->
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
                <div class="flex flex-1 flex-col">
                  <span class="font-medium text-foreground">{{ item.user?.firstName }} {{ item.user?.lastName }}</span>
                  <Badge
                    :variant="getPresenceBadgeVariant(item.user?.status)"
                    :class="getPresenceBadgeClass(item.user?.status)"
                    class="mt-1 w-fit"
                  >
                    {{ getPresenceLabel(item.user?.status) }}
                  </Badge>
                </div>
              </div>

              <!-- Hours grid -->
              <div class="mt-3 grid grid-cols-3 gap-2 text-center">
                <div class="rounded bg-muted/50 p-2">
                  <p class="text-xs text-muted-foreground">Jour</p>
                  <p class="text-lg font-bold" :class="getHoursClass(item.hoursDay)">{{ formatHours(item.hoursDay) }}</p>
                </div>
                <div class="rounded bg-muted/50 p-2">
                  <p class="text-xs text-muted-foreground">Semaine</p>
                  <p class="text-lg font-bold" :class="getHoursClass(item.hoursWeek)">{{ formatHours(item.hoursWeek) }}</p>
                </div>
                <div class="rounded bg-muted/50 p-2">
                  <p class="text-xs text-muted-foreground">Mois</p>
                  <p class="text-lg font-bold" :class="getHoursClass(item.hoursMonth)">{{ formatHours(item.hoursMonth) }}</p>
                </div>
              </div>
              <div class="mt-2 grid grid-cols-2 gap-2 text-center">
                <div class="rounded bg-muted/50 p-2">
                  <p class="text-xs text-muted-foreground">Mois dernier</p>
                  <p class="text-lg font-bold" :class="getHoursClass(item.hoursLastMonth)">{{ formatHours(item.hoursLastMonth) }}</p>
                </div>
                <div class="rounded bg-muted/50 p-2">
                  <p class="text-xs text-muted-foreground">Année</p>
                  <p class="text-lg font-bold" :class="getHoursClass(item.hoursYear)">{{ formatHours(item.hoursYear) }}</p>
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
                <TableRow v-for="item in sortedData" :key="item.user?.uuid || Math.random()">
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
                      <div class="flex flex-col">
                        <span class="font-medium text-foreground">{{ item.user?.firstName }} {{ item.user?.lastName }}</span>
                        <span class="text-sm text-muted-foreground">{{ item.user?.email }}</span>
                      </div>
                    </div>
                  </TableCell>

                  <!-- Presence -->
                  <TableCell>
                    <Badge
                      :variant="getPresenceBadgeVariant(item.user?.status)"
                      :class="getPresenceBadgeClass(item.user?.status)"
                    >
                      {{ getPresenceLabel(item.user?.status) }}
                    </Badge>
                  </TableCell>

                  <!-- Today hours -->
                  <TableCell class="text-center">
                    <span class="text-lg font-bold" :class="getHoursClass(item.hoursDay)">
                      {{ formatHours(item.hoursDay) }}
                    </span>
                  </TableCell>

                  <!-- Week hours -->
                  <TableCell class="text-center">
                    <span class="text-lg font-bold" :class="getHoursClass(item.hoursWeek)">
                      {{ formatHours(item.hoursWeek) }}
                    </span>
                  </TableCell>

                  <!-- Month hours -->
                  <TableCell class="text-center">
                    <span class="text-lg font-bold" :class="getHoursClass(item.hoursMonth)">
                      {{ formatHours(item.hoursMonth) }}
                    </span>
                  </TableCell>

                  <!-- Last month hours -->
                  <TableCell class="text-center">
                    <span class="text-lg font-bold" :class="getHoursClass(item.hoursLastMonth)">
                      {{ formatHours(item.hoursLastMonth) }}
                    </span>
                  </TableCell>

                  <!-- Year hours -->
                  <TableCell class="text-center">
                    <span class="text-lg font-bold" :class="getHoursClass(item.hoursYear)">
                      {{ formatHours(item.hoursYear) }}
                    </span>
                  </TableCell>
                </TableRow>

                <!-- Empty state -->
                <TableRow v-if="sortedData.length === 0">
                  <TableCell :col-span="tableColumns.length" class="py-12 text-center">
                    <div class="flex flex-col items-center gap-3 text-muted-foreground">
                      <Clock class="size-10 opacity-50" />
                      <p>Aucun employe trouve</p>
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
import { ref, onMounted, computed } from 'vue'
import { usersService } from '@/services'
import type { UserWithHoursDTO } from '@/models'
import { UserStatus, UserStatusLabels } from '@/enums'

// shadcn components
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
  CalendarDays,
  CalendarRange,
  Calendar,
  History,
  TrendingUp,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Clock,
} from 'lucide-vue-next'

interface TotalHours {
  day: number
  week: number
  month: number
  lastMonth: number
  year: number
}

interface TableColumnDef {
  key: string
  label: string
  sortable?: boolean
  align?: 'left' | 'center' | 'right'
}

interface UserWithHoursSortable extends UserWithHoursDTO {
  fullName: string
  statusSort: string
  hoursDay: number
  hoursWeek: number
  hoursMonth: number
  hoursLastMonth: number
  hoursYear: number
}

const users = ref<UserWithHoursDTO[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const searchQuery = ref('')

// Sort state
const sortKey = ref<string | null>(null)
const sortDirection = ref<'asc' | 'desc'>('asc')

const getInitials = (firstName?: string, lastName?: string): string => {
  const first = firstName ? firstName.charAt(0).toUpperCase() : ''
  const last = lastName ? lastName.charAt(0).toUpperCase() : ''
  return first + last || '?'
}

const loadHours = async () => {
  loading.value = true
  error.value = null
  try {
    const response = await usersService.getUsersWithHours()
    users.value = response.users || []
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Erreur lors du chargement des heures'
  } finally {
    loading.value = false
  }
}

const formatHours = (hours: number | null | undefined): string => {
  if (hours === null || hours === undefined || hours === 0) return '0h'
  return `${hours.toFixed(1)}h`
}

const getHoursClass = (hours: number | null | undefined): string => {
  if (!hours || hours === 0) return 'text-muted-foreground'
  if (hours < 4) return 'text-amber-600 dark:text-amber-400'
  return 'text-violet-600 dark:text-violet-400'
}

// Presence badge helpers
const getPresenceLabel = (status?: UserStatus): string => {
  if (!status) return UserStatusLabels[UserStatus.ABSENT]
  return UserStatusLabels[status] || status
}

const getPresenceBadgeVariant = (status?: UserStatus): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case UserStatus.PRESENT:
      return 'outline'
    case UserStatus.ON_BREAK:
      return 'outline'
    default:
      return 'secondary'
  }
}

const getPresenceBadgeClass = (status?: UserStatus): string => {
  switch (status) {
    case UserStatus.PRESENT:
      return 'border-green-500/50 text-green-600 dark:text-green-400'
    case UserStatus.ON_BREAK:
      return 'border-amber-500/50 text-amber-600 dark:text-amber-400'
    default:
      return 'text-muted-foreground'
  }
}

// Computed pour les utilisateurs filtrés avec propriétés plates pour le tri
const filteredUsers = computed<UserWithHoursSortable[]>(() => {
  // Filtrer les entrées qui n'ont pas d'utilisateur
  const validUsers = users.value.filter(entry => entry.user != null)

  // Ajouter des propriétés plates pour le tri
  const usersWithSortFields = validUsers.map(entry => ({
    ...entry,
    // Propriétés plates pour le tri
    fullName: `${entry.user?.firstName || ''} ${entry.user?.lastName || ''}`.trim(),
    statusSort: entry.user?.status || '',
    hoursDay: entry.hours?.hoursDay || 0,
    hoursWeek: entry.hours?.hoursWeek || 0,
    hoursMonth: entry.hours?.hoursMonth || 0,
    hoursLastMonth: entry.hours?.hoursLastMonth || 0,
    hoursYear: entry.hours?.hoursYear || 0
  }))

  if (!searchQuery.value.trim()) return usersWithSortFields

  const query = searchQuery.value.toLowerCase()
  return usersWithSortFields.filter(userEntry => {
    const fullName = userEntry.fullName.toLowerCase()
    const email = (userEntry.user?.email || '').toLowerCase()
    return fullName.includes(query) || email.includes(query)
  })
})

// Calcul des totaux
const totalHours = computed<TotalHours>(() => {
  const totals: TotalHours = {
    day: 0,
    week: 0,
    month: 0,
    lastMonth: 0,
    year: 0
  }

  users.value.forEach(userEntry => {
    if (userEntry.hours) {
      totals.day += userEntry.hours.hoursDay || 0
      totals.week += userEntry.hours.hoursWeek || 0
      totals.month += userEntry.hours.hoursMonth || 0
      totals.lastMonth += userEntry.hours.hoursLastMonth || 0
      totals.year += userEntry.hours.hoursYear || 0
    }
  })

  return totals
})

// Colonnes du tableau avec tri activé
const tableColumns = computed<TableColumnDef[]>(() => [
  { key: 'fullName', label: `Employes (${filteredUsers.value.length})`, sortable: true },
  { key: 'statusSort', label: 'Présence', sortable: true },
  { key: 'hoursDay', label: "Aujourd'hui", align: 'center', sortable: true },
  { key: 'hoursWeek', label: 'Semaine', align: 'center', sortable: true },
  { key: 'hoursMonth', label: 'Mois', align: 'center', sortable: true },
  { key: 'hoursLastMonth', label: 'Mois dernier', align: 'center', sortable: true },
  { key: 'hoursYear', label: 'Annee', align: 'center', sortable: true }
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
  return key.split('.').reduce((obj: any, k: string) => obj?.[k], item)
}

const sortedData = computed(() => {
  if (!sortKey.value) return filteredUsers.value

  return [...filteredUsers.value].sort((a, b) => {
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

onMounted(() => {
  loadHours()
})
</script>
