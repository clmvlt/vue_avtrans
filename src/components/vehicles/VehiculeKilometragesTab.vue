<template>
  <div class="space-y-6">
    <!-- Loading state -->
    <div v-if="loading" class="flex flex-col items-center justify-center gap-4 py-16">
      <LoaderCircle class="size-8 animate-spin text-primary" />
      <p class="text-sm text-muted-foreground">Chargement des kilometrages...</p>
    </div>

    <!-- Empty state -->
    <div v-else-if="kilometrages.length === 0" class="flex flex-col items-center justify-center gap-4 py-16">
      <div class="flex size-16 items-center justify-center rounded-full bg-primary/10">
        <Gauge class="size-8 text-primary" />
      </div>
      <p class="text-sm text-muted-foreground">Aucun kilometrage enregistre</p>
    </div>

    <!-- Content -->
    <div v-else class="space-y-6">
      <!-- Chart container -->
      <div class="rounded-lg border bg-card p-4">
        <canvas ref="kmChartCanvas"></canvas>
      </div>

      <!-- Timeline section -->
      <div class="space-y-4">
        <!-- Section header -->
        <div class="flex items-center justify-between">
          <h4 class="text-sm font-semibold text-foreground">
            Historique detaille ({{ totalElements }})
          </h4>
          <Button
            v-if="!showAll && totalElements > pageSize"
            variant="outline"
            size="sm"
            @click="emit('load-all')"
          >
            Voir tout
          </Button>
        </div>

        <!-- Timeline -->
        <div class="space-y-0">
          <div
            v-for="(km, index) in kilometrages"
            :key="km.id"
            class="relative flex gap-4 pb-6 last:pb-0"
          >
            <!-- Timeline marker and line -->
            <div class="flex flex-col items-center">
              <div class="size-3 shrink-0 rounded-full border-2 border-primary bg-background"></div>
              <div
                v-if="index < kilometrages.length - 1"
                class="w-px flex-1 bg-border"
              ></div>
            </div>

            <!-- Timeline content -->
            <div class="-mt-0.5 flex-1 space-y-1 pb-2">
              <div class="flex items-center gap-2">
                <span class="text-sm font-semibold text-foreground">
                  {{ formatNumber(km.km) }} km
                </span>
                <span class="text-xs text-muted-foreground">
                  {{ formatDate(km.createdAt) }}
                </span>
                <Button
                  v-if="isAdmin"
                  variant="ghost"
                  size="icon-sm"
                  @click="emit('edit-km', km)"
                  title="Modifier ce kilometrage"
                >
                  <Pencil class="size-3" />
                </Button>
              </div>

              <!-- User info -->
              <div v-if="km.user" class="flex items-center gap-2">
                <img
                  v-if="km.user.pictureUrl"
                  :src="km.user.pictureUrl"
                  :alt="`${km.user.firstName} ${km.user.lastName}`"
                  class="size-5 rounded-full object-cover"
                />
                <div
                  v-else
                  class="flex size-5 items-center justify-center rounded-full bg-muted"
                >
                  <User class="size-3 text-muted-foreground" />
                </div>
                <span class="text-xs text-muted-foreground">
                  {{ km.user.firstName }} {{ km.user.lastName }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="!showAll && totalPages > 1" class="flex items-center justify-center gap-4 pt-2">
          <Button
            variant="ghost"
            size="sm"
            :disabled="page === 0"
            @click="emit('update:page', page - 1)"
          >
            <ChevronLeft class="mr-1 size-4" />
            Precedent
          </Button>
          <span class="text-sm text-muted-foreground">
            Page {{ page + 1 }} / {{ totalPages }}
          </span>
          <Button
            variant="ghost"
            size="sm"
            :disabled="page >= totalPages - 1"
            @click="emit('update:page', page + 1)"
          >
            Suivant
            <ChevronRight class="ml-1 size-4" />
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import type { VehiculeKilometrageDTO } from '@/models'
import { Button } from '@/components/ui/button'
import { LoaderCircle, Gauge, Pencil, User, ChevronLeft, ChevronRight } from 'lucide-vue-next'

// Chart.js imports
import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartConfiguration
} from 'chart.js'

// Register Chart.js components
Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface Props {
  kilometrages: VehiculeKilometrageDTO[]
  loading: boolean
  page: number
  totalPages: number
  totalElements: number
  pageSize: number
  showAll: boolean
  isAdmin: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'edit-km', km: VehiculeKilometrageDTO): void
  (e: 'load-all'): void
  (e: 'update:page', page: number): void
}>()

// Chart.js
const kmChartCanvas = ref<HTMLCanvasElement | null>(null)
let kmChart: Chart | null = null

const updateKmChart = () => {
  if (!kmChartCanvas.value || props.kilometrages.length === 0) {
    return
  }

  // Sort kilometrages by date (oldest to newest)
  const sortedKm = [...props.kilometrages].sort((a, b) =>
    new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
  )

  // Prepare data for chart
  const labels = sortedKm.map(km => {
    const date = new Date(km.createdAt || 0)
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  })

  const dataPoints = sortedKm.map(km => km.km ?? 0)

  // Destroy existing chart if any
  if (kmChart) {
    kmChart.destroy()
  }

  // Create new chart
  const ctx = kmChartCanvas.value.getContext('2d')
  if (!ctx) return

  const config: ChartConfiguration<'line'> = {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Kilometrage',
        data: dataPoints,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.3,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverBackgroundColor: 'rgb(124, 131, 245)',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 3,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 2,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 1,
          padding: 12,
          displayColors: false,
          callbacks: {
            title: function(context) {
              const index = context[0]?.dataIndex ?? 0
              const km = sortedKm[index]
              return km?.user
                ? `${km.user.firstName} ${km.user.lastName}`
                : 'Utilisateur inconnu'
            },
            label: function(context) {
              return `${(context.parsed.y ?? 0).toLocaleString('fr-FR')} km`
            },
            afterLabel: function(context) {
              const index = context.dataIndex
              const km = sortedKm[index]
              const date = new Date(km?.createdAt || 0)
              return date.toLocaleString('fr-FR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          ticks: {
            callback: function(value) {
              return (typeof value === 'number' ? value : 0).toLocaleString('fr-FR') + ' km'
            }
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      }
    }
  }

  kmChart = new Chart(ctx, config)
}

// Watch kilometrages and update chart
watch(() => props.kilometrages, async () => {
  if (props.kilometrages.length > 0) {
    await nextTick()
    setTimeout(() => {
      updateKmChart()
    }, 100)
  }
}, { immediate: false })

// Expose updateChart method for parent
const updateChart = () => {
  updateKmChart()
}

defineExpose({
  updateChart
})

// Helper functions
const formatNumber = (num: number | undefined) => {
  if (num === undefined) return '0'
  return new Intl.NumberFormat('fr-FR').format(num)
}

const formatDate = (dateString: string | Date | undefined) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>
