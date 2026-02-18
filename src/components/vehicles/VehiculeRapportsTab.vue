<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold text-foreground">
        Rapports ({{ totalElements }})
      </h3>
      <Button
        v-if="!showAll && totalElements > pageSize"
        variant="outline"
        size="sm"
        @click="$emit('load-all')"
      >
        Voir tout
      </Button>
    </div>

    <div v-if="loading" class="flex flex-col items-center justify-center gap-4 py-8">
      <LoaderCircle class="size-8 animate-spin text-primary" />
      <p class="text-sm text-muted-foreground">Chargement des rapports...</p>
    </div>

    <div v-else-if="rapports.length === 0" class="flex flex-col items-center justify-center gap-4 py-16 text-muted-foreground">
      <ClipboardList class="size-12 opacity-50" />
      <p>Aucun rapport enregistré</p>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="rapport in rapports"
        :key="rapport.id"
        class="space-y-3 rounded-lg border bg-card p-4"
      >
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-1.5 text-sm text-muted-foreground">
            <CalendarDays class="size-4" />
            {{ formatDate(rapport.createdAt) }}
          </div>
          <div v-if="rapport.user" class="flex items-center gap-2">
            <div class="size-6 shrink-0 overflow-hidden rounded-full">
              <img
                v-if="rapport.user.pictureUrl"
                :src="rapport.user.pictureUrl"
                :alt="rapport.user.firstName"
                class="size-full object-cover"
              />
              <div v-else class="flex size-full items-center justify-center bg-primary text-white">
                <User class="size-3" />
              </div>
            </div>
            <span class="text-sm font-medium text-foreground">
              {{ rapport.user.firstName }} {{ rapport.user.lastName }}
            </span>
          </div>
        </div>

        <p class="text-sm text-foreground">{{ rapport.commentaire }}</p>

        <div v-if="rapport.pictures && rapport.pictures.length > 0" class="flex justify-end">
          <Button variant="outline" size="sm" @click="$emit('view-pictures', rapport)">
            <Images class="mr-2 size-4" />
            Voir les photos ({{ rapport.pictures.length }})
          </Button>
        </div>
      </div>
    </div>

    <VehiculePagination
      v-if="!showAll"
      :page="page"
      :total-pages="totalPages"
      @update:page="$emit('update:page', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import type { RapportVehiculeDTO } from '@/models'
import { Button } from '@/components/ui/button'
import VehiculePagination from './VehiculePagination.vue'
import { LoaderCircle, ClipboardList, CalendarDays, User, Images } from 'lucide-vue-next'

interface Props {
  rapports: RapportVehiculeDTO[]
  loading: boolean
  page: number
  totalPages: number
  totalElements: number
  showAll: boolean
  pageSize: number
}

defineProps<Props>()

defineEmits<{
  (e: 'view-pictures', rapport: RapportVehiculeDTO): void
  (e: 'load-all'): void
  (e: 'update:page', page: number): void
}>()

const formatDate = (dateString: string | Date | undefined): string => {
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
