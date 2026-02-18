<template>
  <div class="min-h-screen bg-background">
    <main class="px-4 py-4 sm:px-6 sm:py-6">
      <div class="mx-auto max-w-[1200px]">
        <!-- Loading -->
        <div v-if="loading" class="flex flex-col items-center justify-center gap-4 py-16">
          <LoaderCircle class="size-10 animate-spin text-primary" />
          <p class="text-lg text-muted-foreground">Chargement des utilisateurs...</p>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="mb-4 rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
          {{ error }}
        </div>

        <!-- Content -->
        <div v-else>
          <!-- Export Form Card -->
          <div class="rounded-lg border bg-card p-6 shadow-sm">
            <h2 class="mb-5 text-xl font-semibold text-foreground">Paramètres d'export</h2>

            <!-- Success Message -->
            <div v-if="exportSuccess" class="mb-4 flex items-center gap-3 rounded-lg border border-green-500/50 bg-green-500/10 p-4 font-medium text-green-600 dark:text-green-400">
              <CheckCircle2 class="size-5 shrink-0" />
              {{ exportSuccess }}
            </div>

            <!-- Error Message -->
            <div v-if="exportError" class="mb-4 flex items-center gap-3 rounded-lg border border-destructive bg-destructive/10 p-4 font-medium text-destructive">
              <AlertCircle class="size-5 shrink-0" />
              {{ exportError }}
            </div>

            <form class="space-y-6" @submit.prevent="handleExport">
              <!-- Period Section -->
              <div class="border-b pb-6">
                <h3 class="mb-4 text-lg font-semibold text-foreground">Période</h3>
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div class="flex flex-col gap-2">
                    <label for="startDate" class="text-sm font-medium text-muted-foreground">Date de début *</label>
                    <Input
                      id="startDate"
                      v-model="exportParams.startDate"
                      type="date"
                      required
                      :disabled="exporting"
                      :max="exportParams.endDate"
                    />
                  </div>
                  <div class="flex flex-col gap-2">
                    <label for="endDate" class="text-sm font-medium text-muted-foreground">Date de fin *</label>
                    <Input
                      id="endDate"
                      v-model="exportParams.endDate"
                      type="date"
                      required
                      :disabled="exporting"
                      :min="exportParams.startDate"
                    />
                  </div>
                </div>

                <!-- Period Presets -->
                <div class="mt-4 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    :disabled="exporting"
                    @click="selectPeriod('thisMonth')"
                  >
                    Ce mois
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    :disabled="exporting"
                    @click="selectPeriod('lastMonth')"
                  >
                    Mois dernier
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    :disabled="exporting"
                    @click="selectPeriod('thisYear')"
                  >
                    Cette année
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    :disabled="exporting"
                    @click="selectPeriod('last30Days')"
                  >
                    30 derniers jours
                  </Button>
                </div>
              </div>

              <!-- Users Section -->
              <div class="border-b pb-6">
                <div class="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <h3 class="text-lg font-semibold text-foreground">Utilisateurs</h3>
                  <div class="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      :disabled="exporting"
                      @click="selectAllUsers"
                    >
                      Tout sélectionner
                    </Button>
                    <span class="text-muted-foreground">|</span>
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      :disabled="exporting"
                      @click="deselectAllUsers"
                    >
                      Tout désélectionner
                    </Button>
                  </div>
                </div>

                <!-- Search Bar -->
                <div class="relative mb-4">
                  <Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    v-model="searchQuery"
                    type="search"
                    placeholder="Rechercher par nom ou email..."
                    class="pl-9"
                    :disabled="exporting"
                  />
                </div>

                <!-- Selected Count -->
                <div class="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge>{{ selectedUsers.length }}</Badge>
                  <span>utilisateur{{ selectedUsers.length > 1 ? 's' : '' }} sélectionné{{ selectedUsers.length > 1 ? 's' : '' }}</span>
                </div>

                <!-- Users List -->
                <div class="max-h-[400px] overflow-y-auto rounded-lg border bg-muted/30">
                  <label
                    v-for="user in filteredUsers"
                    :key="user.uuid"
                    class="flex cursor-pointer items-center border-b p-3 transition-colors last:border-b-0 hover:bg-accent"
                    :class="{ 'cursor-not-allowed opacity-60': exporting }"
                  >
                    <input
                      v-model="selectedUsers"
                      type="checkbox"
                      :value="user.uuid"
                      :disabled="exporting"
                      class="mr-3 size-5 accent-primary"
                    />
                    <div class="flex flex-1 items-center gap-3">
                      <!-- Avatar -->
                      <div class="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
                        <img
                          v-if="user.pictureUrl"
                          :src="user.pictureUrl"
                          :alt="`Photo de ${user.firstName}`"
                          class="size-full object-cover"
                        />
                        <span v-else class="flex size-full items-center justify-center bg-primary text-sm font-semibold text-primary-foreground">
                          {{ getInitials(user.firstName, user.lastName) }}
                        </span>
                      </div>
                      <!-- User Details -->
                      <div class="flex-1">
                        <div class="font-medium text-foreground">{{ user.firstName }} {{ user.lastName }}</div>
                        <div class="text-sm text-muted-foreground">{{ user.email }}</div>
                      </div>
                      <!-- Role Badge -->
                      <span
                        v-if="user.role"
                        class="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                        :style="{ backgroundColor: user.role.color }"
                      >
                        {{ user.role.nom }}
                      </span>
                    </div>
                  </label>

                  <!-- Empty State -->
                  <div v-if="filteredUsers.length === 0" class="py-8 text-center italic text-muted-foreground">
                    Aucun utilisateur trouvé
                  </div>
                </div>
              </div>

              <!-- Export Button -->
              <div>
                <Button
                  type="submit"
                  class="w-full"
                  :disabled="selectedUsers.length === 0 || exporting"
                >
                  <LoaderCircle v-if="exporting" class="mr-2 size-4 animate-spin" />
                  <Download v-else class="mr-2 size-4" />
                  {{ exporting ? 'Export en cours...' : 'Exporter en Excel' }}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { usersService, exportService } from '@/services'
import type { ExportHoursRequest } from '@/services/export'
import type { UserDTO } from '@/models'

// shadcn components
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

// Lucide icons
import { Search, LoaderCircle, Download, CheckCircle2, AlertCircle } from 'lucide-vue-next'

// State
const users = ref<UserDTO[]>([])
const loading = ref(true)
const error = ref('')
const exporting = ref(false)
const exportSuccess = ref('')
const exportError = ref('')
const searchQuery = ref('')
const selectedUsers = ref<string[]>([])

// Helper to format date to YYYY-MM-DD
const formatDateToISO = (date: Date): string => {
  return date.toISOString().split('T')[0] ?? ''
}

// Initialize dates with current month
const currentDate = new Date()
const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

const exportParams = ref({
  startDate: formatDateToISO(firstDayOfMonth),
  endDate: formatDateToISO(lastDayOfMonth)
})

// Filtered users
const filteredUsers = computed(() => {
  if (!searchQuery.value.trim()) {
    return users.value
  }
  const query = searchQuery.value.toLowerCase()
  return users.value.filter(user => {
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase()
    const email = (user.email || '').toLowerCase()
    return fullName.includes(query) || email.includes(query)
  })
})

// Load users
const loadUsers = async () => {
  try {
    loading.value = true
    error.value = ''
    const response = await usersService.getUsers()

    // Gérer différentes structures possibles de réponse
    if (response && response.data) {
      users.value = Array.isArray(response.data) ? response.data : []
    } else if (Array.isArray(response)) {
      users.value = response as unknown as UserDTO[]
    } else {
      users.value = []
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Erreur lors du chargement des utilisateurs'
  } finally {
    loading.value = false
  }
}

// User selection
const selectAllUsers = () => {
  selectedUsers.value = filteredUsers.value
    .map(u => u.uuid)
    .filter((uuid): uuid is string => uuid !== undefined)
}

const deselectAllUsers = () => {
  selectedUsers.value = []
}

const getInitials = (firstName: string | undefined, lastName: string | undefined): string => {
  const first = firstName ? firstName.charAt(0).toUpperCase() : ''
  const last = lastName ? lastName.charAt(0).toUpperCase() : ''
  return first + last || '?'
}

// Select predefined periods
const selectPeriod = (period: 'thisMonth' | 'lastMonth' | 'thisYear' | 'last30Days') => {
  const now = new Date()
  let start: Date
  let end: Date

  switch (period) {
    case 'thisMonth':
      start = new Date(now.getFullYear(), now.getMonth(), 1)
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      break
    case 'lastMonth':
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      end = new Date(now.getFullYear(), now.getMonth(), 0)
      break
    case 'thisYear':
      start = new Date(now.getFullYear(), 0, 1)
      end = new Date(now.getFullYear(), 11, 31)
      break
    case 'last30Days':
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      end = now
      break
  }

  exportParams.value.startDate = formatDateToISO(start)
  exportParams.value.endDate = formatDateToISO(end)
}

// Handle export
const handleExport = async () => {
  if (selectedUsers.value.length === 0) {
    exportError.value = 'Veuillez sélectionner au moins un utilisateur'
    return
  }

  try {
    exporting.value = true
    exportSuccess.value = ''
    exportError.value = ''

    const exportData: ExportHoursRequest = {
      userUuids: selectedUsers.value,
      startDate: exportParams.value.startDate,
      endDate: exportParams.value.endDate
    }

    const blob = await exportService.exportHours(exportData)

    // Create download link
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url

    // File name with period
    const fileName = `heures_${exportParams.value.startDate}_${exportParams.value.endDate}.xlsx`
    link.setAttribute('download', fileName)

    document.body.appendChild(link)
    link.click()

    // Cleanup
    link.remove()
    window.URL.revokeObjectURL(url)

    exportSuccess.value = 'Export réussi ! Le fichier a été téléchargé.'

    // Clear success message after 5 seconds
    setTimeout(() => {
      exportSuccess.value = ''
    }, 5000)
  } catch (err) {
    exportError.value = err instanceof Error ? err.message : 'Erreur lors de l\'export'
  } finally {
    exporting.value = false
  }
}

onMounted(() => {
  loadUsers()
})
</script>
