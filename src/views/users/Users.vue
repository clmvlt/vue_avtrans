<template>
  <div class="min-h-screen bg-background" @click="contextMenu.close">
    <main class="px-4 py-4 md:px-6 md:py-6">
      <div class="mx-auto max-w-[1400px]">

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
        <div v-else class="space-y-4">
          <!-- Search bar -->
          <div class="relative">
            <Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              v-model="searchQuery"
              type="search"
              placeholder="Rechercher par nom ou email..."
              class="pl-9"
            />
          </div>

          <!-- Mobile Cards View -->
          <div class="space-y-3 md:hidden">
            <p class="text-sm text-muted-foreground">{{ filteredUsers.length }} utilisateur(s)</p>

            <!-- Empty state mobile -->
            <div v-if="sortedData.length === 0" class="flex flex-col items-center gap-3 py-12 text-muted-foreground">
              <Users2 class="size-10 opacity-50" />
              <p>Aucun utilisateur trouvé</p>
            </div>

            <!-- User Cards -->
            <div
              v-for="item in sortedData"
              :key="item.uuid"
              class="rounded-lg border bg-card p-4 shadow-sm"
            >
              <!-- Header: Avatar + Name + Actions menu -->
              <div class="flex items-start justify-between gap-3">
                <div class="flex items-center gap-3">
                  <div class="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
                    <img
                      v-if="item.pictureUrl"
                      :src="item.pictureUrl"
                      :alt="`Photo de ${item.firstName}`"
                      class="size-full object-cover"
                    />
                    <span v-else class="flex size-full items-center justify-center bg-primary text-sm font-semibold text-primary-foreground">
                      {{ getInitials(item.firstName, item.lastName) }}
                    </span>
                  </div>
                  <div class="flex flex-col">
                    <span class="font-medium text-foreground">{{ item.firstName }} {{ item.lastName }}</span>
                    <span class="text-sm text-muted-foreground">{{ item.email }}</span>
                  </div>
                </div>

                <!-- Actions dropdown -->
                <DropdownMenu>
                  <DropdownMenuTrigger as-child>
                    <Button variant="ghost" size="icon-sm">
                      <MoreVertical class="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" class="w-48">
                    <DropdownMenuItem @click="$router.push(`/users/${item.uuid}/services`)">
                      <ClipboardList class="mr-2 size-4" />
                      Services
                    </DropdownMenuItem>
                    <DropdownMenuItem @click="openHoursModal(item)">
                      <Clock class="mr-2 size-4" />
                      Heures
                    </DropdownMenuItem>
                    <DropdownMenuItem @click="goToUserAbsences(item)">
                      <CalendarOff class="mr-2 size-4" />
                      Absences
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem @click="openEmailModal(item)">
                      <Mail class="mr-2 size-4" />
                      Modifier l'email
                    </DropdownMenuItem>
                    <DropdownMenuItem @click="openEditModal(item)">
                      <Pencil class="mr-2 size-4" />
                      Modifier
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem class="text-destructive focus:text-destructive" @click="confirmDelete(item)">
                      <Trash2 class="mr-2 size-4" />
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <!-- Badges row -->
              <div class="mt-3 flex flex-wrap items-center gap-2">
                <!-- Role -->
                <span
                  v-if="item.role"
                  class="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                  :style="{ backgroundColor: item.role.color }"
                >
                  {{ item.role.nom }}
                </span>

                <!-- Presence -->
                <Badge
                  :variant="getPresenceBadgeVariant(item.status)"
                  :class="getPresenceBadgeClass(item.status)"
                >
                  {{ getPresenceLabel(item.status) }}
                </Badge>

                <!-- Account status -->
                <Badge
                  :variant="item.isActive ? 'outline' : 'destructive'"
                  :class="item.isActive ? 'border-green-500/50 text-green-600 dark:text-green-400' : ''"
                >
                  {{ item.isActive ? 'Actif' : 'Inactif' }}
                </Badge>

                <!-- Email verification -->
                <Badge :variant="item.isMailVerified ? 'default' : 'destructive'" class="gap-1">
                  <CircleCheck v-if="item.isMailVerified" class="size-3" />
                  <CircleX v-else class="size-3" />
                  {{ item.isMailVerified ? 'Vérifié' : 'Non' }}
                </Badge>
              </div>

              <!-- Last vehicle -->
              <div v-if="getLastVehicle(item.uuid)" class="mt-3 flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2">
                <Car class="size-4 shrink-0 text-muted-foreground" />
                <span class="text-sm font-medium">{{ getLastVehicle(item.uuid)!.vehiculeImmat }}</span>
                <span class="text-xs text-muted-foreground">· {{ formatVehicleDate(getLastVehicle(item.uuid)!.date) }}</span>
                <Button variant="ghost" size="icon" class="ml-auto size-7" @click.stop="$router.push(`/vehicules/${getLastVehicle(item.uuid)!.vehiculeId}`)" title="Voir le véhicule">
                  <ExternalLink class="size-3.5" />
                </Button>
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
                <TableRow v-for="item in sortedData" :key="item.uuid" @contextmenu="contextMenu.open($event, item)">
                  <!-- User -->
                  <TableCell>
                    <div class="flex items-center gap-3">
                      <div class="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
                        <img
                          v-if="item.pictureUrl"
                          :src="item.pictureUrl"
                          :alt="`Photo de ${item.firstName}`"
                          class="size-full object-cover"
                        />
                        <span v-else class="flex size-full items-center justify-center bg-primary text-sm font-semibold text-primary-foreground">
                          {{ getInitials(item.firstName, item.lastName) }}
                        </span>
                      </div>
                      <div class="flex flex-col">
                        <span class="font-medium text-foreground">{{ item.firstName }} {{ item.lastName }}</span>
                        <span class="text-sm text-muted-foreground">{{ item.email }}</span>
                      </div>
                    </div>
                  </TableCell>

                  <!-- Email verification -->
                  <TableCell>
                    <div class="flex items-center gap-2">
                      <Badge :variant="item.isMailVerified ? 'default' : 'destructive'" class="gap-1">
                        <CircleCheck v-if="item.isMailVerified" class="size-3" />
                        <CircleX v-else class="size-3" />
                        {{ item.isMailVerified ? 'Vérifié' : 'Non vérifié' }}
                      </Badge>
                      <Button variant="ghost" size="icon-sm" @click="openEmailModal(item)" title="Modifier l'email">
                        <Pencil class="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>

                  <!-- Role -->
                  <TableCell>
                    <span
                      v-if="item.role"
                      class="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                      :style="{ backgroundColor: item.role.color }"
                    >
                      {{ item.role.nom }}
                    </span>
                    <span v-else class="text-xs italic text-muted-foreground">Aucun rôle</span>
                  </TableCell>

                  <!-- Presence -->
                  <TableCell>
                    <Badge
                      :variant="getPresenceBadgeVariant(item.status)"
                      :class="getPresenceBadgeClass(item.status)"
                    >
                      {{ getPresenceLabel(item.status) }}
                    </Badge>
                  </TableCell>

                  <!-- Account status -->
                  <TableCell>
                    <Badge :variant="item.isActive ? 'outline' : 'destructive'" :class="item.isActive ? 'border-green-500/50 text-green-600 dark:text-green-400' : ''">
                      {{ item.isActive ? 'Actif' : 'Inactif' }}
                    </Badge>
                  </TableCell>

                  <!-- Last vehicle -->
                  <TableCell>
                    <template v-if="getLastVehicle(item.uuid)">
                      <div class="flex items-center gap-2">
                        <Car class="size-4 shrink-0 text-muted-foreground" />
                        <div class="flex flex-col">
                          <span class="text-sm font-medium">{{ getLastVehicle(item.uuid)!.vehiculeImmat }}</span>
                          <span class="text-xs text-muted-foreground">{{ formatVehicleDate(getLastVehicle(item.uuid)!.date) }}</span>
                        </div>
                        <Button variant="ghost" size="icon" class="ml-auto size-7" @click.stop="$router.push(`/vehicules/${getLastVehicle(item.uuid)!.vehiculeId}`)" title="Voir le véhicule">
                          <ExternalLink class="size-3.5" />
                        </Button>
                      </div>
                    </template>
                    <span v-else class="text-xs italic text-muted-foreground">—</span>
                  </TableCell>

                  <!-- Actions -->
                  <TableCell class="text-right">
                    <div class="flex flex-wrap justify-end gap-1.5">
                      <Button variant="outline" size="sm" @click="$router.push(`/users/${item.uuid}/services`)" title="Voir les services">
                        Services
                      </Button>
                      <Button variant="outline" size="sm" @click="openHoursModal(item)" title="Détails des heures">
                        Heures
                      </Button>
                      <Button variant="outline" size="sm" @click="goToUserAbsences(item)" title="Voir les absences">
                        Absences
                      </Button>
                      <Button variant="default" size="sm" @click="openEditModal(item)" title="Modifier l'utilisateur">
                        Modifier
                      </Button>
                      <Button variant="destructive" size="sm" @click="confirmDelete(item)" title="Supprimer l'utilisateur">
                        Supprimer
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>

                <!-- Empty state -->
                <TableRow v-if="sortedData.length === 0">
                  <TableCell :col-span="tableColumns.length" class="py-12 text-center">
                    <div class="flex flex-col items-center gap-3 text-muted-foreground">
                      <Users2 class="size-10 opacity-50" />
                      <p>Aucun utilisateur trouvé</p>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </main>

    <!-- Delete confirmation dialog -->
    <Dialog v-model:open="showDeleteModal">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle class="flex items-center gap-2">
            <div class="flex size-10 items-center justify-center rounded-full bg-destructive/15 text-destructive">
              <Trash2 class="size-5" />
            </div>
            Suppression de l'utilisateur
          </DialogTitle>
          <DialogDescription class="sr-only">
            Confirmer la suppression de l'utilisateur
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4">
          <p class="text-center text-lg font-semibold text-foreground">
            {{ userToDelete?.firstName }} {{ userToDelete?.lastName }}
          </p>

          <div class="rounded-lg border border-destructive bg-destructive/10 p-4 text-left">
            <p class="mb-2 font-semibold text-destructive">Attention : Cette action est irréversible !</p>
            <p class="mb-3 text-sm text-muted-foreground">La suppression de cet utilisateur entraînera également la suppression de :</p>
            <ul class="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              <li>Tous ses pointages</li>
              <li>Tous ses historiques de services</li>
              <li>Toutes ses données personnelles</li>
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
              @keyup.enter="confirmText === 'CONFIRMER' && deleteUser()"
            />
          </div>
        </div>

        <DialogFooter class="gap-2 sm:gap-0">
          <Button variant="outline" @click="cancelDelete">
            Annuler
          </Button>
          <Button
            variant="destructive"
            :disabled="confirmText !== 'CONFIRMER'"
            @click="deleteUser"
          >
            Supprimer définitivement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- User edit modal (kept as-is) -->
    <UserEditModal
      v-model="showEditModal"
      :user-uuid="userToEdit?.uuid"
      :initial-user="userToEdit"
      :is-creating="isCreating"
      @saved="handleUserSaved"
      @close="closeEditModal"
    />

    <!-- Hours detail modal (kept as-is) -->
    <UserHoursModal ref="hoursModalRef" />

    <!-- Email edit modal (kept as-is) -->
    <UserEmailModal
      v-model="showEmailModal"
      :user-uuid="userToEditEmail?.uuid ?? null"
      :user-name="`${userToEditEmail?.firstName ?? ''} ${userToEditEmail?.lastName ?? ''}`"
      :current-email="userToEditEmail?.email ?? ''"
      @saved="handleEmailSaved"
      @close="closeEmailModal"
    />

    <!-- Context menu (right-click) -->
    <ContextMenuPopover
      ref="contextMenuRef"
      :show="contextMenu.state.value.show"
      :x="contextMenu.state.value.x"
      :y="contextMenu.state.value.y"
      :title="`${contextMenu.state.value.entity?.firstName ?? ''} ${contextMenu.state.value.entity?.lastName ?? ''}`"
      @close="contextMenu.close"
    >
      <ContextMenuItem @click="contextMenu.handleAction('services', handleContextAction)">
        <template #icon><ClipboardList class="size-4" /></template>
        Services
      </ContextMenuItem>
      <ContextMenuItem @click="contextMenu.handleAction('hours', handleContextAction)">
        <template #icon><Clock class="size-4" /></template>
        Heures
      </ContextMenuItem>
      <ContextMenuItem @click="contextMenu.handleAction('absences', handleContextAction)">
        <template #icon><CalendarOff class="size-4" /></template>
        Absences
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem @click="contextMenu.handleAction('email', handleContextAction)">
        <template #icon><Mail class="size-4" /></template>
        Modifier l'email
      </ContextMenuItem>
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
import { usersService } from '@/services/users'
import { useMessages } from '@/composables/useMessages'
import { useContextMenu } from '@/composables/useContextMenu'
import type { UserDTO, UserLastVehicleDTO } from '@/models'
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
  Search,
  LoaderCircle,
  Pencil,
  CircleCheck,
  CircleX,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Trash2,
  Users2,
  MoreVertical,
  ClipboardList,
  Clock,
  CalendarOff,
  Mail,
  Car,
  ExternalLink,
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

// Custom components (kept as-is for now)
import UserEditModal from '@/components/users/UserEditModal.vue'
import UserHoursModal from '@/components/users/UserHoursModal.vue'
import UserEmailModal from '@/components/users/UserEmailModal.vue'

// Type étendu pour inclure les propriétés de UserDTO et UserWithStatusDTO
interface UserWithStatus extends UserDTO {
  status?: UserStatus
  activeServiceStart?: Date | string
  activeServiceUuid?: string
}

interface TableColumnDef {
  key: string
  label: string
  sortable?: boolean
  align?: 'left' | 'center' | 'right'
}

const messages = useMessages()
const router = useRouter()
const users = ref<UserWithStatus[]>([])
const lastVehiclesMap = ref<Map<string, UserLastVehicleDTO>>(new Map())
const loading = ref(true)
const error = ref('')
const showDeleteModal = ref(false)
const userToDelete = ref<UserWithStatus | null>(null)
const deleting = ref(false)
const confirmText = ref('')

// Modal d'édition
const showEditModal = ref(false)
const userToEdit = ref<UserWithStatus | null>(null)
const isCreating = ref(false)

// Modal modification email
const showEmailModal = ref(false)
const userToEditEmail = ref<UserWithStatus | null>(null)

// Modal des heures
const hoursModalRef = ref<InstanceType<typeof UserHoursModal> | null>(null)

// Context menu
const contextMenu = useContextMenu<UserWithStatus>()
const contextMenuRef = ref<InstanceType<typeof ContextMenuPopover> | null>(null)

// Sync menuRef for viewport boundary detection
watch(() => contextMenuRef.value?.menuElement, (el) => {
  contextMenu.menuRef.value = el ?? null
})

const handleContextAction = (user: UserWithStatus, action: string) => {
  switch (action) {
    case 'services':
      router.push(`/users/${user.uuid}/services`)
      break
    case 'hours':
      openHoursModal(user)
      break
    case 'absences':
      goToUserAbsences(user)
      break
    case 'email':
      openEmailModal(user)
      break
    case 'edit':
      openEditModal(user)
      break
    case 'delete':
      confirmDelete(user)
      break
  }
}

// Filtres
const searchQuery = ref('')

// Sort state
const sortKey = ref<string | null>(null)
const sortDirection = ref<'asc' | 'desc'>('asc')

// Computed pour les utilisateurs filtrés avec propriétés plates pour le tri
const filteredUsers = computed(() => {
  let result = users.value.map(user => ({
    ...user,
    fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
    roleName: user.role?.nom || '',
    isMailVerifiedSort: user.isMailVerified ? 1 : 0,
    isActiveSort: user.isActive ? 1 : 0,
    statusSort: user.status || ''
  }))

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(user => {
      const fullName = user.fullName.toLowerCase()
      const email = (user.email || '').toLowerCase()
      return fullName.includes(query) || email.includes(query)
    })
  }

  return result
})

// Colonnes du tableau
const tableColumns = computed<TableColumnDef[]>(() => [
  { key: 'fullName', label: `Utilisateurs (${filteredUsers.value.length})`, sortable: true },
  { key: 'isMailVerifiedSort', label: 'Email', sortable: true },
  { key: 'roleName', label: 'Rôle', sortable: true },
  { key: 'statusSort', label: 'Présence', sortable: true },
  { key: 'isActiveSort', label: 'Compte', sortable: true },
  { key: 'lastVehicle', label: 'Dernier véhicule' },
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

// Obtenir le label du statut de présence
const getPresenceLabel = (status?: UserStatus): string => {
  if (!status) return UserStatusLabels[UserStatus.ABSENT]
  return UserStatusLabels[status] || status
}

// Badge variant/class pour la présence
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

const getLastVehicle = (userUuid?: string) => {
  if (!userUuid) return null
  return lastVehiclesMap.value.get(userUuid) ?? null
}

const formatVehicleDate = (dateStr: string) => {
  const date = new Date(dateStr)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const isYesterday = date.toDateString() === yesterday.toDateString()

  if (isToday) return "Aujourd'hui"
  if (isYesterday) return 'Hier'
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const loadUsers = async () => {
  try {
    loading.value = true
    error.value = ''

    const [usersResponse] = await Promise.all([
      usersService.getUsers(),
      loadLastVehicles()
    ])

    if (usersResponse && usersResponse.data) {
      users.value = Array.isArray(usersResponse.data) ? usersResponse.data : []
    } else if (Array.isArray(usersResponse)) {
      users.value = usersResponse
    } else {
      users.value = []
    }
  } catch (err: any) {
    error.value = err.message || 'Erreur lors du chargement des utilisateurs'
    messages.error(error.value, 'Erreur')
  } finally {
    loading.value = false
  }
}

const loadLastVehicles = async () => {
  try {
    const data = await usersService.getUsersLastVehicles()
    const map = new Map<string, UserLastVehicleDTO>()
    if (Array.isArray(data)) {
      for (const item of data) {
        map.set(item.userUuid, item)
      }
    }
    lastVehiclesMap.value = map
  } catch {
    // Endpoint may not exist yet — silently ignore
  }
}

const getInitials = (firstName?: string, lastName?: string) => {
  const first = firstName ? firstName.charAt(0).toUpperCase() : ''
  const last = lastName ? lastName.charAt(0).toUpperCase() : ''
  return first + last || '?'
}

const confirmDelete = (user: UserWithStatus) => {
  userToDelete.value = user
  confirmText.value = ''
  showDeleteModal.value = true
}

const cancelDelete = () => {
  showDeleteModal.value = false
  userToDelete.value = null
  confirmText.value = ''
}

const deleteUser = async () => {
  if (!userToDelete.value || confirmText.value !== 'CONFIRMER') return

  try {
    deleting.value = true
    await usersService.deleteUser(userToDelete.value.uuid!)
    users.value = users.value.filter(u => u.uuid !== userToDelete.value!.uuid)
    messages.success('Utilisateur supprimé avec succès', 'Succès')
    showDeleteModal.value = false
    userToDelete.value = null
    confirmText.value = ''
  } catch (err: any) {
    error.value = err.message || 'Erreur lors de la suppression'
    messages.error(error.value, 'Erreur')
  } finally {
    deleting.value = false
  }
}

const openEditModal = (user: UserWithStatus) => {
  isCreating.value = false
  userToEdit.value = user
  showEditModal.value = true
}

const closeEditModal = () => {
  showEditModal.value = false
  userToEdit.value = null
  isCreating.value = false
}

const handleUserSaved = (savedUser: UserDTO) => {
  const index = users.value.findIndex(u => u.uuid === savedUser.uuid)
  if (index !== -1) {
    users.value.splice(index, 1, savedUser as UserWithStatus)
  } else {
    users.value.push(savedUser as UserWithStatus)
  }
}

const openEmailModal = (user: UserWithStatus) => {
  userToEditEmail.value = user
  showEmailModal.value = true
}

const closeEmailModal = () => {
  showEmailModal.value = false
  userToEditEmail.value = null
}

const handleEmailSaved = (savedUser: UserDTO) => {
  const index = users.value.findIndex(u => u.uuid === savedUser.uuid)
  if (index !== -1) {
    users.value.splice(index, 1, savedUser as UserWithStatus)
  }
}

const openHoursModal = (user: UserWithStatus) => {
  hoursModalRef.value?.open(user.uuid!, `${user.firstName} ${user.lastName}`)
}

const goToUserAbsences = (user: UserWithStatus) => {
  router.push({
    path: '/absences',
    query: { userUuid: user.uuid }
  })
}

onMounted(() => {
  loadUsers()
})
</script>
