<template>
  <div class="overflow-hidden rounded-lg border bg-card shadow-sm">
    <!-- Header section -->
    <div class="p-5">
      <!-- Top row: back + created date + actions -->
      <div class="mb-4 flex items-center justify-between">
        <Button variant="ghost" size="sm" class="-ml-2 text-muted-foreground" @click="emit('go-back')">
          <ArrowLeft class="mr-1.5 size-4" />
          Vehicules
        </Button>
        <div class="flex items-center gap-3">
          <span v-if="!isEditing" class="hidden text-xs text-muted-foreground sm:inline">
            Cree le {{ formatDate(vehicule.createdAt) }}
          </span>
          <Button
            v-if="!isEditing"
            variant="default"
            size="sm"
            @click="emit('go-to-entretiens')"
            title="Voir les entretiens"
          >
            Entretiens
          </Button>
          <Button
            v-if="isMecanicien && !isEditing"
            variant="outline"
            size="sm"
            @click="emit('start-editing')"
          >
            <Pencil class="mr-1.5 size-3.5" />
            Modifier
          </Button>
        </div>
      </div>

      <!-- Vehicle identity row -->
      <div class="flex items-center gap-4">
        <!-- Profile picture -->
        <div class="relative flex-shrink-0">
          <!-- Display mode -->
          <template v-if="!isEditing">
            <img
              v-if="vehicule.pictureUrl"
              :src="vehicule.pictureUrl"
              :alt="vehicule.immat"
              class="size-[72px] rounded-lg object-cover"
            />
            <div
              v-else
              class="flex size-[72px] items-center justify-center rounded-lg bg-primary text-white"
            >
              <Truck class="size-8" />
            </div>
          </template>

          <!-- Edit mode -->
          <template v-else>
            <div class="group relative size-[72px]">
              <img
                v-if="editPicturePreview || (vehicule.pictureUrl && !removePictureOnSave)"
                :src="editPicturePreview || vehicule.pictureUrl"
                :alt="vehicule.immat"
                class="size-full rounded-lg object-cover"
              />
              <div
                v-else
                class="flex size-full items-center justify-center rounded-lg bg-primary text-white"
              >
                <Truck class="size-8" />
              </div>

              <!-- Camera overlay on hover -->
              <label
                class="absolute inset-0 flex cursor-pointer items-center justify-center rounded-lg bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
                title="Changer la photo"
              >
                <Camera class="size-6 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  class="hidden"
                  @change="emit('profile-picture-change', $event)"
                />
              </label>

              <!-- Remove button -->
              <Button
                v-if="editPicturePreview || (vehicule.pictureUrl && !removePictureOnSave)"
                variant="destructive"
                size="icon-sm"
                class="absolute -right-2 -top-2"
                @click="emit('remove-profile-picture')"
                title="Supprimer la photo"
              >
                <X class="size-3" />
              </Button>
            </div>
          </template>
        </div>

        <!-- Vehicle info (left) -->
        <div class="flex min-w-0 flex-col justify-center gap-1">
          <h2 v-if="!isEditing" class="text-2xl font-bold uppercase tracking-wide text-foreground">
            {{ vehicule.immat }}
          </h2>
          <Input
            v-else
            :model-value="editFormData.immat"
            @update:model-value="updateEditFormData({ ...editFormData, immat: ($event as string).toUpperCase() })"
            type="text"
            placeholder="Immatriculation"
            class="h-9 font-semibold uppercase tracking-wide"
          />
          <p v-if="!isEditing && vehicule.brand" class="text-sm text-muted-foreground">
            {{ vehicule.brand }} {{ vehicule.model }}
          </p>
        </div>

        <!-- Kilometrage - display mode only -->
        <div v-if="!isEditing" class="relative flex size-[88px] flex-shrink-0 flex-col items-center justify-center gap-1 rounded-lg bg-muted/60">
          <span class="text-[11px] font-medium uppercase leading-none text-muted-foreground">Kilometre</span>
          <span class="text-xl font-bold leading-none text-primary">
            {{ formatNumber(vehicule.latestKm ?? 0) }}
          </span>
          <span class="text-[11px] font-medium uppercase leading-none text-muted-foreground">km</span>
          <Button
            v-if="isMecanicien"
            variant="ghost"
            size="icon-sm"
            class="absolute -right-1.5 -top-1.5 size-6 rounded-full bg-card shadow-sm"
            @click="emit('open-km-modal')"
            title="Ajouter un kilometrage"
          >
            <Pencil class="size-3" />
          </Button>
        </div>
      </div>
    </div>

    <!-- Vehicle details - display mode -->
    <div v-if="!isEditing" class="border-t px-5 py-4 space-y-3">
      <!-- Informations techniques -->
      <div v-if="vehicule.vin || vehicule.numeroCarteGrise || vehicule.dateMiseEnCirculation || vehicule.typeCarburant || vehicule.ptac" class="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
        <div v-if="vehicule.vin" class="rounded-md bg-muted/50 px-3 py-2">
          <div class="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Hash class="size-3.5" />
            <span>VIN</span>
          </div>
          <p class="mt-0.5 text-sm font-medium text-foreground font-mono">{{ vehicule.vin }}</p>
        </div>
        <div v-if="vehicule.numeroCarteGrise" class="rounded-md bg-muted/50 px-3 py-2">
          <div class="flex items-center gap-1.5 text-xs text-muted-foreground">
            <FileText class="size-3.5" />
            <span>Carte grise</span>
          </div>
          <p class="mt-0.5 text-sm font-medium text-foreground">{{ vehicule.numeroCarteGrise }}</p>
        </div>
        <div v-if="vehicule.dateMiseEnCirculation" class="rounded-md bg-muted/50 px-3 py-2">
          <div class="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar class="size-3.5" />
            <span>Mise en circulation</span>
          </div>
          <p class="mt-0.5 text-sm font-medium text-foreground">{{ formatDateShort(vehicule.dateMiseEnCirculation) }}</p>
        </div>
        <div v-if="vehicule.typeCarburant" class="rounded-md bg-muted/50 px-3 py-2">
          <div class="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Fuel class="size-3.5" />
            <span>Carburant</span>
          </div>
          <p class="mt-0.5 text-sm font-medium text-foreground">{{ vehicule.typeCarburant }}</p>
        </div>
        <div v-if="vehicule.ptac" class="rounded-md bg-muted/50 px-3 py-2">
          <div class="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Weight class="size-3.5" />
            <span>PTAC</span>
          </div>
          <p class="mt-0.5 text-sm font-medium text-foreground">{{ formatNumber(vehicule.ptac) }} kg</p>
        </div>
      </div>

      <!-- Assurance & Contrôle technique -->
      <div v-if="vehicule.numeroContratAssurance || vehicule.assureur || vehicule.dateExpirationAssurance || vehicule.dateProchainControleTechnique" class="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
        <div v-if="vehicule.assureur" class="rounded-md bg-muted/50 px-3 py-2">
          <div class="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Shield class="size-3.5" />
            <span>Assureur</span>
          </div>
          <p class="mt-0.5 text-sm font-medium text-foreground">{{ vehicule.assureur }}</p>
        </div>
        <div v-if="vehicule.numeroContratAssurance" class="rounded-md bg-muted/50 px-3 py-2">
          <div class="flex items-center gap-1.5 text-xs text-muted-foreground">
            <FileText class="size-3.5" />
            <span>N° contrat</span>
          </div>
          <p class="mt-0.5 text-sm font-medium text-foreground">{{ vehicule.numeroContratAssurance }}</p>
        </div>
        <div v-if="vehicule.dateExpirationAssurance" class="rounded-md bg-muted/50 px-3 py-2">
          <div class="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarClock class="size-3.5" />
            <span>Expiration assurance</span>
          </div>
          <p class="mt-0.5 text-sm font-medium" :class="isExpiringSoon(vehicule.dateExpirationAssurance) ? 'text-orange-500' : isExpired(vehicule.dateExpirationAssurance) ? 'text-destructive' : 'text-foreground'">
            {{ formatDateShort(vehicule.dateExpirationAssurance) }}
          </p>
        </div>
        <div v-if="vehicule.dateProchainControleTechnique" class="rounded-md bg-muted/50 px-3 py-2">
          <div class="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ClipboardCheck class="size-3.5" />
            <span>Prochain CT</span>
          </div>
          <p class="mt-0.5 text-sm font-medium" :class="isExpiringSoon(vehicule.dateProchainControleTechnique) ? 'text-orange-500' : isExpired(vehicule.dateProchainControleTechnique) ? 'text-destructive' : 'text-foreground'">
            {{ formatDateShort(vehicule.dateProchainControleTechnique) }}
          </p>
        </div>
      </div>

      <!-- Commentaire -->
      <div class="rounded-md bg-muted/50 px-3 py-2">
        <div class="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MessageSquare class="size-3.5" />
          <span>Commentaire</span>
        </div>
        <p class="mt-1 text-sm" :class="vehicule.comment ? 'text-foreground' : 'italic text-muted-foreground'">
          {{ vehicule.comment || 'Aucun commentaire' }}
        </p>
      </div>
    </div>

    <!-- Edit mode body -->
    <div v-if="isEditing" class="border-t p-5">
      <div class="space-y-4">
        <!-- Error message -->
        <div
          v-if="editError"
          class="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive"
        >
          {{ editError }}
        </div>

        <!-- Form -->
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-2">
            <label for="brand" class="text-sm font-medium text-muted-foreground">Marque *</label>
            <Input
              id="brand"
              :model-value="editFormData.brand"
              @update:model-value="updateEditFormData({ ...editFormData, brand: $event as string })"
              type="text"
              placeholder="Marque"
              required
              :disabled="savingEdit"
            />
          </div>
          <div class="space-y-2">
            <label for="model" class="text-sm font-medium text-muted-foreground">Modele *</label>
            <Input
              id="model"
              :model-value="editFormData.model"
              @update:model-value="updateEditFormData({ ...editFormData, model: $event as string })"
              type="text"
              placeholder="Modele"
              required
              :disabled="savingEdit"
            />
          </div>
        </div>

        <div class="space-y-2">
          <label for="comment" class="text-sm font-medium text-muted-foreground">Commentaire</label>
          <textarea
            id="comment"
            :value="editFormData.comment"
            @input="updateEditFormData({ ...editFormData, comment: ($event.target as HTMLTextAreaElement).value })"
            :disabled="savingEdit"
            rows="3"
            placeholder="Informations supplementaires..."
            class="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          ></textarea>
        </div>

        <!-- Separator -->
        <div class="relative">
          <div class="absolute inset-0 flex items-center"><span class="w-full border-t" /></div>
          <div class="relative flex justify-center text-xs uppercase">
            <span class="bg-card px-2 text-muted-foreground">Informations techniques</span>
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-2">
            <label for="vin" class="text-sm font-medium text-muted-foreground">VIN</label>
            <Input
              id="vin"
              :model-value="editFormData.vin"
              @update:model-value="updateEditFormData({ ...editFormData, vin: ($event as string).toUpperCase() })"
              type="text"
              placeholder="WF0XXXGCDX1234567"
              maxlength="17"
              :disabled="savingEdit"
              class="font-mono"
            />
          </div>
          <div class="space-y-2">
            <label for="numeroCarteGrise" class="text-sm font-medium text-muted-foreground">N° carte grise</label>
            <Input
              id="numeroCarteGrise"
              :model-value="editFormData.numeroCarteGrise"
              @update:model-value="updateEditFormData({ ...editFormData, numeroCarteGrise: $event as string })"
              type="text"
              placeholder="2024AB12345"
              :disabled="savingEdit"
            />
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-3">
          <div class="space-y-2">
            <label for="dateMiseEnCirculation" class="text-sm font-medium text-muted-foreground">Mise en circulation</label>
            <Input
              id="dateMiseEnCirculation"
              :model-value="editFormData.dateMiseEnCirculation"
              @update:model-value="updateEditFormData({ ...editFormData, dateMiseEnCirculation: $event as string })"
              type="date"
              :disabled="savingEdit"
            />
          </div>
          <div class="space-y-2">
            <label for="typeCarburant" class="text-sm font-medium text-muted-foreground">Carburant</label>
            <Select
              :model-value="editFormData.typeCarburant || undefined"
              @update:model-value="updateEditFormData({ ...editFormData, typeCarburant: $event as string })"
              :teleport="false"
              :options="carburantOptions"
              placeholder="Sélectionner"
              :disabled="savingEdit"
              :searchable="false"
              clearable
              id="typeCarburant"
            />
          </div>
          <div class="space-y-2">
            <label for="ptac" class="text-sm font-medium text-muted-foreground">PTAC (kg)</label>
            <Input
              id="ptac"
              :model-value="editFormData.ptac ?? undefined"
              @update:model-value="updateEditFormData({ ...editFormData, ptac: $event ? Number($event) : null })"
              type="number"
              inputmode="numeric"
              placeholder="3500"
              min="0"
              :disabled="savingEdit"
            />
          </div>
        </div>

        <!-- Separator -->
        <div class="relative">
          <div class="absolute inset-0 flex items-center"><span class="w-full border-t" /></div>
          <div class="relative flex justify-center text-xs uppercase">
            <span class="bg-card px-2 text-muted-foreground">Assurance & Contrôle technique</span>
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-2">
            <label for="assureur" class="text-sm font-medium text-muted-foreground">Assureur</label>
            <Input
              id="assureur"
              :model-value="editFormData.assureur"
              @update:model-value="updateEditFormData({ ...editFormData, assureur: $event as string })"
              type="text"
              placeholder="AXA"
              :disabled="savingEdit"
            />
          </div>
          <div class="space-y-2">
            <label for="numeroContratAssurance" class="text-sm font-medium text-muted-foreground">N° contrat assurance</label>
            <Input
              id="numeroContratAssurance"
              :model-value="editFormData.numeroContratAssurance"
              @update:model-value="updateEditFormData({ ...editFormData, numeroContratAssurance: $event as string })"
              type="text"
              placeholder="ASS-2025-123456"
              :disabled="savingEdit"
            />
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-2">
            <label for="dateExpirationAssurance" class="text-sm font-medium text-muted-foreground">Expiration assurance</label>
            <Input
              id="dateExpirationAssurance"
              :model-value="editFormData.dateExpirationAssurance"
              @update:model-value="updateEditFormData({ ...editFormData, dateExpirationAssurance: $event as string })"
              type="date"
              :disabled="savingEdit"
            />
          </div>
          <div class="space-y-2">
            <label for="dateProchainControleTechnique" class="text-sm font-medium text-muted-foreground">Prochain contrôle technique</label>
            <Input
              id="dateProchainControleTechnique"
              :model-value="editFormData.dateProchainControleTechnique"
              @update:model-value="updateEditFormData({ ...editFormData, dateProchainControleTechnique: $event as string })"
              type="date"
              :disabled="savingEdit"
            />
          </div>
        </div>

        <!-- Action buttons -->
        <div class="flex justify-end gap-2">
          <Button variant="outline" size="sm" @click="emit('cancel-editing')" :disabled="savingEdit">
            Annuler
          </Button>
          <Button
            variant="default"
            size="sm"
            @click="emit('save-editing')"
            :disabled="!editFormData.immat || !editFormData.brand || !editFormData.model || savingEdit"
          >
            <LoaderCircle v-if="savingEdit" class="mr-1.5 size-3.5 animate-spin" />
            <Check v-else class="mr-1.5 size-3.5" />
            {{ savingEdit ? 'Sauvegarde...' : 'Sauvegarder' }}
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { VehiculeDTO } from '@/models'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import {
  Truck,
  Pencil,
  MessageSquare,
  Camera,
  X,
  Check,
  LoaderCircle,
  ArrowLeft,
  Hash,
  FileText,
  Calendar,
  Fuel,
  Weight,
  Shield,
  CalendarClock,
  ClipboardCheck,
} from 'lucide-vue-next'

const carburantOptions = [
  { value: 'Diesel', label: 'Diesel' },
  { value: 'Essence', label: 'Essence' },
  { value: 'Électrique', label: 'Électrique' },
  { value: 'Hybride', label: 'Hybride' },
  { value: 'GNV', label: 'GNV' },
]

interface Props {
  vehicule: VehiculeDTO
  isEditing: boolean
  isMecanicien: boolean
  savingEdit: boolean
  editError: string
  editFormData: {
    immat: string
    brand: string
    model: string
    comment: string
    pictureBase64: string | null
    vin: string
    numeroCarteGrise: string
    dateMiseEnCirculation: string
    typeCarburant: string
    ptac: number | null
    numeroContratAssurance: string
    assureur: string
    dateExpirationAssurance: string
    dateProchainControleTechnique: string
  }
  editPicturePreview: string | null
  removePictureOnSave: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'go-back'): void
  (e: 'start-editing'): void
  (e: 'cancel-editing'): void
  (e: 'save-editing'): void
  (e: 'go-to-entretiens'): void
  (e: 'open-km-modal'): void
  (e: 'profile-picture-change', event: Event): void
  (e: 'remove-profile-picture'): void
  (e: 'update:editFormData', data: Props['editFormData']): void
}>()

const updateEditFormData = (data: Props['editFormData']) => {
  emit('update:editFormData', data)
}

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
    day: 'numeric'
  })
}

const formatDateShort = (dateString: string | undefined) => {
  if (!dateString) return '-'
  return new Date(dateString + 'T00:00:00').toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const isExpired = (dateString: string | undefined) => {
  if (!dateString) return false
  return new Date(dateString + 'T00:00:00') < new Date()
}

const isExpiringSoon = (dateString: string | undefined) => {
  if (!dateString) return false
  const date = new Date(dateString + 'T00:00:00')
  const now = new Date()
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  return date >= now && date <= thirtyDaysFromNow
}
</script>
