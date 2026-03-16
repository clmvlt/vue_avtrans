<template>
  <div class="min-h-screen bg-background" @click="contextMenu.close">
    <main class="px-4 py-4 md:px-6 md:py-6">
      <div class="mx-auto max-w-[1400px] space-y-6">

        <!-- Loading -->
        <div v-if="loading" class="flex flex-col items-center justify-center gap-4 py-16">
          <LoaderCircle class="size-10 animate-spin text-primary" />
          <p class="text-lg text-muted-foreground">Chargement des véhicules...</p>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="mb-4 rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
          {{ error }}
        </div>

        <!-- Content -->
        <div v-else class="space-y-4">
          <!-- Search + Add -->
          <div class="flex items-center gap-3">
            <div class="relative flex-1">
              <Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                v-model="searchQuery"
                type="search"
                placeholder="Rechercher par immatriculation, marque ou modèle..."
                class="pl-9"
              />
            </div>
            <Button
              v-if="isMecanicien"
              @click="openCreateModal"
            >
              <Plus class="mr-2 size-4" />
              Ajouter
            </Button>
          </div>

          <!-- Mobile Cards View -->
          <div class="space-y-3 md:hidden">
            <p class="text-sm text-muted-foreground">{{ filteredVehicules.length }} véhicule(s)</p>

            <!-- Empty state mobile -->
            <div v-if="sortedData.length === 0" class="flex flex-col items-center gap-3 py-12 text-muted-foreground">
              <Truck class="size-10 opacity-50" />
              <p>Aucun véhicule trouvé</p>
            </div>

            <!-- Vehicle Cards -->
            <div
              v-for="item in sortedData"
              :key="item.id"
              class="rounded-lg border bg-card p-4 shadow-sm"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="flex cursor-pointer items-center gap-3" @click="goToDetail(item.id)">
                  <div class="size-12 shrink-0 overflow-hidden rounded-md">
                    <img
                      v-if="item.pictureUrl"
                      :src="item.pictureUrl"
                      :alt="item.immat"
                      class="size-full object-cover"
                    />
                    <div v-else class="flex size-full items-center justify-center bg-primary text-white">
                      <Truck class="size-5" />
                    </div>
                  </div>
                  <div class="flex flex-col gap-0.5">
                    <span class="font-semibold uppercase tracking-wide text-foreground">{{ item.immat }}</span>
                    <span class="text-sm text-muted-foreground">{{ item.brand }} {{ item.model }}</span>
                  </div>
                </div>

                <!-- Actions dropdown -->
                <DropdownMenu>
                  <DropdownMenuTrigger as-child>
                    <Button variant="ghost" size="icon-sm">
                      <MoreVertical class="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" class="w-44">
                    <DropdownMenuItem @click="goToDetail(item.id)">
                      <Eye class="mr-2 size-4" />
                      Détails
                    </DropdownMenuItem>
                    <DropdownMenuItem @click="goToEntretiens(item.id)">
                      <Wrench class="mr-2 size-4" />
                      Entretiens
                    </DropdownMenuItem>
                    <template v-if="isMecanicien">
                      <DropdownMenuSeparator />
                      <DropdownMenuItem class="text-destructive focus:text-destructive" @click="confirmDelete(item)">
                        <Trash2 class="mr-2 size-4" />
                        Supprimer
                      </DropdownMenuItem>
                    </template>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <!-- Info row -->
              <div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                <span v-if="item.latestKm" class="font-medium text-foreground">
                  {{ formatNumber(item.latestKm) }} km
                </span>
                <span v-if="item.latestKmDate" class="text-muted-foreground">
                  {{ formatDate(item.latestKmDate) }}
                </span>
              </div>
              <p v-if="item.comment" class="mt-2 text-sm italic text-muted-foreground line-clamp-2">
                {{ item.comment }}
              </p>
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
                      col.align === 'right' && 'text-right',
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
                <TableRow v-for="item in sortedData" :key="item.id" @contextmenu="contextMenu.open($event, item)">
                  <!-- Véhicule -->
                  <TableCell>
                    <div class="flex cursor-pointer items-center gap-3" @click="goToDetail(item.id)">
                      <div class="size-11 shrink-0 overflow-hidden rounded-md">
                        <img
                          v-if="item.pictureUrl"
                          :src="item.pictureUrl"
                          :alt="item.immat"
                          class="size-full object-cover"
                        />
                        <div v-else class="flex size-full items-center justify-center bg-primary text-white">
                          <Truck class="size-5" />
                        </div>
                      </div>
                      <div class="flex flex-col gap-0.5">
                        <span class="font-semibold uppercase tracking-wide text-foreground">{{ item.immat }}</span>
                        <span class="text-sm text-muted-foreground">{{ item.brand }} {{ item.model }}</span>
                      </div>
                    </div>
                  </TableCell>

                  <!-- Kilométrage -->
                  <TableCell>
                    <span v-if="item.latestKm" class="font-medium text-foreground">
                      {{ formatNumber(item.latestKm) }} km
                    </span>
                    <span v-else class="text-muted-foreground">-</span>
                  </TableCell>

                  <!-- Date relevé -->
                  <TableCell>
                    <span v-if="item.latestKmDate">{{ formatDate(item.latestKmDate) }}</span>
                    <span v-else class="text-muted-foreground">-</span>
                  </TableCell>

                  <!-- Commentaire -->
                  <TableCell>
                    <span v-if="item.comment" class="inline-block max-w-[200px] truncate text-sm italic text-muted-foreground" :title="item.comment">
                      {{ item.comment }}
                    </span>
                    <span v-else class="text-muted-foreground">-</span>
                  </TableCell>

                  <!-- Actions -->
                  <TableCell class="text-right">
                    <div class="flex flex-wrap justify-end gap-1.5">
                      <Button variant="outline" size="sm" @click="goToDetail(item.id)" title="Voir les détails">
                        Détails
                      </Button>
                      <Button variant="outline" size="sm" @click="goToEntretiens(item.id)" title="Voir les entretiens">
                        Entretiens
                      </Button>
                      <Button
                        v-if="isMecanicien"
                        variant="destructive"
                        size="sm"
                        @click="confirmDelete(item)"
                        title="Supprimer le véhicule"
                      >
                        Supprimer
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>

                <!-- Empty state -->
                <TableRow v-if="sortedData.length === 0">
                  <TableCell :col-span="tableColumns.length" class="py-12 text-center">
                    <div class="flex flex-col items-center gap-3 text-muted-foreground">
                      <Truck class="size-10 opacity-50" />
                      <p>Aucun véhicule trouvé</p>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </main>

    <!-- Dialog de création -->
    <Dialog v-model:open="showFormModal">
      <DialogContent class="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle class="flex items-center gap-2">
            <div class="flex size-10 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Plus class="size-5" />
            </div>
            Nouveau véhicule
          </DialogTitle>
          <DialogDescription class="sr-only">Formulaire de création d'un véhicule</DialogDescription>
        </DialogHeader>

        <form @submit.prevent="handleFormSubmit" class="space-y-4">
          <div v-if="formError" class="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
            {{ formError }}
          </div>

          <div v-if="formSuccess" class="rounded-lg border border-green-500/50 bg-green-500/10 p-3 text-sm text-green-600 dark:text-green-400">
            {{ formSuccess }}
          </div>

          <div class="space-y-2">
            <label for="immat" class="text-sm font-medium text-muted-foreground">Immatriculation *</label>
            <Input
              id="immat"
              :model-value="formData.immat"
              @update:model-value="formData.immat = ($event as string).toUpperCase()"
              required
              :disabled="saving"
              placeholder="AB-123-CD"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label for="brand" class="text-sm font-medium text-muted-foreground">Marque *</label>
              <Input
                id="brand"
                v-model="formData.brand"
                required
                :disabled="saving"
                placeholder="Ford"
              />
            </div>
            <div class="space-y-2">
              <label for="model" class="text-sm font-medium text-muted-foreground">Modèle *</label>
              <Input
                id="model"
                v-model="formData.model"
                required
                :disabled="saving"
                placeholder="Transit"
              />
            </div>
          </div>

          <div class="space-y-2">
            <label for="comment" class="text-sm font-medium text-muted-foreground">Commentaire</label>
            <textarea
              id="comment"
              v-model="formData.comment"
              :disabled="saving"
              rows="3"
              placeholder="Informations supplémentaires sur le véhicule..."
              class="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            ></textarea>
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium text-muted-foreground">Photo du véhicule</label>
            <div class="flex justify-center">
              <div v-if="formPicturePreview" class="relative h-[120px] w-[150px]">
                <img :src="formPicturePreview" alt="Prévisualisation" class="size-full rounded-md border object-cover" />
                <button
                  type="button"
                  class="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-destructive text-white transition-transform hover:scale-110 disabled:cursor-not-allowed disabled:opacity-50"
                  @click="clearFormPicture"
                  :disabled="saving"
                >
                  <X class="size-3" />
                </button>
              </div>
              <label v-else class="flex h-[120px] w-[150px] cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed bg-muted text-muted-foreground transition-colors hover:border-primary hover:text-primary" :class="{ 'cursor-not-allowed opacity-50': saving }">
                <input
                  type="file"
                  accept="image/*"
                  @change="handleFormPictureSelect"
                  :disabled="saving"
                  class="hidden"
                />
                <Camera class="size-7" />
                <span class="text-sm">Ajouter une photo</span>
              </label>
            </div>
          </div>

          <!-- Separator: Informations techniques -->
          <div class="relative">
            <div class="absolute inset-0 flex items-center"><span class="w-full border-t" /></div>
            <div class="relative flex justify-center text-xs uppercase">
              <span class="bg-background px-2 text-muted-foreground">Informations techniques</span>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label for="create-vin" class="text-sm font-medium text-muted-foreground">VIN</label>
              <Input
                id="create-vin"
                :model-value="formData.vin"
                @update:model-value="formData.vin = ($event as string).toUpperCase()"
                :disabled="saving"
                placeholder="WF0XXXGCDX1234567"
                maxlength="17"
                class="font-mono"
              />
            </div>
            <div class="space-y-2">
              <label for="create-carte-grise" class="text-sm font-medium text-muted-foreground">N° carte grise</label>
              <Input
                id="create-carte-grise"
                v-model="formData.numeroCarteGrise"
                :disabled="saving"
                placeholder="2024AB12345"
              />
            </div>
          </div>

          <div class="grid grid-cols-3 gap-4">
            <div class="space-y-2">
              <label for="create-date-circ" class="text-sm font-medium text-muted-foreground">Mise en circulation</label>
              <Input
                id="create-date-circ"
                v-model="formData.dateMiseEnCirculation"
                type="date"
                :disabled="saving"
              />
            </div>
            <div class="space-y-2">
              <label for="create-carburant" class="text-sm font-medium text-muted-foreground">Carburant</label>
              <Select
                v-model="formData.typeCarburant"
                :teleport="false"
                :options="carburantOptions"
                placeholder="Sélectionner"
                :disabled="saving"
                :searchable="false"
                clearable
                id="create-carburant"
              />
            </div>
            <div class="space-y-2">
              <label for="create-ptac" class="text-sm font-medium text-muted-foreground">PTAC (kg)</label>
              <Input
                id="create-ptac"
                :model-value="formData.ptac ?? undefined"
                @update:model-value="formData.ptac = $event ? Number($event) : null"
                type="number"
                inputmode="numeric"
                :disabled="saving"
                placeholder="3500"
                min="0"
              />
            </div>
          </div>

          <!-- Separator: Assurance & CT -->
          <div class="relative">
            <div class="absolute inset-0 flex items-center"><span class="w-full border-t" /></div>
            <div class="relative flex justify-center text-xs uppercase">
              <span class="bg-background px-2 text-muted-foreground">Assurance & Contrôle technique</span>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label for="create-assureur" class="text-sm font-medium text-muted-foreground">Assureur</label>
              <Input
                id="create-assureur"
                v-model="formData.assureur"
                :disabled="saving"
                placeholder="AXA"
              />
            </div>
            <div class="space-y-2">
              <label for="create-contrat" class="text-sm font-medium text-muted-foreground">N° contrat assurance</label>
              <Input
                id="create-contrat"
                v-model="formData.numeroContratAssurance"
                :disabled="saving"
                placeholder="ASS-2025-123456"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label for="create-exp-assurance" class="text-sm font-medium text-muted-foreground">Expiration assurance</label>
              <Input
                id="create-exp-assurance"
                v-model="formData.dateExpirationAssurance"
                type="date"
                :disabled="saving"
              />
            </div>
            <div class="space-y-2">
              <label for="create-ct" class="text-sm font-medium text-muted-foreground">Prochain contrôle technique</label>
              <Input
                id="create-ct"
                v-model="formData.dateProchainControleTechnique"
                type="date"
                :disabled="saving"
              />
            </div>
          </div>
        </form>

        <DialogFooter class="gap-2 sm:gap-0">
          <Button variant="outline" @click="closeFormModal">
            Annuler
          </Button>
          <Button
            :disabled="!formData.immat || !formData.brand || !formData.model || saving"
            @click="handleFormSubmit"
          >
            <LoaderCircle v-if="saving" class="mr-1.5 size-4 animate-spin" />
            {{ saving ? 'Enregistrement...' : 'Enregistrer' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Dialog de suppression -->
    <Dialog v-model:open="showDeleteModal">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle class="flex items-center gap-2">
            <div class="flex size-10 items-center justify-center rounded-full bg-destructive/15 text-destructive">
              <Trash2 class="size-5" />
            </div>
            Supprimer le véhicule
          </DialogTitle>
          <DialogDescription class="sr-only">Confirmer la suppression du véhicule</DialogDescription>
        </DialogHeader>

        <div class="space-y-4">
          <p class="text-center text-foreground">Êtes-vous sûr de vouloir supprimer ce véhicule ?</p>

          <div class="rounded-lg bg-muted p-4 text-center">
            <p class="text-xl font-bold uppercase tracking-wider text-primary">{{ vehiculeToDelete?.immat }}</p>
            <p class="mt-1 text-sm text-muted-foreground">{{ vehiculeToDelete?.brand }} {{ vehiculeToDelete?.model }}</p>
          </div>

          <div class="rounded-lg border border-destructive bg-destructive/10 p-4 text-left">
            <p class="mb-2 flex items-center gap-2 font-semibold text-destructive">
              <AlertTriangle class="size-4" />
              Attention : Cette action est irréversible !
            </p>
            <p class="mb-3 text-sm text-muted-foreground">La suppression de ce véhicule entraînera également la suppression de :</p>
            <ul class="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              <li>Toutes ses photos</li>
              <li>Tous ses historiques de kilométrage</li>
              <li>Toutes ses informations d'ajustement</li>
            </ul>
          </div>

          <div class="text-left">
            <label for="confirmInput" class="mb-2 block text-sm text-muted-foreground">
              Pour confirmer, tapez <strong class="text-foreground">CONFIRMER</strong> ci-dessous :
            </label>
            <Input
              id="confirmInput"
              v-model="confirmText"
              type="text"
              placeholder="Tapez CONFIRMER"
              autocomplete="off"
              class="text-center font-medium tracking-widest"
              @keyup.enter="confirmText === 'CONFIRMER' && deleteVehicule()"
            />
          </div>
        </div>

        <DialogFooter class="gap-2 sm:gap-0">
          <Button variant="outline" @click="cancelDelete">
            Annuler
          </Button>
          <Button
            variant="destructive"
            :disabled="confirmText !== 'CONFIRMER' || deleting"
            @click="deleteVehicule"
          >
            <LoaderCircle v-if="deleting" class="mr-1.5 size-4 animate-spin" />
            {{ deleting ? 'Suppression...' : 'Supprimer définitivement' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Context menu (right-click) -->
    <ContextMenuPopover
      ref="contextMenuRef"
      :show="contextMenu.state.value.show"
      :x="contextMenu.state.value.x"
      :y="contextMenu.state.value.y"
      :title="contextMenu.state.value.entity?.immat"
      @close="contextMenu.close"
    >
      <ContextMenuItem @click="contextMenu.handleAction('details', handleContextAction)">
        <template #icon><Eye class="size-4" /></template>
        Détails
      </ContextMenuItem>
      <ContextMenuItem @click="contextMenu.handleAction('entretiens', handleContextAction)">
        <template #icon><Wrench class="size-4" /></template>
        Entretiens
      </ContextMenuItem>
      <template v-if="isMecanicien">
        <ContextMenuSeparator />
        <ContextMenuItem destructive @click="contextMenu.handleAction('delete', handleContextAction)">
          <template #icon><Trash2 class="size-4" /></template>
          Supprimer
        </ContextMenuItem>
      </template>
    </ContextMenuPopover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { vehiclesService } from '@/services'
import type { VehiculeDTO } from '@/models'
import { useMessages } from '@/composables/useMessages'
import { useContextMenu } from '@/composables/useContextMenu'

// shadcn components
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Select } from '@/components/ui/select'

// Lucide icons
import {
  Search,
  LoaderCircle,
  Plus,
  Truck,
  Trash2,
  AlertTriangle,
  Camera,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreVertical,
  Eye,
  Wrench,
} from 'lucide-vue-next'

// DropdownMenu for mobile actions
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// Context menu for desktop right-click
import {
  ContextMenuPopover,
  ContextMenuItem,
  ContextMenuSeparator,
} from '@/components/ui/context-menu-popover'

const router = useRouter()
const messages = useMessages()
const authStore = useAuthStore()

// Table column definition
interface TableColumnDef {
  key: string
  label: string
  sortable?: boolean
  align?: 'left' | 'center' | 'right'
}

// Données
const vehicules = ref<VehiculeDTO[]>([])
const loading = ref(true)
const error = ref('')
const searchQuery = ref('')

// Vérifier si l'utilisateur est mécanicien ou admin
const isMecanicien = computed(() => {
  const roleUuid = authStore.userRoleUuid
  return roleUuid === 'c10523af-a4ab-47e2-8025-5ef4e241ef08' || // Admin
         roleUuid === 'ccbd448a-0eef-4277-b53b-91be340b080f'    // Mécanicien
})

// Context menu
const contextMenu = useContextMenu<VehiculeDTO>()
const contextMenuRef = ref<InstanceType<typeof ContextMenuPopover> | null>(null)

watch(() => contextMenuRef.value?.menuElement, (el) => {
  contextMenu.menuRef.value = el ?? null
})

const handleContextAction = (vehicule: VehiculeDTO, action: string) => {
  switch (action) {
    case 'details':
      goToDetail(vehicule.id)
      break
    case 'entretiens':
      goToEntretiens(vehicule.id)
      break
    case 'delete':
      confirmDelete(vehicule)
      break
  }
}

// Véhicules filtrés
const filteredVehicules = computed(() => {
  if (!searchQuery.value.trim()) {
    return vehicules.value
  }

  const query = searchQuery.value.toLowerCase().trim()
  return vehicules.value.filter(vehicule => {
    return (vehicule.immat?.toLowerCase().includes(query) ?? false) ||
           (vehicule.brand?.toLowerCase().includes(query) ?? false) ||
           (vehicule.model?.toLowerCase().includes(query) ?? false)
  })
})

// Sort state
const sortKey = ref<string | null>(null)
const sortDirection = ref<'asc' | 'desc'>('asc')

// Colonnes du tableau
const tableColumns = computed<TableColumnDef[]>(() => [
  { key: 'immat', label: `Véhicules (${filteredVehicules.value.length})`, sortable: true },
  { key: 'latestKm', label: 'Kilométrage', sortable: true },
  { key: 'latestKmDate', label: 'Date du relevé', sortable: true },
  { key: 'comment', label: 'Commentaire' },
  { key: 'actions', label: 'Actions', align: 'right' }
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
  if (!sortKey.value) return filteredVehicules.value

  return [...filteredVehicules.value].sort((a, b) => {
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

// Modal de formulaire (création)
const showFormModal = ref(false)
const saving = ref(false)
const formError = ref('')
const formSuccess = ref('')
const formData = ref({
  immat: '',
  brand: '',
  model: '',
  comment: '',
  pictureBase64: '',
  vin: '',
  numeroCarteGrise: '',
  dateMiseEnCirculation: '',
  typeCarburant: '',
  ptac: null as number | null,
  numeroContratAssurance: '',
  assureur: '',
  dateExpirationAssurance: '',
  dateProchainControleTechnique: '',
})

const carburantOptions = [
  { value: 'Diesel', label: 'Diesel' },
  { value: 'Essence', label: 'Essence' },
  { value: 'Électrique', label: 'Électrique' },
  { value: 'Hybride', label: 'Hybride' },
  { value: 'GNV', label: 'GNV' },
]
const formPicturePreview = ref<string | null>(null)

// Modal de suppression
const showDeleteModal = ref(false)
const vehiculeToDelete = ref<VehiculeDTO | null>(null)
const deleting = ref(false)
const confirmText = ref('')

const loadVehicules = async () => {
  try {
    loading.value = true
    error.value = ''
    const response = await vehiclesService.getVehicles()
    vehicules.value = response.vehicules || []
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Erreur lors du chargement des véhicules'
  } finally {
    loading.value = false
  }
}

const goToDetail = (id: string | undefined) => {
  if (id) router.push(`/vehicules/${id}`)
}

const goToEntretiens = (id: string | undefined) => {
  if (id) router.push(`/entretiens/vehicule/${id}`)
}

const formatNumber = (num: number) => {
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

// Gestion du formulaire
const openCreateModal = () => {
  formData.value = {
    immat: '',
    brand: '',
    model: '',
    comment: '',
    pictureBase64: '',
    vin: '',
    numeroCarteGrise: '',
    dateMiseEnCirculation: '',
    typeCarburant: '',
    ptac: null,
    numeroContratAssurance: '',
    assureur: '',
    dateExpirationAssurance: '',
    dateProchainControleTechnique: '',
  }
  formPicturePreview.value = null
  formError.value = ''
  formSuccess.value = ''
  showFormModal.value = true
}

const closeFormModal = () => {
  showFormModal.value = false
  formPicturePreview.value = null
  formError.value = ''
  formSuccess.value = ''
}

const handleFormPictureSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    formError.value = 'Veuillez sélectionner une image valide'
    return
  }

  if (file.size > 10 * 1024 * 1024) {
    formError.value = 'L\'image est trop volumineuse (max 10MB)'
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    const result = e.target?.result as string
    formPicturePreview.value = result
    formData.value.pictureBase64 = result
  }
  reader.readAsDataURL(file)
}

const clearFormPicture = () => {
  formPicturePreview.value = null
  formData.value.pictureBase64 = ''
}

const handleFormSubmit = async () => {
  formError.value = ''
  formSuccess.value = ''

  try {
    saving.value = true

    const createData = {
      ...formData.value,
      vin: formData.value.vin || undefined,
      numeroCarteGrise: formData.value.numeroCarteGrise || undefined,
      dateMiseEnCirculation: formData.value.dateMiseEnCirculation || undefined,
      typeCarburant: formData.value.typeCarburant || undefined,
      ptac: formData.value.ptac ?? undefined,
      numeroContratAssurance: formData.value.numeroContratAssurance || undefined,
      assureur: formData.value.assureur || undefined,
      dateExpirationAssurance: formData.value.dateExpirationAssurance || undefined,
      dateProchainControleTechnique: formData.value.dateProchainControleTechnique || undefined,
      pictureBase64: formData.value.pictureBase64 || undefined,
    }
    const response = await vehiclesService.createVehicle(createData)
    if (response.vehicule) {
      vehicules.value.push(response.vehicule)
    }

    closeFormModal()
    messages.success('Véhicule créé avec succès !', 'Succès')
  } catch (err: unknown) {
    formError.value = err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement'
  } finally {
    saving.value = false
  }
}

// Gestion de la suppression
const confirmDelete = (vehicule: VehiculeDTO) => {
  vehiculeToDelete.value = vehicule
  confirmText.value = ''
  showDeleteModal.value = true
}

const cancelDelete = () => {
  showDeleteModal.value = false
  vehiculeToDelete.value = null
  confirmText.value = ''
}

const deleteVehicule = async () => {
  if (!vehiculeToDelete.value || confirmText.value !== 'CONFIRMER') return

  try {
    deleting.value = true
    await vehiclesService.deleteVehicle(vehiculeToDelete.value.id!)
    vehicules.value = vehicules.value.filter(v => v.id !== vehiculeToDelete.value?.id)
    showDeleteModal.value = false
    vehiculeToDelete.value = null
    confirmText.value = ''
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Erreur lors de la suppression'
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  loadVehicules()
})
</script>
