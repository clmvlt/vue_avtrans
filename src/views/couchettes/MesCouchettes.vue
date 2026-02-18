<template>
  <div class="min-h-screen bg-background">
    <!-- Header -->
    <header class="sticky top-0 z-40 border-b bg-background">
      <div class="mx-auto flex max-w-[1400px] items-center gap-4 px-6 py-4">
        <Retour fallback="/" />
        <h1 class="text-xl font-bold text-foreground">Mes Couchettes</h1>
      </div>
    </header>

    <main class="px-6 py-6">
      <div class="mx-auto max-w-[1400px]">
        <!-- Loading -->
        <div v-if="loading" class="flex flex-col items-center justify-center gap-4 py-16">
          <LoaderCircle class="size-10 animate-spin text-primary" />
          <p class="text-lg text-muted-foreground">Chargement...</p>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="mb-4 rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
          {{ error }}
        </div>

        <!-- Content -->
        <div v-else class="space-y-6">
          <!-- Action Card -->
          <div class="rounded-lg border bg-card p-6 shadow-sm">
            <div class="mb-5 flex items-start gap-4">
              <div class="flex size-14 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <BedDouble class="size-7" />
              </div>
              <div class="flex-1">
                <h2 class="mb-2 text-xl font-bold text-foreground">Déclarer une couchette</h2>
                <p v-if="hasTodayCouchette" class="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <CheckCircle class="size-4" />
                  Couchette déclarée pour aujourd'hui
                </p>
                <p v-else class="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock class="size-4" />
                  Aucune couchette déclarée pour aujourd'hui
                </p>
              </div>
            </div>

            <Button
              v-if="!hasTodayCouchette"
              variant="default"
              size="lg"
              class="w-full"
              :disabled="creating"
              @click="createTodayCouchette"
            >
              <Plus v-if="!creating" class="size-4" />
              <LoaderCircle v-else class="size-4 animate-spin" />
              Déclarer ma couchette du jour
            </Button>
            <Button
              v-else
              variant="destructive"
              size="lg"
              class="w-full"
              :disabled="deleting"
              @click="confirmDeleteToday"
            >
              <Trash2 v-if="!deleting" class="size-4" />
              <LoaderCircle v-else class="size-4 animate-spin" />
              Annuler ma couchette du jour
            </Button>
          </div>

          <!-- Stats Cards -->
          <div class="grid grid-cols-2 gap-4">
            <!-- Month Count -->
            <div class="flex items-center gap-3 rounded-lg border bg-card p-4 shadow-sm">
              <div class="flex size-11 items-center justify-center rounded-md bg-primary/10 text-primary">
                <CalendarCheck class="size-5" />
              </div>
              <div class="flex flex-col">
                <span class="text-xs uppercase tracking-wider text-muted-foreground">Ce mois</span>
                <span class="text-2xl font-bold text-foreground">{{ monthCount }}</span>
              </div>
            </div>

            <!-- Total Count -->
            <div class="flex items-center gap-3 rounded-lg border bg-card p-4 shadow-sm">
              <div class="flex size-11 items-center justify-center rounded-md bg-primary/10 text-primary">
                <BedDouble class="size-5" />
              </div>
              <div class="flex flex-col">
                <span class="text-xs uppercase tracking-wider text-muted-foreground">Total</span>
                <span class="text-2xl font-bold text-foreground">{{ totalElements }}</span>
              </div>
            </div>
          </div>

          <!-- History Section -->
          <div class="rounded-lg border bg-card shadow-sm">
            <div class="border-b px-6 py-4">
              <h2 class="text-lg font-bold text-foreground">Historique</h2>
            </div>

            <!-- Empty State -->
            <div v-if="couchettes.length === 0" class="flex flex-col items-center gap-4 py-12 text-center">
              <BedDouble class="size-16 opacity-50 text-muted-foreground" />
              <p class="text-muted-foreground">Aucune couchette déclarée</p>
            </div>

            <!-- Couchettes List -->
            <div v-else class="divide-y">
              <div
                v-for="couchette in couchettes"
                :key="couchette.uuid"
                class="flex items-center gap-4 px-6 py-4"
              >
                <Calendar class="size-4 text-muted-foreground flex-shrink-0" />
                <div class="flex flex-col gap-0.5 flex-1">
                  <span class="font-medium text-foreground">{{ formatDate(couchette.date) }}</span>
                  <span class="text-sm text-muted-foreground capitalize">{{ getDayName(couchette.date) }}</span>
                  <span class="text-xs text-muted-foreground">Déclaré le {{ formatDateTime(couchette.createdAt) }}</span>
                </div>
                <Button
                  v-if="isToday(couchette.date)"
                  variant="ghost"
                  size="icon-sm"
                  @click="confirmDelete(couchette)"
                  title="Supprimer"
                >
                  <Trash2 class="size-4 text-destructive" />
                </Button>
              </div>
            </div>

            <!-- Pagination -->
            <div v-if="totalPages > 1" class="flex items-center justify-center gap-4 border-t px-6 py-4">
              <Button
                variant="outline"
                size="sm"
                :disabled="currentPage === 0"
                @click="goToPage(currentPage - 1)"
              >
                <ChevronLeft class="size-4" />
                Précédent
              </Button>
              <span class="text-sm text-muted-foreground">
                Page {{ currentPage + 1 }} sur {{ totalPages }}
              </span>
              <Button
                variant="outline"
                size="sm"
                :disabled="currentPage >= totalPages - 1"
                @click="goToPage(currentPage + 1)"
              >
                Suivant
                <ChevronRight class="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Delete Dialog -->
    <Dialog v-model:open="showDeleteModal">
      <DialogContent class="sm:max-w-md" @interact-outside.prevent>
        <DialogHeader>
          <DialogTitle>Supprimer la couchette</DialogTitle>
          <DialogDescription>Cette action est irréversible.</DialogDescription>
        </DialogHeader>

        <div v-if="couchetteToDelete" class="space-y-3 rounded-lg border bg-muted/50 p-4">
          <div class="flex justify-between text-sm">
            <span class="text-muted-foreground">Date</span>
            <span class="font-medium">{{ formatDate(couchetteToDelete.date) }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-muted-foreground">Jour</span>
            <span class="font-medium capitalize">{{ getDayName(couchetteToDelete.date) }}</span>
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

// shadcn components
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

// Lucide icons
import {
  BedDouble,
  CalendarCheck,
  Plus,
  Trash2,
  LoaderCircle,
  CheckCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from 'lucide-vue-next'

// Legacy components (kept per project rules)
import { Retour } from '@/components/ui/retour'

const messages = useMessages()

// State
const loading = ref(true)
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

// Computed
const hasTodayCouchette = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  return couchettes.value.some(c => c.date === today)
})

const todayCouchette = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  return couchettes.value.find(c => c.date === today)
})

const monthCount = computed(() => {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  return couchettes.value.filter(c => {
    if (!c.date) return false
    const date = new Date(c.date)
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear
  }).length
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
const isToday = (dateStr?: string): boolean => {
  if (!dateStr) return false
  const today = new Date().toISOString().split('T')[0]
  return dateStr === today
}

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '-'
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  } catch {
    return dateStr
  }
}

const getDayName = (dateStr?: string): string => {
  if (!dateStr) return ''
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR', { weekday: 'long' })
  } catch {
    return ''
  }
}

const formatDateTime = (dateStr?: Date | string): string => {
  if (!dateStr) return '-'
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return '-'
  }
}

// Lifecycle
onMounted(() => {
  loadCouchettes()
})
</script>
