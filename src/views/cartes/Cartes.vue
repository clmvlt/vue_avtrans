<template>
  <div class="min-h-screen bg-background" @click="contextMenu.close">
    <main class="px-4 py-4 md:px-6 md:py-6">
      <div class="mx-auto max-w-[1400px]">

        <!-- Loading -->
        <div v-if="loading" class="flex flex-col items-center justify-center gap-4 py-16">
          <LoaderCircle class="size-10 animate-spin text-primary" />
          <p class="text-lg text-muted-foreground">Chargement des cartes...</p>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="mb-4 rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
          {{ error }}
        </div>

        <!-- Content -->
        <div v-else class="space-y-4">
          <!-- Actions en haut -->
          <div class="flex justify-end gap-3">
            <Button variant="outline" size="sm" @click="goToTypesCartes">
              <Tags class="mr-2 size-4" />
              Types de cartes
            </Button>
            <Button variant="default" size="sm" @click="openCreateModal">
              <Plus class="mr-2 size-4" />
              Nouvelle carte
            </Button>
          </div>

          <!-- Barre de recherche -->
          <div class="relative">
            <Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              v-model="searchQuery"
              type="search"
              placeholder="Rechercher par nom, numéro, type, utilisateur..."
              class="pl-9"
            />
          </div>

          <!-- Mobile Cards View -->
          <div class="space-y-3 md:hidden">
            <p class="text-sm text-muted-foreground">{{ filteredCartes.length }} carte(s)</p>

            <!-- Empty state mobile -->
            <div v-if="filteredCartes.length === 0" class="flex flex-col items-center gap-3 py-12 text-muted-foreground">
              <CreditCard class="size-10 opacity-50" />
              <p>Aucune carte configurée</p>
            </div>

            <!-- Carte Cards -->
            <div
              v-for="item in filteredCartes"
              :key="item.uuid"
              class="rounded-lg border bg-card p-4 shadow-sm"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="flex items-center gap-3">
                  <div class="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <CreditCard class="size-5" />
                  </div>
                  <div class="flex flex-col gap-0.5">
                    <span class="font-medium text-foreground">{{ item.nom }}</span>
                    <span v-if="item.description" class="text-sm text-muted-foreground">{{ item.description }}</span>
                  </div>
                </div>

                <!-- Actions dropdown -->
                <DropdownMenu>
                  <DropdownMenuTrigger as-child>
                    <Button variant="ghost" size="icon-sm">
                      <MoreVertical class="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" class="w-40">
                    <DropdownMenuItem @click="openEditModal(item)">
                      <Pencil class="mr-2 size-4" />
                      Modifier
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem class="text-destructive focus:text-destructive" @click="openDeleteModal(item)">
                      <Trash2 class="mr-2 size-4" />
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <!-- Info rows -->
              <div class="mt-3 space-y-2 text-sm">
                <!-- Numéro -->
                <div class="flex items-center justify-between">
                  <span class="text-muted-foreground">Numéro</span>
                  <div class="flex items-center gap-1">
                    <code class="rounded bg-muted px-2 py-0.5 text-xs font-mono text-foreground">{{ maskCardNumber(item.numero) }}</code>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      @click="toggleShowNumero(item.uuid)"
                    >
                      <Eye v-if="!showNumeros.has(item.uuid ?? '')" class="size-3" />
                      <EyeOff v-else class="size-3" />
                    </Button>
                  </div>
                </div>
                <!-- Code -->
                <div class="flex items-center justify-between">
                  <span class="text-muted-foreground">Code</span>
                  <div class="flex items-center gap-1">
                    <code class="rounded bg-muted px-2 py-0.5 text-xs font-mono text-foreground">{{ maskCode(item.code, item.uuid) }}</code>
                    <Button
                      v-if="item.code"
                      variant="ghost"
                      size="icon-sm"
                      @click="toggleShowCode(item.uuid)"
                    >
                      <Eye v-if="!showCodes.has(item.uuid ?? '')" class="size-3" />
                      <EyeOff v-else class="size-3" />
                    </Button>
                  </div>
                </div>
              </div>

              <!-- Expiration -->
              <div v-if="item.dateExpiration" class="mt-3 space-y-2 text-sm">
                <div class="flex items-center justify-between">
                  <span class="text-muted-foreground">Expiration</span>
                  <div class="flex items-center gap-1.5">
                    <CalendarClock class="size-3.5" :class="getExpirationStatus(item.dateExpiration)?.class" />
                    <Badge v-if="getExpirationStatus(item.dateExpiration)?.badge" :variant="getExpirationStatus(item.dateExpiration)!.badge!">
                      {{ getExpirationStatus(item.dateExpiration)!.label }}
                    </Badge>
                    <span v-else class="text-sm" :class="getExpirationStatus(item.dateExpiration)?.class">
                      {{ formatExpirationDate(item.dateExpiration) }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Badges row -->
              <div class="mt-3 flex flex-wrap items-center gap-2">
                <Badge v-if="item.typeCarte" variant="secondary">
                  {{ item.typeCarte.nom }}
                </Badge>
                <span v-if="item.user" class="text-sm text-foreground">
                  {{ item.user.firstName }} {{ item.user.lastName }}
                </span>
                <span v-else class="text-sm italic text-muted-foreground">Non assignée</span>
              </div>
            </div>
          </div>

          <!-- Desktop Table View -->
          <div class="hidden overflow-hidden rounded-lg border shadow-sm md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cartes ({{ filteredCartes.length }})</TableHead>
                  <TableHead>Numéro</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Expiration</TableHead>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead class="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-if="filteredCartes.length === 0">
                  <TableCell colspan="7" class="text-center text-muted-foreground">
                    Aucune carte configurée
                  </TableCell>
                </TableRow>
                <TableRow v-for="item in filteredCartes" :key="item.uuid" @contextmenu="contextMenu.open($event, item)">
                  <!-- Nom -->
                  <TableCell>
                    <div class="flex items-center gap-3">
                      <div class="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <CreditCard class="size-4" />
                      </div>
                      <div class="flex flex-col gap-0.5">
                        <span class="font-medium text-foreground">{{ item.nom }}</span>
                        <span v-if="item.description" class="text-sm text-muted-foreground">{{ item.description }}</span>
                      </div>
                    </div>
                  </TableCell>

                  <!-- Numéro -->
                  <TableCell>
                    <div class="flex items-center gap-2">
                      <code class="rounded bg-muted px-2 py-1 text-sm font-mono text-foreground">{{ maskCardNumber(item.numero) }}</code>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        @click="toggleShowNumero(item.uuid)"
                        :title="showNumeros.has(item.uuid ?? '') ? 'Masquer' : 'Afficher'"
                      >
                        <Eye v-if="!showNumeros.has(item.uuid ?? '')" class="size-3.5" />
                        <EyeOff v-else class="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>

                  <!-- Code -->
                  <TableCell>
                    <div class="flex items-center gap-2">
                      <code class="rounded bg-muted px-2 py-1 text-sm font-mono text-foreground">{{ maskCode(item.code, item.uuid) }}</code>
                      <Button
                        v-if="item.code"
                        variant="ghost"
                        size="icon-sm"
                        @click="toggleShowCode(item.uuid)"
                        :title="showCodes.has(item.uuid ?? '') ? 'Masquer' : 'Afficher'"
                      >
                        <Eye v-if="!showCodes.has(item.uuid ?? '')" class="size-3.5" />
                        <EyeOff v-else class="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>

                  <!-- Type -->
                  <TableCell>
                    <Badge v-if="item.typeCarte" variant="secondary">
                      {{ item.typeCarte.nom }}
                    </Badge>
                    <span v-else class="text-muted-foreground">-</span>
                  </TableCell>

                  <!-- Expiration -->
                  <TableCell>
                    <template v-if="item.dateExpiration">
                      <div class="flex items-center gap-1.5">
                        <CalendarClock class="size-3.5" :class="getExpirationStatus(item.dateExpiration)?.class" />
                        <Badge v-if="getExpirationStatus(item.dateExpiration)?.badge" :variant="getExpirationStatus(item.dateExpiration)!.badge!">
                          {{ getExpirationStatus(item.dateExpiration)!.label }}
                        </Badge>
                        <span v-else :class="getExpirationStatus(item.dateExpiration)?.class">
                          {{ formatExpirationDate(item.dateExpiration) }}
                        </span>
                      </div>
                    </template>
                    <span v-else class="text-muted-foreground">-</span>
                  </TableCell>

                  <!-- Utilisateur -->
                  <TableCell>
                    <span v-if="item.user" class="font-medium text-foreground">
                      {{ item.user.firstName }} {{ item.user.lastName }}
                    </span>
                    <span v-else class="italic text-muted-foreground">Non assignée</span>
                  </TableCell>

                  <!-- Actions -->
                  <TableCell class="text-right">
                    <div class="flex flex-wrap justify-end gap-1.5">
                      <Button
                        variant="default"
                        size="sm"
                        @click.stop="openEditModal(item)"
                        title="Modifier"
                      >
                        Modifier
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        @click.stop="openDeleteModal(item)"
                        title="Supprimer"
                      >
                        Supprimer
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </main>

    <!-- Modal de création/édition -->
    <CarteEditModal
      v-model="showEditModal"
      :carte-uuid="selectedCarte?.uuid"
      :is-creating="isCreating"
      @saved="handleSaved"
      @close="closeEditModal"
    />

    <!-- Modal de suppression -->
    <Dialog v-model:open="showDeleteModal">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Supprimer la carte</DialogTitle>
          <DialogDescription>Cette action est irréversible.</DialogDescription>
        </DialogHeader>
        <p class="text-sm text-muted-foreground">{{ deleteMessage }}</p>
        <DialogFooter>
          <Button variant="outline" @click="closeDeleteModal">Annuler</Button>
          <Button variant="destructive" @click="handleDelete">Supprimer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Context menu (right-click) -->
    <ContextMenuPopover
      ref="contextMenuRef"
      :show="contextMenu.state.value.show"
      :x="contextMenu.state.value.x"
      :y="contextMenu.state.value.y"
      :title="contextMenu.state.value.entity?.nom"
      @close="contextMenu.close"
    >
      <ContextMenuItem @click="contextMenu.handleAction('toggleNumero', handleContextAction)">
        <template #icon>
          <Eye v-if="!showNumeros.has(contextMenu.state.value.entity?.uuid ?? '')" class="size-4" />
          <EyeOff v-else class="size-4" />
        </template>
        {{ showNumeros.has(contextMenu.state.value.entity?.uuid ?? '') ? 'Masquer le numéro' : 'Afficher le numéro' }}
      </ContextMenuItem>
      <ContextMenuItem v-if="contextMenu.state.value.entity?.code" @click="contextMenu.handleAction('toggleCode', handleContextAction)">
        <template #icon>
          <Eye v-if="!showCodes.has(contextMenu.state.value.entity?.uuid ?? '')" class="size-4" />
          <EyeOff v-else class="size-4" />
        </template>
        {{ showCodes.has(contextMenu.state.value.entity?.uuid ?? '') ? 'Masquer le code' : 'Afficher le code' }}
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem @click="contextMenu.handleAction('edit', handleContextAction)">
        <template #icon><Pencil class="size-4" /></template>
        Modifier
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem destructive @click="contextMenu.handleAction('delete', handleContextAction)">
        <template #icon><Trash2 class="size-4" /></template>
        Supprimer
      </ContextMenuItem>
    </ContextMenuPopover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { cartesService, typeCartesService, usersService } from '@/services'
import { useMessages } from '@/composables/useMessages'
import { useContextMenu } from '@/composables/useContextMenu'
import type { CarteDTO, TypeCarteDTO, UserDTO } from '@/models'
import CarteEditModal from '@/components/cartes/CarteEditModal.vue'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Search, Plus, Tags, CreditCard, Eye, EyeOff, LoaderCircle, MoreVertical, Pencil, Trash2, CalendarClock } from 'lucide-vue-next'

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

// Données
const cartes = ref<CarteDTO[]>([])
const typeCartes = ref<TypeCarteDTO[]>([])
const users = ref<UserDTO[]>([])

// États
const loading = ref(true)
const error = ref('')
const searchQuery = ref('')

// Toggle pour afficher les numéros de carte et codes
const showNumeros = ref(new Set<string>())
const showCodes = ref(new Set<string>())

// Modals
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const selectedCarte = ref<CarteDTO | null>(null)
const isCreating = ref(false)

// Context menu
const contextMenu = useContextMenu<CarteDTO>()
const contextMenuRef = ref<InstanceType<typeof ContextMenuPopover> | null>(null)

watch(() => contextMenuRef.value?.menuElement, (el) => {
  contextMenu.menuRef.value = el ?? null
})

const handleContextAction = (carte: CarteDTO, action: string) => {
  switch (action) {
    case 'toggleNumero':
      toggleShowNumero(carte.uuid)
      break
    case 'toggleCode':
      toggleShowCode(carte.uuid)
      break
    case 'edit':
      openEditModal(carte)
      break
    case 'delete':
      openDeleteModal(carte)
      break
  }
}

// Helper pour le statut d'expiration
const getExpirationStatus = (dateExpiration?: string) => {
  if (!dateExpiration) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expDate = new Date(dateExpiration)
  expDate.setHours(0, 0, 0, 0)
  const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    return { class: 'text-destructive', badge: 'destructive' as const, label: 'Expirée' }
  }
  if (diffDays < 30) {
    return { class: 'text-orange-600', badge: 'warning' as const, label: 'Expire bientôt' }
  }
  const formatted = expDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
  return { class: 'text-muted-foreground', badge: null, label: formatted }
}

const formatExpirationDate = (dateExpiration?: string) => {
  if (!dateExpiration) return '-'
  const date = new Date(dateExpiration)
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

// Filtrage sur tous les champs
const filteredCartes = computed(() => {
  if (!searchQuery.value.trim()) return cartes.value

  const query = searchQuery.value.toLowerCase()
  return cartes.value.filter(carte =>
    carte.nom?.toLowerCase().includes(query) ||
    carte.description?.toLowerCase().includes(query) ||
    carte.numero?.toLowerCase().includes(query) ||
    carte.typeCarte?.nom?.toLowerCase().includes(query) ||
    carte.user?.firstName?.toLowerCase().includes(query) ||
    carte.user?.lastName?.toLowerCase().includes(query) ||
    carte.user?.email?.toLowerCase().includes(query)
  )
})

// Message de suppression
const deleteMessage = computed(() => {
  if (!selectedCarte.value) return ''
  return `Êtes-vous sûr de vouloir supprimer la carte "${selectedCarte.value.nom}" ? Cette action est irréversible.`
})

// Chargement des données
const loadData = async () => {
  try {
    loading.value = true
    error.value = ''

    const [cartesResponse, typesResponse, usersResponse] = await Promise.all([
      cartesService.getCartes(),
      typeCartesService.getTypeCartes(),
      usersService.getUsers()
    ])

    cartes.value = Array.isArray(cartesResponse) ? cartesResponse : []
    typeCartes.value = Array.isArray(typesResponse) ? typesResponse : []

    // L'API peut retourner { data: UserDTO[] } ou directement UserDTO[]
    const usersData = (usersResponse as any).data || usersResponse
    users.value = Array.isArray(usersData) ? usersData : []
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Erreur lors du chargement des cartes'
    messages.error(error.value, 'Erreur')
  } finally {
    loading.value = false
  }
}

// Helpers
const maskCardNumber = (numero?: string): string => {
  if (!numero) return '-'
  const carte = cartes.value.find(c => c.numero === numero)
  if (carte && showNumeros.value.has(carte.uuid || '')) {
    return numero
  }
  // Masquer tous les chiffres sauf les 4 derniers
  if (numero.length <= 4) return numero
  return '**** **** **** ' + numero.slice(-4)
}

const toggleShowNumero = (uuid?: string) => {
  if (!uuid) return
  if (showNumeros.value.has(uuid)) {
    showNumeros.value.delete(uuid)
  } else {
    showNumeros.value.add(uuid)
  }
  // Force reactivity
  showNumeros.value = new Set(showNumeros.value)
}

// Helpers pour le code PIN
const maskCode = (code?: string, uuid?: string): string => {
  if (!code) return '-'
  if (uuid && showCodes.value.has(uuid)) {
    return code
  }
  return '****'
}

const toggleShowCode = (uuid?: string) => {
  if (!uuid) return
  if (showCodes.value.has(uuid)) {
    showCodes.value.delete(uuid)
  } else {
    showCodes.value.add(uuid)
  }
  // Force reactivity
  showCodes.value = new Set(showCodes.value)
}

// Navigation
const goToTypesCartes = () => {
  router.push('/types-cartes')
}

// Modals
const openCreateModal = () => {
  selectedCarte.value = null
  isCreating.value = true
  showEditModal.value = true
}

const openEditModal = (carte: CarteDTO) => {
  selectedCarte.value = carte
  isCreating.value = false
  showEditModal.value = true
}

const closeEditModal = () => {
  showEditModal.value = false
  selectedCarte.value = null
  isCreating.value = false
}

const openDeleteModal = (carte: CarteDTO) => {
  selectedCarte.value = carte
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  selectedCarte.value = null
}

// Actions
const handleSaved = () => {
  closeEditModal()
  loadData()
}

const handleDelete = async () => {
  if (!selectedCarte.value?.uuid) return

  try {
    await cartesService.deleteCarte(selectedCarte.value.uuid)
    messages.success('Carte supprimée avec succès', 'Succès')
    closeDeleteModal()
    loadData()
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression'
    messages.error(errorMessage, 'Erreur')
  }
}

// Lifecycle
onMounted(() => {
  loadData()
})
</script>
