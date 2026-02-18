<template>
  <div class="min-h-screen bg-background">
    <main class="px-6 py-6">
      <div class="mx-auto max-w-[1400px]">
        <!-- Loading -->
        <div v-if="loading" class="flex flex-col items-center justify-center gap-4 py-16">
          <LoaderCircle class="size-10 animate-spin text-primary" />
          <p class="text-lg text-muted-foreground">Chargement du vehicule...</p>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
          {{ error }}
        </div>

        <!-- Content -->
        <div v-else-if="vehicule" class="space-y-6">
          <!-- Info Card -->
          <VehiculeInfoCard
            :vehicule="vehicule"
            :is-editing="isEditing"
            :is-mecanicien="isMecanicien"
            :saving-edit="savingEdit"
            :edit-error="editError"
            v-model:edit-form-data="editFormData"
            :edit-picture-preview="editPicturePreview"
            :remove-picture-on-save="removePictureOnSave"
            @start-editing="startEditing"
            @cancel-editing="cancelEditing"
            @save-editing="saveEditing"
            @go-to-entretiens="goToEntretiens"
            @open-km-modal="openKmModal"
            @profile-picture-change="handleProfilePictureChange"
            @remove-profile-picture="removeProfilePicture"
            @go-back="router.push('/vehicules')"
          />

          <!-- Tabs -->
          <Tabs v-model="activeTab" default-value="fichiers">
            <div class="overflow-hidden rounded-lg border border-border">
              <div class="flex items-end bg-muted px-4 pt-2">
                <TabsList class="bg-transparent p-0 gap-0.5">
                  <TabsTrigger value="fichiers" class="gap-2 rounded-b-none rounded-t-lg border border-transparent px-5 py-2.5 text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=inactive]:bg-transparent dark:data-[state=active]:border-primary/40 dark:data-[state=active]:border-b-transparent dark:data-[state=active]:bg-primary/10">
                    <FolderOpen class="size-4" />
                    <span class="hidden sm:inline">Fichiers</span>
                  </TabsTrigger>
                  <TabsTrigger value="kilometrages" class="gap-2 rounded-b-none rounded-t-lg border border-transparent px-5 py-2.5 text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=inactive]:bg-transparent dark:data-[state=active]:border-primary/40 dark:data-[state=active]:border-b-transparent dark:data-[state=active]:bg-primary/10">
                    <Gauge class="size-4" />
                    <span class="hidden sm:inline">Historique km</span>
                  </TabsTrigger>
                  <TabsTrigger value="adjustInfos" class="gap-2 rounded-b-none rounded-t-lg border border-transparent px-5 py-2.5 text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=inactive]:bg-transparent dark:data-[state=active]:border-primary/40 dark:data-[state=active]:border-b-transparent dark:data-[state=active]:bg-primary/10">
                    <MessageSquare class="size-4" />
                    <span class="hidden sm:inline">Commentaires</span>
                  </TabsTrigger>
                  <TabsTrigger value="rapports" class="gap-2 rounded-b-none rounded-t-lg border border-transparent px-5 py-2.5 text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=inactive]:bg-transparent dark:data-[state=active]:border-primary/40 dark:data-[state=active]:border-b-transparent dark:data-[state=active]:bg-primary/10">
                    <ClipboardList class="size-4" />
                    <span class="hidden sm:inline">Rapports</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="fichiers" class="mt-0 bg-background p-6">
                <VehiculeFilesTab
                  :files="files"
                  :loading-files="loadingFiles"
                  :is-mecanicien="isMecanicien"
                  :uploading-files="uploadingFiles"
                  :file-upload-error="fileUploadError"
                  :upload-progress="uploadProgress"
                  :upload-current-file="uploadCurrentFile"
                  :upload-total-files="uploadTotalFiles"
                  :upload-current-index="uploadCurrentIndex"
                  @files-selected="handleFilesSelected"
                  @view-image="openImageFullscreen"
                  @view-pdf="openPdfViewer"
                  @download="downloadFile"
                  @delete-file="deleteFile"
                />
              </TabsContent>

              <TabsContent value="kilometrages" class="mt-0 bg-background p-6">
                <VehiculeKilometragesTab
                  ref="kmTabRef"
                  :kilometrages="kilometrages"
                  :loading="loadingKilometrages"
                  :page="kmPage"
                  :total-pages="kmTotalPages"
                  :total-elements="kmTotalElements"
                  :page-size="kmSize"
                  :show-all="kmShowAll"
                  :is-admin="authStore.isAdmin"
                  @edit-km="openEditKmModal"
                  @load-all="loadAllKilometrages"
                  @update:page="goToKmPage"
                />
              </TabsContent>

              <TabsContent value="adjustInfos" class="mt-0 bg-background p-6">
                <VehiculeCommentsTab
                  :adjust-infos="adjustInfos"
                  :loading="loadingAdjustInfos"
                  :page="adjustInfosPage"
                  :total-pages="adjustInfosTotalPages"
                  @add-comment="openAddCommentModal"
                  @view-pictures="loadAdjustPictures"
                  @update:page="goToAdjustInfosPage"
                />
              </TabsContent>

              <TabsContent value="rapports" class="mt-0 bg-background p-6">
                <VehiculeRapportsTab
                  :rapports="rapports"
                  :loading="loadingRapports"
                  :page="rapportsPage"
                  :total-pages="rapportsTotalPages"
                  :total-elements="rapportsTotalElements"
                  :show-all="rapportsShowAll"
                  :page-size="rapportsSize"
                  @view-pictures="openRapportPicturesModal"
                  @load-all="loadAllRapports"
                  @update:page="goToRapportsPage"
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </main>

    <!-- Modal d'ajout de kilometrage -->
    <Dialog v-model:open="showKmModal">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle class="flex items-center gap-2">
            <div class="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Gauge class="size-5" />
            </div>
            Ajouter un kilometrage
          </DialogTitle>
          <DialogDescription class="sr-only">Formulaire d'ajout de kilometrage</DialogDescription>
        </DialogHeader>
        <div v-if="kmError" class="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {{ kmError }}
        </div>
        <form @submit.prevent="submitKilometrage" class="space-y-4">
          <div class="space-y-2">
            <label class="text-sm font-medium">Kilométrage actuel *</label>
            <Input ref="kmInputRef" type="number" inputmode="numeric" :model-value="kmValue ?? undefined" @update:model-value="kmValue = $event ? Number($event) : null" required min="0" :disabled="savingKm" placeholder="125000" />
          </div>
          <div v-if="authStore.isAdmin" class="space-y-2">
            <label class="text-sm font-medium">Date du releve (optionnel)</label>
            <Input type="datetime-local" :model-value="kmDate ?? undefined" @update:model-value="kmDate = $event ? String($event) : null" :disabled="savingKm" />
            <p class="text-xs text-muted-foreground">Laissez vide pour utiliser la date actuelle</p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" @click="showKmModal = false">Annuler</Button>
            <Button type="submit" :disabled="!kmValue || savingKm">
              <LoaderCircle v-if="savingKm" class="mr-2 size-4 animate-spin" />
              <Check v-else class="mr-2 size-4" />
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <!-- Modal d'edition de kilometrage (admin only) -->
    <Dialog v-model:open="showEditKmModal">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle class="flex items-center gap-2">
            <div class="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Gauge class="size-5" />
            </div>
            Modifier le kilometrage
          </DialogTitle>
          <DialogDescription class="sr-only">Formulaire d'edition de kilometrage</DialogDescription>
        </DialogHeader>
        <div v-if="editKmError" class="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {{ editKmError }}
        </div>
        <form @submit.prevent="submitEditKilometrage" class="space-y-4">
          <div class="space-y-2">
            <label class="text-sm font-medium">Kilometrage *</label>
            <Input type="number" :model-value="editKmValue ?? undefined" @update:model-value="editKmValue = $event ? Number($event) : null" required min="0" :disabled="savingEditKm" placeholder="125000" />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium">Date du releve</label>
            <Input type="datetime-local" :model-value="editKmDate ?? undefined" @update:model-value="editKmDate = $event ? String($event) : null" :disabled="savingEditKm" />
          </div>
          <div v-if="editingKm?.user" class="space-y-2">
            <label class="text-sm font-medium">Enregistre par</label>
            <div class="flex items-center gap-2 rounded-lg border bg-muted px-3 py-2">
              <div v-if="editingKm.user.pictureUrl" class="size-8 overflow-hidden rounded-full">
                <img :src="editingKm.user.pictureUrl" :alt="editingKm.user.firstName" class="size-full object-cover" />
              </div>
              <div v-else class="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                <User class="size-4" />
              </div>
              <span class="text-sm">{{ editingKm.user.firstName }} {{ editingKm.user.lastName }}</span>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" @click="closeEditKmModal">Annuler</Button>
            <Button type="submit" :disabled="!editKmValue || savingEditKm">
              <LoaderCircle v-if="savingEditKm" class="mr-2 size-4 animate-spin" />
              <Check v-else class="mr-2 size-4" />
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <!-- Modal pour afficher les photos d'une info d'ajustement -->
    <Dialog v-model:open="showAdjustPicturesModal">
      <DialogContent class="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle class="flex items-center gap-2">
            <div class="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Images class="size-5" />
            </div>
            Photos de l'ajustement
          </DialogTitle>
          <DialogDescription class="sr-only">Galerie de photos de l'ajustement</DialogDescription>
        </DialogHeader>
        <div v-if="loadingAdjustPictures" class="flex flex-col items-center justify-center gap-4 py-8">
          <LoaderCircle class="size-10 animate-spin text-primary" />
          <p class="text-sm text-muted-foreground">Chargement des photos...</p>
        </div>
        <div v-else-if="currentAdjustPictures.length === 0" class="flex flex-col items-center justify-center gap-4 py-8">
          <div class="flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Images class="size-8" />
          </div>
          <p class="text-sm text-muted-foreground">Aucune photo pour cet ajustement</p>
        </div>
        <div v-else class="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div v-for="picture in currentAdjustPictures" :key="picture.id" class="space-y-2">
            <div class="aspect-square overflow-hidden rounded-lg border bg-muted">
              <img
                :src="picture.pictureUrl ?? ''"
                :alt="'Photo de l\'ajustement'"
                class="size-full cursor-pointer object-cover transition-transform hover:scale-105"
                @click="openImageFullscreen(picture.pictureUrl ?? '')"
              />
            </div>
            <p class="text-xs text-muted-foreground">{{ formatDate(picture.createdAt) }}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <!-- Modal d'ajout de commentaire -->
    <Dialog v-model:open="showAddCommentModal">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle class="flex items-center gap-2">
            <div class="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <MessageSquare class="size-5" />
            </div>
            Ajouter un commentaire
          </DialogTitle>
          <DialogDescription class="sr-only">Formulaire d'ajout de commentaire</DialogDescription>
        </DialogHeader>
        <div v-if="commentError" class="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {{ commentError }}
        </div>
        <form @submit.prevent="submitComment" class="space-y-4">
          <div class="space-y-2">
            <label class="text-sm font-medium">Commentaire *</label>
            <textarea
              v-model="commentFormData.comment"
              required
              :disabled="savingComment"
              placeholder="Entrez votre commentaire..."
              rows="4"
              class="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            ></textarea>
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium">Photos (optionnel)</label>
            <input
              ref="commentFileInput"
              type="file"
              accept="image/*"
              multiple
              class="hidden"
              @change="handleCommentPictureSelect"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              :disabled="savingComment"
              @click="commentFileInput?.click()"
            >
              <Camera class="mr-2 size-4" />
              Ajouter des photos
            </Button>
            <div v-if="commentPicturePreviews.length > 0" class="grid grid-cols-3 gap-2">
              <div v-for="(preview, index) in commentPicturePreviews" :key="index" class="relative">
                <div class="aspect-square overflow-hidden rounded-lg border">
                  <img :src="preview" alt="Apercu" class="size-full object-cover" />
                </div>
                <Button
                  variant="destructive"
                  size="icon-sm"
                  class="absolute -right-1.5 -top-1.5"
                  @click="removeCommentPicture(index)"
                  :disabled="savingComment"
                >
                  <X class="size-3" />
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" @click="closeAddCommentModal" :disabled="savingComment">
              Annuler
            </Button>
            <Button type="submit" :disabled="!commentFormData.comment.trim() || savingComment">
              <LoaderCircle v-if="savingComment" class="mr-2 size-4 animate-spin" />
              <Check v-else class="mr-2 size-4" />
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <!-- Modal pour afficher les photos d'un rapport -->
    <Dialog v-model:open="showRapportPicturesModal">
      <DialogContent class="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle class="flex items-center gap-2">
            <div class="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Images class="size-5" />
            </div>
            Photos du rapport
          </DialogTitle>
          <DialogDescription class="sr-only">Galerie de photos du rapport</DialogDescription>
        </DialogHeader>
        <div v-if="selectedRapport?.pictures && selectedRapport.pictures.length > 0" class="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div v-for="picture in selectedRapport.pictures" :key="picture.id" class="space-y-2">
            <div class="aspect-square overflow-hidden rounded-lg border bg-muted">
              <img
                :src="picture.pictureUrl ?? ''"
                :alt="'Photo du rapport'"
                class="size-full cursor-pointer object-cover transition-transform hover:scale-105"
                @click="openImageFullscreen(picture.pictureUrl ?? '')"
              />
            </div>
            <p class="text-xs text-muted-foreground">{{ formatDate(picture.createdAt) }}</p>
          </div>
        </div>
        <div v-else class="flex flex-col items-center justify-center gap-4 py-8">
          <div class="flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Images class="size-8" />
          </div>
          <p class="text-sm text-muted-foreground">Aucune photo pour ce rapport</p>
        </div>
      </DialogContent>
    </Dialog>

    <!-- PDF viewer overlay -->
    <div v-if="showPdfViewer" class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" @click.self="closePdfViewer">
      <div class="flex h-[90vh] w-full max-w-[1200px] flex-col overflow-hidden rounded-lg bg-background shadow-2xl">
        <div class="flex items-center justify-between border-b bg-muted px-4 py-3">
          <span class="mr-4 flex-1 truncate text-sm font-semibold">{{ currentPdfFile?.originalName }}</span>
          <div class="flex items-center gap-2">
            <Button v-if="currentPdfFile" variant="outline" size="sm" @click="downloadFile(currentPdfFile)">
              <Download class="mr-2 size-3.5" />
              Telecharger
            </Button>
            <Button variant="ghost" size="icon-sm" @click="closePdfViewer">
              <X class="size-4" />
            </Button>
          </div>
        </div>
        <div class="flex-1 overflow-hidden">
          <iframe v-if="currentPdfUrl" :src="currentPdfUrl" class="size-full border-none" title="PDF" />
        </div>
      </div>
    </div>

    <!-- Image fullscreen overlay -->
    <ImageLightbox v-model:open="showImageFullscreen" :src="fullscreenImageUrl ?? ''" alt="Image plein ecran" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { vehiclesService, rapportsService } from '@/services'
import type { VehiculeDTO, VehiculeKilometrageDTO, VehiculePictureDTO, VehiculeFileDTO, VehiculeAdjustInfoDTO, RapportVehiculeDTO } from '@/models'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ImageLightbox } from '@/components/ui/image-lightbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import VehiculeInfoCard from '@/components/vehicles/VehiculeInfoCard.vue'
import VehiculeFilesTab from '@/components/vehicles/VehiculeFilesTab.vue'
import VehiculeKilometragesTab from '@/components/vehicles/VehiculeKilometragesTab.vue'
import VehiculeCommentsTab from '@/components/vehicles/VehiculeCommentsTab.vue'
import VehiculeRapportsTab from '@/components/vehicles/VehiculeRapportsTab.vue'
import {
  LoaderCircle, Gauge, X, Check, Camera, MessageSquare,
  FolderOpen, ClipboardList, Images, Download, User
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const vehiculeId = route.params.id as string

const goToEntretiens = () => {
  if (vehiculeId) router.push(`/entretiens/vehicule/${vehiculeId}`)
}

const vehicule = ref<VehiculeDTO | null>(null)
const loading = ref(true)
const error = ref('')

// Mode edition
const isEditing = ref(false)
const savingEdit = ref(false)
const editError = ref('')
const editFormData = ref({
  immat: '',
  brand: '',
  model: '',
  comment: '',
  pictureBase64: '' as string | null
})
const editPicturePreview = ref<string | null>(null)
const removePictureOnSave = ref(false)

const activeTab = ref('fichiers')

// Verifier si l'utilisateur est mecanicien ou admin
const isMecanicien = computed(() => {
  const roleUuid = authStore.userRoleUuid
  return roleUuid === 'c10523af-a4ab-47e2-8025-5ef4e241ef08' || // Admin
         roleUuid === 'ccbd448a-0eef-4277-b53b-91be340b080f'    // Mecanicien
})

// Fichiers (images, PDFs, documents)
const files = ref<VehiculeFileDTO[]>([])
const loadingFiles = ref(false)

// PDF Viewer
const showPdfViewer = ref(false)
const currentPdfFile = ref<VehiculeFileDTO | null>(null)
const currentPdfUrl = ref<string | null>(null)

// Image fullscreen
const fullscreenImageUrl = ref<string | null>(null)
const showImageFullscreen = ref(false)

// Kilometrages
const kilometrages = ref<VehiculeKilometrageDTO[]>([])
const loadingKilometrages = ref(false)
const kmTabRef = ref<InstanceType<typeof VehiculeKilometragesTab> | null>(null)
const kmPage = ref(0)
const kmSize = ref(10)
const kmTotalPages = ref(0)
const kmTotalElements = ref(0)
const kmShowAll = ref(false)

// Informations d'ajustement (commentaires)
const adjustInfos = ref<VehiculeAdjustInfoDTO[]>([])
const loadingAdjustInfos = ref(false)
const adjustInfosPage = ref(0)
const adjustInfosSize = ref(10)
const adjustInfosTotalPages = ref(0)
const adjustInfosTotalElements = ref(0)

// Rapports
const rapports = ref<RapportVehiculeDTO[]>([])
const loadingRapports = ref(false)
const showRapportPicturesModal = ref(false)
const selectedRapport = ref<RapportVehiculeDTO | null>(null)
const rapportsPage = ref(0)
const rapportsSize = ref(10)
const rapportsTotalPages = ref(0)
const rapportsTotalElements = ref(0)
const rapportsShowAll = ref(false)

// Modal kilometrage (creation)
const showKmModal = ref(false)
const kmValue = ref<number | null>(null)
const kmDate = ref<string | null>(null)
const savingKm = ref(false)
const kmError = ref('')
const kmInputRef = ref<{ $el: HTMLInputElement } | null>(null)

// Modal kilometrage (edition - admin only)
const showEditKmModal = ref(false)
const editingKm = ref<VehiculeKilometrageDTO | null>(null)
const editKmValue = ref<number | null>(null)
const editKmDate = ref<string | null>(null)
const savingEditKm = ref(false)
const editKmError = ref('')

// Modal photos d'ajustement
const showAdjustPicturesModal = ref(false)
const currentAdjustPictures = ref<VehiculePictureDTO[]>([])
const loadingAdjustPictures = ref(false)

// Modal ajout de commentaire
const showAddCommentModal = ref(false)
const savingComment = ref(false)
const commentError = ref('')
const commentFormData = ref({
  comment: '',
  picturesB64: [] as string[]
})
const commentPicturePreviews = ref<string[]>([])
const commentFileInput = ref<HTMLInputElement | null>(null)

// Upload fichiers
const uploadingFiles = ref(false)
const fileUploadError = ref('')
const uploadProgress = ref(0)
const uploadCurrentFile = ref('')
const uploadTotalFiles = ref(0)
const uploadCurrentIndex = ref(0)

const loadVehicule = async () => {
  try {
    loading.value = true
    error.value = ''
    const response = await vehiclesService.getVehicleById(vehiculeId)
    vehicule.value = response.vehicule || null
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Erreur lors du chargement du vehicule'
  } finally {
    loading.value = false
  }
}

// Fonctions d'edition
const startEditing = () => {
  if (!vehicule.value) return
  editFormData.value = {
    immat: vehicule.value.immat || '',
    brand: vehicule.value.brand || '',
    model: vehicule.value.model || '',
    comment: vehicule.value.comment || '',
    pictureBase64: null
  }
  editPicturePreview.value = null
  removePictureOnSave.value = false
  editError.value = ''
  isEditing.value = true
}

const cancelEditing = () => {
  isEditing.value = false
  editError.value = ''
  editPicturePreview.value = null
  removePictureOnSave.value = false
}

const saveEditing = async () => {
  if (!vehicule.value || !vehicule.value.id) return

  editError.value = ''
  savingEdit.value = true

  try {
    const updateData: {
      immat?: string
      brand?: string
      model?: string
      comment?: string
      pictureBase64?: string
    } = {
      immat: editFormData.value.immat,
      brand: editFormData.value.brand,
      model: editFormData.value.model,
      comment: editFormData.value.comment
    }

    // Ajouter la photo si elle a ete modifiee
    if (editFormData.value.pictureBase64) {
      updateData.pictureBase64 = editFormData.value.pictureBase64
    } else if (removePictureOnSave.value) {
      // Si on veut supprimer la photo, on envoie une chaine vide
      updateData.pictureBase64 = ''
    }

    const response = await vehiclesService.updateVehicle(vehicule.value.id, updateData)

    if (response.vehicule) {
      vehicule.value = response.vehicule
    }

    isEditing.value = false
    editPicturePreview.value = null
    removePictureOnSave.value = false
  } catch (err: unknown) {
    editError.value = err instanceof Error ? err.message : 'Erreur lors de la sauvegarde'
  } finally {
    savingEdit.value = false
  }
}

// Gestion de la photo de profil en mode edition
const handleProfilePictureChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  // Verifier que c'est bien une image
  if (!file.type.startsWith('image/')) {
    editError.value = 'Veuillez selectionner une image valide'
    return
  }

  // Verifier la taille (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    editError.value = 'L\'image est trop volumineuse (max 10MB)'
    return
  }

  editError.value = ''
  const reader = new FileReader()
  reader.onload = (e) => {
    const base64 = e.target?.result as string
    editPicturePreview.value = base64
    editFormData.value.pictureBase64 = base64
    removePictureOnSave.value = false
  }
  reader.onerror = () => {
    editError.value = 'Erreur lors de la lecture du fichier'
  }
  reader.readAsDataURL(file)

  // Reinitialiser l'input pour permettre de re-selectionner le meme fichier
  target.value = ''
}

const removeProfilePicture = () => {
  editPicturePreview.value = null
  editFormData.value.pictureBase64 = null
  removePictureOnSave.value = true
}

const loadFiles = async () => {
  try {
    loadingFiles.value = true
    const response = await vehiclesService.getVehicleFiles(vehiculeId)
    files.value = response.files || []
  } catch {
    // Erreur silencieuse pour le chargement des fichiers
  } finally {
    loadingFiles.value = false
  }
}

const loadKilometrages = async (page: number = 0, showAll: boolean = false) => {
  try {
    loadingKilometrages.value = true
    const size = showAll ? -1 : kmSize.value
    const response = await vehiclesService.getKilometrageHistory(vehiculeId, page, size)
    kilometrages.value = response.kilometrages || []
    kmPage.value = response.page
    kmTotalPages.value = response.totalPages
    kmTotalElements.value = response.totalElements
    kmShowAll.value = showAll

    // Mettre a jour le graphique si on est sur l'onglet kilometrages
    if (activeTab.value === 'kilometrages' && kilometrages.value.length > 0) {
      await nextTick()
      setTimeout(() => {
        kmTabRef.value?.updateChart()
      }, 100)
    }
  } catch {
    // Erreur silencieuse pour le chargement des kilometrages
  } finally {
    loadingKilometrages.value = false
  }
}

const goToKmPage = (page: number) => {
  if (page >= 0 && page < kmTotalPages.value) {
    loadKilometrages(page, false)
  }
}

const loadAllKilometrages = () => {
  loadKilometrages(0, true)
}

const loadAdjustInfos = async (page: number = 0) => {
  try {
    loadingAdjustInfos.value = true
    const response = await vehiclesService.getAdjustInfo(vehiculeId, page, adjustInfosSize.value)
    adjustInfos.value = response.adjustInfos || []
    adjustInfosPage.value = response.page
    adjustInfosTotalPages.value = response.totalPages
    adjustInfosTotalElements.value = response.totalElements
  } catch {
    // Erreur silencieuse pour le chargement des commentaires
  } finally {
    loadingAdjustInfos.value = false
  }
}

const goToAdjustInfosPage = (page: number) => {
  if (page >= 0 && page < adjustInfosTotalPages.value) {
    loadAdjustInfos(page)
  }
}

// Rapports
const loadRapports = async (page: number = 0, showAll: boolean = false) => {
  loadingRapports.value = true
  try {
    const size = showAll ? -1 : rapportsSize.value
    const response = await rapportsService.getRapports(vehiculeId, page, size)
    rapports.value = response.data || []
    rapportsPage.value = response.page
    rapportsTotalPages.value = response.totalPages
    rapportsTotalElements.value = response.totalElements
    rapportsShowAll.value = showAll
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Erreur lors du chargement des rapports'
  } finally {
    loadingRapports.value = false
  }
}

const goToRapportsPage = (page: number) => {
  if (page >= 0 && page < rapportsTotalPages.value) {
    loadRapports(page, false)
  }
}

const loadAllRapports = () => {
  loadRapports(0, true)
}

const openRapportPicturesModal = (rapport: RapportVehiculeDTO) => {
  selectedRapport.value = rapport
  showRapportPicturesModal.value = true
}

watch(showRapportPicturesModal, (isOpen) => {
  if (!isOpen) selectedRapport.value = null
})

// Watcher pour charger les donnees quand on arrive sur l'onglet
watch(activeTab, async (newTab) => {
  if (newTab === 'kilometrages') {
    await nextTick()
    if (kilometrages.value.length > 0) {
      setTimeout(() => {
        kmTabRef.value?.updateChart()
      }, 100)
    }
  }
  if (newTab === 'rapports') {
    await loadRapports()
  }
})

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

// Gestion du kilometrage
const openKmModal = async () => {
  kmValue.value = null
  kmDate.value = null
  kmError.value = ''
  showKmModal.value = true
  // Focus sur le champ kilométrage après l'ouverture du modal
  await nextTick()
  setTimeout(() => {
    kmInputRef.value?.$el?.focus()
  }, 100)
}

const closeKmModal = () => {
  showKmModal.value = false
  kmValue.value = null
  kmDate.value = null
  kmError.value = ''
}

const submitKilometrage = async () => {
  kmError.value = ''

  try {
    savingKm.value = true

    // Admin avec date personnalisee -> endpoint admin
    if (authStore.isAdmin && kmDate.value) {
      await vehiclesService.addKilometrageAdmin({
        vehiculeId: vehiculeId,
        km: kmValue.value!,
        createdAt: new Date(kmDate.value).toISOString()
      })
    } else {
      // Mecanicien ou admin sans date -> endpoint standard
      await vehiclesService.addKilometrage({
        vehiculeId: vehiculeId,
        km: kmValue.value!
      })
    }

    // Recharger les donnees et mettre a jour le graphique
    await Promise.all([loadVehicule(), loadKilometrages()])

    // Fermer immediatement apres succes
    closeKmModal()
  } catch (err: unknown) {
    kmError.value = err instanceof Error ? err.message : 'Erreur lors de l\'ajout du kilometrage'
  } finally {
    savingKm.value = false
  }
}

// Gestion du modal d'edition de kilometrage (admin only)
const openEditKmModal = (km: VehiculeKilometrageDTO) => {
  editingKm.value = km
  editKmValue.value = km.km ?? null
  // Convertir la date ISO en format datetime-local
  if (km.createdAt) {
    const date = new Date(km.createdAt)
    // Format: YYYY-MM-DDTHH:mm
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    editKmDate.value = `${year}-${month}-${day}T${hours}:${minutes}`
  } else {
    editKmDate.value = null
  }
  editKmError.value = ''
  showEditKmModal.value = true
}

const closeEditKmModal = () => {
  showEditKmModal.value = false
  editingKm.value = null
  editKmValue.value = null
  editKmDate.value = null
  editKmError.value = ''
}

const submitEditKilometrage = async () => {
  if (!editingKm.value?.id || !editKmValue.value) return

  editKmError.value = ''
  savingEditKm.value = true

  try {
    await vehiclesService.updateKilometrageAdmin(editingKm.value.id, {
      km: editKmValue.value,
      createdAt: editKmDate.value ? new Date(editKmDate.value).toISOString() : undefined
    })

    // Recharger les donnees et mettre a jour le graphique
    await Promise.all([loadVehicule(), loadKilometrages()])

    // Fermer le modal apres succes
    closeEditKmModal()
  } catch (err: unknown) {
    editKmError.value = err instanceof Error ? err.message : 'Erreur lors de la modification du kilometrage'
  } finally {
    savingEditKm.value = false
  }
}

const deleteFile = async (fileId: string) => {
  try {
    await vehiclesService.deleteFile(fileId)
    await loadFiles()
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Erreur lors de la suppression du fichier'
  }
}

// Gestion des photos d'ajustement
const loadAdjustPictures = async (adjustInfoId: string) => {
  try {
    showAdjustPicturesModal.value = true
    loadingAdjustPictures.value = true
    const response = await vehiclesService.getAdjustInfoPictures(adjustInfoId)
    currentAdjustPictures.value = response.pictures || []
  } catch {
    // Erreur silencieuse pour le chargement des photos d'ajustement
  } finally {
    loadingAdjustPictures.value = false
  }
}

watch(showAdjustPicturesModal, (isOpen) => {
  if (!isOpen) currentAdjustPictures.value = []
})

// Fonctions modal ajout commentaire
const openAddCommentModal = () => {
  commentFormData.value = {
    comment: '',
    picturesB64: []
  }
  commentPicturePreviews.value = []
  commentError.value = ''
  showAddCommentModal.value = true
}

const closeAddCommentModal = () => {
  showAddCommentModal.value = false
  commentFormData.value = {
    comment: '',
    picturesB64: []
  }
  commentPicturePreviews.value = []
  commentError.value = ''
  if (commentFileInput.value) {
    commentFileInput.value.value = ''
  }
}

const handleCommentPictureSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = target.files
  if (!files || files.length === 0) return

  Array.from(files).forEach(file => {
    if (!file.type.startsWith('image/')) {
      commentError.value = 'Veuillez selectionner uniquement des images'
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const base64 = e.target?.result as string
      commentFormData.value.picturesB64.push(base64)
      commentPicturePreviews.value.push(base64)
    }
    reader.readAsDataURL(file)
  })

  // Reset input pour permettre de selectionner a nouveau les memes fichiers
  if (commentFileInput.value) {
    commentFileInput.value.value = ''
  }
}

const removeCommentPicture = (index: number) => {
  commentFormData.value.picturesB64.splice(index, 1)
  commentPicturePreviews.value.splice(index, 1)
}

const submitComment = async () => {
  commentError.value = ''

  if (!commentFormData.value.comment.trim()) {
    commentError.value = 'Veuillez entrer un commentaire'
    return
  }

  try {
    savingComment.value = true
    await vehiclesService.createAdjustInfo({
      vehiculeId: vehiculeId,
      comment: commentFormData.value.comment.trim(),
      picturesB64: commentFormData.value.picturesB64.length > 0 ? commentFormData.value.picturesB64 : undefined
    })

    // Recharger les commentaires
    await loadAdjustInfos(0)

    // Fermer le modal
    closeAddCommentModal()
  } catch (err: unknown) {
    commentError.value = err instanceof Error ? err.message : 'Erreur lors de l\'ajout du commentaire'
  } finally {
    savingComment.value = false
  }
}

// Fonction de gestion des fichiers selectionnes par FilesTab
const handleFilesSelected = async (fileList: FileList) => {
  await uploadFilesToServer(fileList)
}

const uploadFilesToServer = async (fileList: FileList) => {
  uploadingFiles.value = true
  fileUploadError.value = ''
  uploadProgress.value = 0
  uploadCurrentIndex.value = 0
  uploadTotalFiles.value = fileList.length
  uploadCurrentFile.value = ''

  const filesArray = Array.from(fileList)

  try {
    for (let i = 0; i < filesArray.length; i++) {
      const file = filesArray[i]
      if (!file) continue

      uploadCurrentIndex.value = i + 1
      uploadCurrentFile.value = file.name
      uploadProgress.value = Math.round((i / filesArray.length) * 100)

      // Verifier la taille (max 500MB)
      if (file.size > 500 * 1024 * 1024) {
        fileUploadError.value = `Le fichier "${file.name}" est trop volumineux (max 500MB)`
        continue
      }

      // Convertir en base64
      const base64 = await fileToBase64(file)

      // Envoyer au serveur
      await vehiclesService.addFile(vehiculeId, {
        fileB64: base64,
        originalName: file.name,
        mimeType: file.type || 'application/octet-stream'
      })
    }

    uploadProgress.value = 100

    // Recharger les fichiers
    await loadFiles()
  } catch (err: unknown) {
    fileUploadError.value = err instanceof Error ? err.message : 'Erreur lors de l\'upload du fichier'
  } finally {
    uploadingFiles.value = false
    uploadProgress.value = 0
    uploadCurrentFile.value = ''
  }
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

const getFileUrl = (file: VehiculeFileDTO): string => {
  if (file.fileUrl) return file.fileUrl
  if (file.fileB64 && file.mimeType) {
    // Si le base64 contient deja le prefixe data:, le retourner tel quel
    if (file.fileB64.startsWith('data:')) return file.fileB64
    return `data:${file.mimeType};base64,${file.fileB64}`
  }
  return ''
}

const downloadFile = (file: VehiculeFileDTO) => {
  const url = getFileUrl(file)
  const link = document.createElement('a')
  link.href = url
  link.download = file.originalName || 'fichier'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const openPdfViewer = (file: VehiculeFileDTO) => {
  currentPdfFile.value = file
  currentPdfUrl.value = getFileUrl(file)
  showPdfViewer.value = true
}

const closePdfViewer = () => {
  showPdfViewer.value = false
  currentPdfFile.value = null
  currentPdfUrl.value = null
}

const openImageFullscreen = (url: string) => {
  fullscreenImageUrl.value = url
  showImageFullscreen.value = true
}

onMounted(async () => {
  await loadVehicule()
  await Promise.all([
    loadFiles(),
    loadKilometrages(),
    loadAdjustInfos()
  ])
})
</script>
