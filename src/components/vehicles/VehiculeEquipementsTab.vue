<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold">Équipements du véhicule</h3>
      <Button v-if="isMecanicien" size="sm" @click="$emit('add')">
        <Plus class="mr-2 size-4" />
        Ajouter
      </Button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex flex-col items-center justify-center gap-4 py-12">
      <LoaderCircle class="size-8 animate-spin text-primary" />
      <p class="text-sm text-muted-foreground">Chargement des équipements...</p>
    </div>

    <!-- Empty -->
    <div v-else-if="equipements.length === 0" class="flex flex-col items-center justify-center gap-4 py-12">
      <div class="flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Wrench class="size-8" />
      </div>
      <div class="text-center">
        <p class="font-medium text-foreground">Aucun équipement</p>
        <p class="text-sm text-muted-foreground">
          {{ isMecanicien ? 'Ajoutez un équipement pour commencer.' : 'Aucun équipement enregistré pour ce véhicule.' }}
        </p>
      </div>
    </div>

    <!-- List -->
    <div v-else class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="equipement in equipements"
        :key="equipement.id"
        class="group rounded-lg border bg-card p-4 transition-colors hover:bg-accent/30"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-start gap-3 min-w-0">
            <div class="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Wrench class="size-5" />
            </div>
            <div class="min-w-0">
              <p class="font-medium leading-tight">{{ equipement.nom }}</p>
              <div class="mt-1 flex items-center gap-2">
                <span class="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  × {{ equipement.quantite ?? 1 }}
                </span>
              </div>
              <p v-if="equipement.commentaire" class="mt-1.5 text-xs text-muted-foreground line-clamp-2">
                {{ equipement.commentaire }}
              </p>
            </div>
          </div>
          <div v-if="isMecanicien" class="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <Button variant="ghost" size="icon-sm" @click="$emit('edit', equipement)">
              <Pencil class="size-3.5" />
            </Button>
            <Button variant="ghost" size="icon-sm" class="text-destructive hover:text-destructive" @click="$emit('delete', equipement)">
              <Trash2 class="size-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { VehiculeEquipementDTO } from '@/models'
import { Button } from '@/components/ui/button'
import { LoaderCircle, Wrench, Plus, Pencil, Trash2 } from 'lucide-vue-next'

defineProps<{
  equipements: VehiculeEquipementDTO[]
  loading: boolean
  isMecanicien: boolean
}>()

defineEmits<{
  add: []
  edit: [equipement: VehiculeEquipementDTO]
  delete: [equipement: VehiculeEquipementDTO]
}>()
</script>
