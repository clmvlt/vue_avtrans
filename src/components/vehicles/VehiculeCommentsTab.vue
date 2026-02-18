<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold text-foreground">Commentaires</h3>
      <Button size="sm" @click="$emit('add-comment')">
        <Plus class="mr-2 size-4" />
        Ajouter
      </Button>
    </div>

    <div v-if="loading" class="flex flex-col items-center justify-center gap-4 py-8">
      <LoaderCircle class="size-8 animate-spin text-primary" />
      <p class="text-sm text-muted-foreground">Chargement des commentaires...</p>
    </div>

    <div v-else-if="adjustInfos.length === 0" class="flex flex-col items-center justify-center gap-4 py-16 text-muted-foreground">
      <MessageSquare class="size-12 opacity-50" />
      <p>Aucun commentaire enregistré</p>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="info in adjustInfos"
        :key="info.id"
        class="space-y-3 rounded-lg border bg-card p-4"
      >
        <div class="flex items-center justify-between gap-3">
          <div v-if="info.user" class="flex items-center gap-2">
            <div class="size-6 shrink-0 overflow-hidden rounded-full">
              <img
                v-if="info.user.pictureUrl"
                :src="info.user.pictureUrl"
                :alt="info.user.firstName"
                class="size-full object-cover"
              />
              <div v-else class="flex size-full items-center justify-center bg-primary text-white">
                <User class="size-3" />
              </div>
            </div>
            <span class="text-sm font-medium text-foreground">
              {{ info.user.firstName }} {{ info.user.lastName }}
            </span>
          </div>
          <div class="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarDays class="size-3.5" />
            {{ formatDate(info.createdAt) }}
          </div>
        </div>

        <p class="text-sm text-foreground">{{ info.comment }}</p>

        <div v-if="info.id" class="flex justify-end">
          <Button variant="outline" size="sm" @click="$emit('view-pictures', info.id)">
            <Images class="mr-2 size-4" />
            Voir les photos
          </Button>
        </div>
      </div>
    </div>

    <VehiculePagination
      :page="page"
      :total-pages="totalPages"
      @update:page="$emit('update:page', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import type { VehiculeAdjustInfoDTO } from '@/models'
import { Button } from '@/components/ui/button'
import VehiculePagination from './VehiculePagination.vue'
import { LoaderCircle, MessageSquare, User, CalendarDays, Images, Plus } from 'lucide-vue-next'

interface Props {
  adjustInfos: VehiculeAdjustInfoDTO[]
  loading: boolean
  page: number
  totalPages: number
}

defineProps<Props>()

defineEmits<{
  (e: 'add-comment'): void
  (e: 'view-pictures', adjustInfoId: string): void
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
