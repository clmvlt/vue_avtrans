<template>
  <div class="min-h-screen bg-background">
    <main class="px-4 py-4 sm:px-6 sm:py-6">
      <div class="mx-auto max-w-[1400px]">
        <!-- Loading -->
        <div v-if="loading" class="flex flex-col items-center justify-center gap-4 py-16">
          <LoaderCircle class="size-10 animate-spin text-primary" />
          <p class="text-lg text-muted-foreground">Chargement des signatures...</p>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="mb-4 rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
          {{ error }}
        </div>

        <!-- Content -->
        <div v-else class="space-y-4">
          <!-- Barre de recherche -->
          <div class="relative">
            <Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              v-model="searchQuery"
              type="search"
              placeholder="Rechercher par nom ou email..."
              class="pl-9"
            />
          </div>

          <!-- Tableau -->
          <div class="overflow-hidden rounded-lg border shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateurs ({{ filteredUsers.length }})</TableHead>
                  <TableHead class="hidden md:table-cell">Rôle</TableHead>
                  <TableHead class="hidden sm:table-cell">Date signature</TableHead>
                  <TableHead class="hidden sm:table-cell sm:text-center">Heures</TableHead>
                  <TableHead class="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-if="filteredUsers.length === 0">
                  <TableCell colspan="5" class="text-center text-muted-foreground">
                    Aucun utilisateur trouvé
                  </TableCell>
                </TableRow>
                <TableRow v-for="item in filteredUsers" :key="item.user.uuid">
                  <!-- Utilisateur -->
                  <TableCell>
                    <div class="flex items-center gap-3">
                      <div class="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
                        <img
                          v-if="item.user.pictureUrl"
                          :src="item.user.pictureUrl"
                          :alt="`Photo de ${item.user.firstName}`"
                          class="size-full object-cover"
                        />
                        <span v-else class="flex size-full items-center justify-center bg-primary text-sm font-semibold text-primary-foreground">
                          {{ getInitials(item.user.firstName, item.user.lastName) }}
                        </span>
                      </div>
                      <div class="flex flex-col gap-0.5">
                        <span class="font-medium text-foreground">{{ item.user.firstName }} {{ item.user.lastName }}</span>
                        <span class="text-sm text-muted-foreground sm:hidden">
                          <template v-if="item.lastSignature">
                            {{ formatDateTime(item.lastSignature.date) }} - <span class="font-semibold text-green-600 dark:text-green-400">{{ item.lastSignature.heuresSignees }}h</span>
                          </template>
                          <template v-else>Aucune signature</template>
                        </span>
                        <span class="hidden text-sm text-muted-foreground sm:block">{{ item.user.email }}</span>
                      </div>
                    </div>
                  </TableCell>

                  <!-- Rôle -->
                  <TableCell class="hidden md:table-cell">
                    <span
                      v-if="item.user.role"
                      class="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                      :style="{ backgroundColor: item.user.role.color }"
                    >
                      {{ item.user.role.nom }}
                    </span>
                    <span v-else class="italic text-muted-foreground text-xs">Aucun rôle</span>
                  </TableCell>

                  <!-- Date signature -->
                  <TableCell class="hidden sm:table-cell">
                    <span v-if="item.lastSignature" class="text-sm text-muted-foreground">
                      {{ formatDateTime(item.lastSignature.date) }}
                    </span>
                    <span v-else class="italic text-muted-foreground text-sm">Aucune signature</span>
                  </TableCell>

                  <!-- Heures -->
                  <TableCell class="hidden sm:table-cell sm:text-center">
                    <span v-if="item.lastSignature" class="font-semibold text-green-600 dark:text-green-400">
                      {{ item.lastSignature.heuresSignees }}h
                    </span>
                    <span v-else class="text-muted-foreground">-</span>
                  </TableCell>

                  <!-- Actions -->
                  <TableCell class="text-right">
                    <div class="flex flex-wrap justify-end gap-1.5">
                      <Button
                        v-if="item.lastSignature"
                        variant="outline"
                        size="icon-sm"
                        class="sm:size-auto sm:px-3"
                        @click="openSignatureModal(item)"
                        title="Voir la signature"
                      >
                        <Eye class="size-3.5 sm:mr-1.5" />
                        <span class="hidden sm:inline">Voir</span>
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon-sm"
                        class="sm:size-auto sm:px-3"
                        @click="openUserHistoryModal(item.user)"
                        title="Voir l'historique"
                      >
                        <History class="size-3.5 sm:mr-1.5" />
                        <span class="hidden sm:inline">Historique</span>
                      </Button>
                      <Button
                        v-if="item.lastSignature"
                        variant="destructive"
                        size="icon-sm"
                        class="sm:size-auto sm:px-3"
                        @click="openDeleteModal(item)"
                        title="Supprimer la signature"
                      >
                        <Trash2 class="size-3.5 sm:mr-1.5" />
                        <span class="hidden sm:inline">Supprimer</span>
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

    <!-- Modal de visualisation de signature -->
    <Dialog v-model:open="showSignatureModal">
      <DialogContent class="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Signature</DialogTitle>
          <DialogDescription>Détails de la signature</DialogDescription>
        </DialogHeader>
        <div class="text-center">
          <p class="mb-4 text-lg font-semibold text-foreground">
            {{ currentUser?.user?.firstName }} {{ currentUser?.user?.lastName }}
          </p>
          <div class="mb-4 grid grid-cols-2 gap-4">
            <div class="flex flex-col gap-1 rounded-md bg-muted p-3">
              <span class="text-xs uppercase tracking-wide text-muted-foreground">Date</span>
              <span class="text-base font-medium text-foreground">{{ formatDateTime(currentUser?.lastSignature?.date) }}</span>
            </div>
            <div class="flex flex-col gap-1 rounded-md bg-muted p-3">
              <span class="text-xs uppercase tracking-wide text-muted-foreground">Heures signées</span>
              <span class="text-lg font-medium text-green-600 dark:text-green-400">{{ currentUser?.lastSignature?.heuresSignees }}h</span>
            </div>
          </div>
          <div class="rounded-md border bg-muted p-4">
            <img
              :src="formatSignatureBase64(currentUser?.lastSignature?.signatureBase64)"
              alt="Signature"
              class="max-w-full rounded-sm"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="showSignatureModal = false">Fermer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Modal historique des signatures -->
    <Dialog v-model:open="showHistoryModal">
      <DialogContent class="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Historique - {{ selectedUser?.firstName }} {{ selectedUser?.lastName }}</DialogTitle>
          <DialogDescription>Liste des signatures de l'utilisateur</DialogDescription>
        </DialogHeader>

        <div v-if="loadingHistory" class="flex flex-col items-center gap-3 py-8">
          <LoaderCircle class="size-6 animate-spin text-primary" />
          <p class="m-0 text-sm text-muted-foreground">Chargement de l'historique...</p>
        </div>

        <div v-else-if="historyError" class="mb-4 rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
          {{ historyError }}
        </div>

        <div v-else-if="userSignatures.length === 0" class="flex flex-col items-center gap-3 py-8 text-muted-foreground">
          <FileSignature class="size-8 opacity-50" />
          <p class="m-0">Aucune signature trouvée pour cet utilisateur</p>
        </div>

        <div v-else class="flex max-h-[400px] flex-col gap-4 overflow-y-auto">
          <div v-for="signature in userSignatures" :key="signature.uuid" class="rounded-md border bg-muted p-4">
            <div class="mb-3 flex items-center justify-between">
              <span class="text-sm text-muted-foreground">{{ formatDateTime(signature.date) }}</span>
              <span class="font-semibold text-green-600 dark:text-green-400">{{ signature.heuresSignees }}h</span>
            </div>
            <div class="text-center">
              <img
                :src="formatSignatureBase64(signature.signatureBase64)"
                alt="Signature"
                class="max-h-[120px] max-w-full rounded-sm"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="showHistoryModal = false">Fermer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Modal de confirmation de suppression -->
    <Dialog v-model:open="showDeleteModal">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Supprimer la signature</DialogTitle>
          <DialogDescription>Cette action est irréversible.</DialogDescription>
        </DialogHeader>

        <div class="space-y-4">
          <p class="m-0 text-center text-base text-foreground">
            Êtes-vous sûr de vouloir supprimer cette signature ?
          </p>

          <div class="rounded-md border bg-muted p-4">
            <div class="flex justify-between border-b py-2">
              <span class="text-sm text-muted-foreground">Utilisateur</span>
              <span class="font-medium text-foreground">{{ currentUser?.user?.firstName }} {{ currentUser?.user?.lastName }}</span>
            </div>
            <div class="flex justify-between border-b py-2">
              <span class="text-sm text-muted-foreground">Date</span>
              <span class="font-medium text-foreground">{{ formatDateTime(currentUser?.lastSignature?.date) }}</span>
            </div>
            <div class="flex justify-between py-2">
              <span class="text-sm text-muted-foreground">Heures signées</span>
              <span class="font-medium text-foreground">{{ currentUser?.lastSignature?.heuresSignees }}h</span>
            </div>
          </div>

          <div v-if="deleteError" class="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
            {{ deleteError }}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="closeDeleteModal">Annuler</Button>
          <Button variant="destructive" :disabled="deleting" @click="handleDelete">
            <LoaderCircle v-if="deleting" class="mr-2 size-4 animate-spin" />
            Supprimer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { signaturesService } from '@/services'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Search, LoaderCircle, FileSignature, Eye, History, Trash2 } from 'lucide-vue-next'
import { useMessages } from '@/composables/useMessages'
import type { SignatureDTO, UserWithLastSignatureDTO } from '@/models'

// Types pour les réponses API spécifiques
interface AllSignaturesResponse {
  success: boolean
  message?: string
  users?: UserWithLastSignatureDTO[]
}

interface UserSignaturesResponse {
  success: boolean
  message?: string
  signatures?: SignatureDTO[]
}

const messages = useMessages()

// Data
const users = ref<UserWithLastSignatureDTO[]>([])
const loading = ref(true)
const error = ref('')

// Search
const searchQuery = ref('')

// Modal de visualisation
const showSignatureModal = ref(false)
const currentUser = ref<UserWithLastSignatureDTO | null>(null)

// Modal historique
const showHistoryModal = ref(false)
const selectedUser = ref<{ uuid: string; firstName: string; lastName: string } | null>(null)
const userSignatures = ref<SignatureDTO[]>([])
const loadingHistory = ref(false)
const historyError = ref('')

// Modal de suppression
const showDeleteModal = ref(false)
const deleting = ref(false)
const deleteError = ref('')

// Type pour les entrées avec user défini
type UserWithLastSignatureWithUser = UserWithLastSignatureDTO & { user: NonNullable<UserWithLastSignatureDTO['user']> }

// Computed pour les utilisateurs filtrés (avec user garanti défini)
const filteredUsers = computed((): UserWithLastSignatureWithUser[] => {
  const validUsers = users.value.filter((entry): entry is UserWithLastSignatureWithUser => !!entry.user)

  if (!searchQuery.value.trim()) return validUsers

  const query = searchQuery.value.toLowerCase()
  return validUsers.filter(userEntry => {
    const fullName = `${userEntry.user.firstName || ''} ${userEntry.user.lastName || ''}`.toLowerCase()
    const email = (userEntry.user.email || '').toLowerCase()
    return fullName.includes(query) || email.includes(query)
  })
})

// Méthodes
const loadSignatures = async () => {
  try {
    loading.value = true
    error.value = ''
    const response = await signaturesService.getAllSignatures() as unknown as AllSignaturesResponse
    users.value = response.users || []
  } catch (err: any) {
    console.error('Error loading signatures:', err)
    error.value = err.message || 'Erreur lors du chargement des signatures'
    messages.error(error.value, 'Erreur')
  } finally {
    loading.value = false
  }
}

const getInitials = (firstName?: string, lastName?: string) => {
  const first = firstName ? firstName.charAt(0).toUpperCase() : ''
  const last = lastName ? lastName.charAt(0).toUpperCase() : ''
  return first + last || '?'
}

const formatDateTime = (dateValue?: string | Date) => {
  if (!dateValue) return '-'
  const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue
  return date.toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatSignatureBase64 = (base64String?: string) => {
  if (!base64String) return ''
  if (base64String.startsWith('data:image')) {
    return base64String
  }
  return `data:image/png;base64,${base64String}`
}

// Modal de visualisation
const openSignatureModal = (userEntry: UserWithLastSignatureDTO) => {
  currentUser.value = userEntry
  showSignatureModal.value = true
}

// Modal historique
const openUserHistoryModal = async (user: { uuid?: string; firstName?: string; lastName?: string }) => {
  if (!user.uuid) return
  selectedUser.value = { uuid: user.uuid, firstName: user.firstName || '', lastName: user.lastName || '' }
  showHistoryModal.value = true
  loadingHistory.value = true
  historyError.value = ''
  userSignatures.value = []

  try {
    const response = await signaturesService.getUserSignatures(user.uuid) as unknown as UserSignaturesResponse
    userSignatures.value = response.signatures || []
  } catch (err: any) {
    historyError.value = err.message || 'Erreur lors du chargement de l\'historique'
  } finally {
    loadingHistory.value = false
  }
}

// Modal de suppression
const openDeleteModal = (userEntry: UserWithLastSignatureDTO) => {
  currentUser.value = userEntry
  deleteError.value = ''
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  deleteError.value = ''
  currentUser.value = null
}

const handleDelete = async () => {
  if (!currentUser.value?.lastSignature) return

  try {
    deleting.value = true
    deleteError.value = ''

    await signaturesService.deleteSignature(currentUser.value.lastSignature.uuid!)

    messages.success('Signature supprimée avec succès', 'Succès')
    closeDeleteModal()
    loadSignatures()
  } catch (err: any) {
    deleteError.value = err.message || 'Erreur lors de la suppression'
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  loadSignatures()
})
</script>
