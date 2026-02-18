<template>
  <div class="min-h-screen bg-background">
    <main class="px-6 py-6">
      <div class="mx-auto max-w-3xl">
        <!-- Loading -->
        <div v-if="loading" class="flex flex-col items-center justify-center gap-4 py-16">
          <LoaderCircle class="size-10 animate-spin text-primary" />
          <p class="text-lg text-muted-foreground">Chargement...</p>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="mb-4 rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
          {{ error }}
        </div>

        <!-- Content -->
        <div v-else class="space-y-6">
          <Button variant="ghost" size="sm" class="gap-1.5" @click="$router.back()">
            <ArrowLeft class="size-4" />
            Retour
          </Button>

          <!-- Section 1: Personal Information -->
          <section class="rounded-lg border bg-card p-6 shadow-sm">
            <div class="mb-6 flex items-center justify-between border-b pb-4">
              <div class="flex items-center gap-3">
                <User class="size-5 text-primary" />
                <h2 class="text-lg font-semibold text-foreground">Informations personnelles</h2>
              </div>
              <Button
                v-if="!isEditingProfile"
                variant="ghost"
                size="sm"
                @click="startEditingProfile"
              >
                <Pencil class="size-3.5" />
                Modifier
              </Button>
            </div>

            <!-- View Mode -->
            <div v-if="!isEditingProfile" class="flex flex-col gap-4">
              <div class="flex items-center gap-4 rounded-md border bg-background p-4 max-sm:flex-col max-sm:text-center">
                <Avatar class="size-20 shrink-0 border-2 border-border">
                  <AvatarImage v-if="user?.pictureUrl" :src="user.pictureUrl" alt="Photo de profil" />
                  <AvatarFallback class="bg-muted text-muted-foreground">
                    <User class="size-8" />
                  </AvatarFallback>
                </Avatar>
                <div class="flex flex-col gap-1 max-sm:items-center">
                  <span class="text-lg font-semibold text-foreground">{{ user?.firstName }} {{ user?.lastName }}</span>
                  <span class="text-sm text-muted-foreground">{{ user?.email }}</span>
                  <span
                    class="mt-1 inline-block w-fit rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                    :style="{ backgroundColor: user?.role?.color || 'hsl(var(--primary))' }"
                  >
                    {{ user?.role?.nom || 'Non défini' }}
                  </span>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
                <div class="flex flex-col gap-1 rounded-md border bg-background p-3">
                  <span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Prénom</span>
                  <span class="text-sm font-medium text-foreground">{{ user?.firstName || '-' }}</span>
                </div>
                <div class="flex flex-col gap-1 rounded-md border bg-background p-3">
                  <span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Nom</span>
                  <span class="text-sm font-medium text-foreground">{{ user?.lastName || '-' }}</span>
                </div>
                <div class="flex flex-col gap-1 rounded-md border bg-background p-3">
                  <span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Email</span>
                  <span class="text-sm font-medium text-foreground">{{ user?.email || '-' }}</span>
                </div>
                <div class="flex flex-col gap-1 rounded-md border bg-background p-3">
                  <span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Rôle</span>
                  <span class="text-sm font-medium text-foreground">{{ user?.role?.nom || '-' }}</span>
                </div>
                <div class="flex flex-col gap-1 rounded-md border bg-background p-3">
                  <span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Compte actif</span>
                  <Badge
                    :variant="user?.isActive ? 'outline' : 'destructive'"
                    :class="user?.isActive ? 'border-green-500/50 text-green-600 dark:text-green-400' : ''"
                  >
                    {{ user?.isActive ? 'Oui' : 'Non' }}
                  </Badge>
                </div>
                <div class="flex flex-col gap-1 rounded-md border bg-background p-3">
                  <span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Email vérifié</span>
                  <Badge
                    :variant="user?.isMailVerified ? 'outline' : 'destructive'"
                    :class="user?.isMailVerified ? 'border-green-500/50 text-green-600 dark:text-green-400' : ''"
                  >
                    {{ user?.isMailVerified ? 'Oui' : 'Non' }}
                  </Badge>
                </div>
              </div>
            </div>

            <!-- Edit Mode -->
            <form v-else class="flex flex-col gap-4" @submit.prevent="handleProfileSubmit">
              <div class="flex flex-col gap-2">
                <label class="text-sm font-medium text-foreground">Photo de profil</label>
                <div class="flex justify-center">
                  <div v-if="avatarPreview || (profileForm.pictureUrl && !removePictureOnSave)" class="relative h-[120px] w-[150px]">
                    <img
                      :src="avatarPreview || profileForm.pictureUrl"
                      alt="Prévisualisation"
                      class="size-full rounded-md border object-cover"
                    />
                    <button
                      type="button"
                      class="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-destructive text-white transition-transform hover:scale-110 disabled:cursor-not-allowed disabled:opacity-50"
                      @click="handleRemovePicture"
                      :disabled="savingProfile"
                    >
                      <X class="size-3" />
                    </button>
                  </div>
                  <div v-else class="h-[120px] w-[150px]">
                    <FileDropzone
                      compact
                      accept="image/*"
                      :multiple="false"
                      :disabled="savingProfile"
                      :max-file-size="2097152"
                      placeholder-title="Ajouter une photo"
                      placeholder-subtitle=""
                      @files-selected="handleDropzoneFileSelect($event)"
                      @error="messages.error($event, 'Erreur')"
                    />
                  </div>
                </div>
                <p class="text-center text-xs text-muted-foreground">Formats acceptés : JPG, PNG, GIF. Taille max : 2 Mo</p>
              </div>

              <div class="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                <div class="flex flex-col gap-2">
                  <label for="firstName" class="text-sm font-medium text-foreground">Prénom *</label>
                  <Input
                    id="firstName"
                    type="text"
                    v-model="profileForm.firstName"
                    required
                    :disabled="savingProfile"
                    placeholder="Votre prénom"
                    :class="{ 'border-destructive': profileErrors.firstName }"
                  />
                  <span v-if="profileErrors.firstName" class="text-xs text-destructive">{{ profileErrors.firstName }}</span>
                </div>
                <div class="flex flex-col gap-2">
                  <label for="lastName" class="text-sm font-medium text-foreground">Nom *</label>
                  <Input
                    id="lastName"
                    type="text"
                    v-model="profileForm.lastName"
                    required
                    :disabled="savingProfile"
                    placeholder="Votre nom"
                    :class="{ 'border-destructive': profileErrors.lastName }"
                  />
                  <span v-if="profileErrors.lastName" class="text-xs text-destructive">{{ profileErrors.lastName }}</span>
                </div>
              </div>

              <div class="flex flex-col gap-2">
                <label class="text-sm font-medium text-foreground">Email</label>
                <div class="flex flex-col gap-1">
                  <span class="rounded-md border bg-muted px-3 py-2 text-sm font-medium text-foreground">{{ user?.email }}</span>
                  <span class="text-xs text-muted-foreground">L'adresse email ne peut pas être modifiée</span>
                </div>
              </div>

              <div class="flex flex-col gap-2">
                <label class="text-sm font-medium text-foreground">Rôle</label>
                <div class="flex flex-col gap-1">
                  <span
                    class="inline-block w-fit rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                    :style="{ backgroundColor: user?.role?.color || 'hsl(var(--primary))' }"
                  >
                    {{ user?.role?.nom || 'Non défini' }}
                  </span>
                  <span class="text-xs text-muted-foreground">Le rôle ne peut pas être modifié</span>
                </div>
              </div>

              <div class="mt-4 flex justify-end gap-3 border-t pt-4 max-sm:flex-col">
                <Button variant="outline" size="sm" @click="cancelEditingProfile" :disabled="savingProfile">
                  Annuler
                </Button>
                <Button type="submit" size="sm" :disabled="savingProfile">
                  <LoaderCircle v-if="savingProfile" class="size-3.5 animate-spin" />
                  <Check v-else class="size-3.5" />
                  Sauvegarder
                </Button>
              </div>
            </form>
          </section>

          <!-- Section 2: Notification Preferences -->
          <section class="rounded-lg border bg-card p-6 shadow-sm">
            <div class="mb-6 flex items-center justify-between border-b pb-4">
              <div class="flex items-center gap-3">
                <Bell class="size-5 text-primary" />
                <h2 class="text-lg font-semibold text-foreground">Préférences de notifications</h2>
              </div>
              <Button
                v-if="!isEditingNotifications"
                variant="ghost"
                size="sm"
                @click="startEditingNotifications"
              >
                <Pencil class="size-3.5" />
                Modifier
              </Button>
            </div>

            <!-- View Mode -->
            <div v-if="!isEditingNotifications" class="flex flex-col gap-4">
              <p class="text-sm text-muted-foreground">
                Vos préférences de notifications actuelles.
              </p>
              <div class="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
                <div class="flex flex-col gap-1 rounded-md border bg-background p-3">
                  <span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Acomptes</span>
                  <span class="text-sm font-medium text-foreground">{{ getNotificationLabel(notificationForm.acompte) }}</span>
                </div>
                <div class="flex flex-col gap-1 rounded-md border bg-background p-3">
                  <span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Absences</span>
                  <span class="text-sm font-medium text-foreground">{{ getNotificationLabel(notificationForm.absence) }}</span>
                </div>
                <div class="flex flex-col gap-1 rounded-md border bg-background p-3">
                  <span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Création d'utilisateur</span>
                  <span class="text-sm font-medium text-foreground">{{ getNotificationLabel(notificationForm.userCreated) }}</span>
                </div>
                <div class="flex flex-col gap-1 rounded-md border bg-background p-3">
                  <span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Rapports véhicule</span>
                  <span class="text-sm font-medium text-foreground">{{ getNotificationLabel(notificationForm.rapportVehicule) }}</span>
                </div>
                <div class="flex flex-col gap-1 rounded-md border bg-background p-3">
                  <span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Todos</span>
                  <span class="text-sm font-medium text-foreground">{{ getNotificationLabel(notificationForm.todo) }}</span>
                </div>
              </div>
            </div>

            <!-- Edit Mode -->
            <form v-else class="flex flex-col gap-4" @submit.prevent="handleNotificationSubmit">
              <p class="text-sm text-muted-foreground">
                Choisissez comment vous souhaitez être notifié pour chaque type d'événement.
              </p>

              <div class="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                <Select
                  v-model="notificationFormEdit.acompte"
                  label="Acomptes"
                  :options="notificationOptions"
                  hint="Notifications pour les demandes d'acompte"
                />
                <Select
                  v-model="notificationFormEdit.absence"
                  label="Absences"
                  :options="notificationOptions"
                  hint="Notifications pour les demandes d'absence"
                />
                <Select
                  v-model="notificationFormEdit.userCreated"
                  label="Création d'utilisateur"
                  :options="notificationOptions"
                  hint="Notifications lors de la création d'un nouvel utilisateur"
                />
                <Select
                  v-model="notificationFormEdit.rapportVehicule"
                  label="Rapports véhicule"
                  :options="notificationOptions"
                  hint="Notifications pour les rapports de véhicule"
                />
                <Select
                  v-model="notificationFormEdit.todo"
                  label="Todos"
                  :options="notificationOptions"
                  hint="Notifications pour les tâches assignées"
                />
              </div>

              <div class="mt-4 flex justify-end gap-3 border-t pt-4 max-sm:flex-col">
                <Button variant="outline" size="sm" @click="cancelEditingNotifications" :disabled="savingNotifications">
                  Annuler
                </Button>
                <Button type="submit" size="sm" :disabled="savingNotifications">
                  <LoaderCircle v-if="savingNotifications" class="size-3.5 animate-spin" />
                  <Check v-else class="size-3.5" />
                  Sauvegarder
                </Button>
              </div>
            </form>
          </section>

          <!-- Section 3: Security -->
          <section class="rounded-lg border bg-card p-6 shadow-sm">
            <div class="mb-6 flex items-center justify-between border-b pb-4">
              <div class="flex items-center gap-3">
                <Lock class="size-5 text-primary" />
                <h2 class="text-lg font-semibold text-foreground">Sécurité</h2>
              </div>
              <Button
                v-if="!isEditingPassword"
                variant="ghost"
                size="sm"
                @click="startEditingPassword"
              >
                <KeyRound class="size-3.5" />
                Changer le mot de passe
              </Button>
            </div>

            <!-- View Mode -->
            <div v-if="!isEditingPassword" class="flex flex-col gap-4">
              <div class="flex items-center gap-4 rounded-md border bg-background p-4">
                <ShieldCheck class="size-6 shrink-0 text-green-600 dark:text-green-400" />
                <p class="text-sm text-muted-foreground">Votre mot de passe est sécurisé. Cliquez sur "Changer le mot de passe" pour le modifier.</p>
              </div>
            </div>

            <!-- Edit Mode -->
            <form v-else class="flex flex-col gap-4" @submit.prevent="handlePasswordSubmit">
              <div class="flex flex-col gap-2">
                <label for="currentPassword" class="text-sm font-medium text-foreground">Mot de passe actuel *</label>
                <div class="relative">
                  <Input
                    id="currentPassword"
                    :type="showCurrentPassword ? 'text' : 'password'"
                    v-model="passwordForm.currentPassword"
                    required
                    :disabled="savingPassword"
                    placeholder="Entrez votre mot de passe actuel"
                    class="pr-10"
                    :class="{ 'border-destructive': passwordErrors.currentPassword }"
                  />
                  <button
                    type="button"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    @click="showCurrentPassword = !showCurrentPassword"
                    tabindex="-1"
                  >
                    <EyeOff v-if="showCurrentPassword" class="size-4" />
                    <Eye v-else class="size-4" />
                  </button>
                </div>
                <span v-if="passwordErrors.currentPassword" class="text-xs text-destructive">{{ passwordErrors.currentPassword }}</span>
              </div>

              <div class="flex flex-col gap-2">
                <label for="newPassword" class="text-sm font-medium text-foreground">Nouveau mot de passe *</label>
                <div class="relative">
                  <Input
                    id="newPassword"
                    :type="showNewPassword ? 'text' : 'password'"
                    v-model="passwordForm.newPassword"
                    required
                    :disabled="savingPassword"
                    placeholder="Entrez votre nouveau mot de passe"
                    class="pr-10"
                    :class="{ 'border-destructive': passwordErrors.newPassword }"
                  />
                  <button
                    type="button"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    @click="showNewPassword = !showNewPassword"
                    tabindex="-1"
                  >
                    <EyeOff v-if="showNewPassword" class="size-4" />
                    <Eye v-else class="size-4" />
                  </button>
                </div>
                <span class="text-xs text-muted-foreground">Minimum 8 caractères</span>
                <span v-if="passwordErrors.newPassword" class="text-xs text-destructive">{{ passwordErrors.newPassword }}</span>
              </div>

              <div class="flex flex-col gap-2">
                <label for="confirmPassword" class="text-sm font-medium text-foreground">Confirmer le mot de passe *</label>
                <div class="relative">
                  <Input
                    id="confirmPassword"
                    :type="showConfirmPassword ? 'text' : 'password'"
                    v-model="passwordForm.confirmPassword"
                    required
                    :disabled="savingPassword"
                    placeholder="Confirmez votre nouveau mot de passe"
                    class="pr-10"
                    :class="{ 'border-destructive': passwordErrors.confirmPassword }"
                  />
                  <button
                    type="button"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    @click="showConfirmPassword = !showConfirmPassword"
                    tabindex="-1"
                  >
                    <EyeOff v-if="showConfirmPassword" class="size-4" />
                    <Eye v-else class="size-4" />
                  </button>
                </div>
                <span v-if="passwordErrors.confirmPassword" class="text-xs text-destructive">{{ passwordErrors.confirmPassword }}</span>
              </div>

              <div class="mt-4 flex justify-end gap-3 border-t pt-4 max-sm:flex-col">
                <Button variant="outline" size="sm" @click="cancelEditingPassword" :disabled="savingPassword">
                  Annuler
                </Button>
                <Button type="submit" size="sm" :disabled="savingPassword">
                  <LoaderCircle v-if="savingPassword" class="size-3.5 animate-spin" />
                  <KeyRound v-else class="size-3.5" />
                  Changer le mot de passe
                </Button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { profileService, usersService } from '@/services'
import { useMessages } from '@/composables/useMessages'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { FileDropzone } from '@/components/ui/file-dropzone'
import {
  ArrowLeft,
  LoaderCircle,
  User,
  Pencil,
  Bell,
  Lock,
  ShieldCheck,
  KeyRound,
  X,
  Check,
  Eye,
  EyeOff,
} from 'lucide-vue-next'
import type { UserDTO, NotificationPreferencesDTO, NotificationChannel } from '@/models'

const authStore = useAuthStore()
const messages = useMessages()

// State
const user = ref<UserDTO | null>(null)
const loading = ref(true)
const error = ref('')

// Edit modes
const isEditingProfile = ref(false)
const isEditingNotifications = ref(false)
const isEditingPassword = ref(false)

// Profile form
const profileForm = reactive({
  firstName: '',
  lastName: '',
  picture: '',
  pictureUrl: ''
})
const profileErrors = reactive({
  firstName: '',
  lastName: '',
  picture: ''
})
const savingProfile = ref(false)

// File upload
const fileInputRef = ref<HTMLInputElement | null>(null)
const selectedFileName = ref('')
const avatarPreview = ref('')
const removePictureOnSave = ref(false)

// Notification form (view state)
const notificationForm = reactive<NotificationPreferencesDTO>({
  acompte: 'SITE',
  absence: 'SITE',
  userCreated: 'SITE',
  rapportVehicule: 'SITE',
  todo: 'SITE'
})

// Notification form (edit state)
const notificationFormEdit = reactive<NotificationPreferencesDTO>({
  acompte: 'SITE',
  absence: 'SITE',
  userCreated: 'SITE',
  rapportVehicule: 'SITE',
  todo: 'SITE'
})
const savingNotifications = ref(false)

// Password form
const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})
const passwordErrors = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})
const savingPassword = ref(false)

// Password visibility toggles
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

// Notification options
const notificationOptions = [
  { value: 'SITE', label: 'Notification' },
  { value: 'EMAIL', label: 'Notification et Email' },
  { value: 'NONE', label: 'Aucune notification' }
]

// Get notification label
const getNotificationLabel = (value?: string): string => {
  const option = notificationOptions.find(opt => opt.value === value)
  return option?.label || 'Non défini'
}

// Load profile data
const loadProfile = async () => {
  try {
    loading.value = true
    error.value = ''

    // L'API retourne directement le UserDTO (pas de wrapper data)
    const profile = await profileService.getProfile()
    user.value = profile ?? null

    if (user.value) {
      // Load notification preferences
      if (user.value.notificationPreferences) {
        notificationForm.acompte = user.value.notificationPreferences.acompte || 'SITE'
        notificationForm.absence = user.value.notificationPreferences.absence || 'SITE'
        notificationForm.userCreated = user.value.notificationPreferences.userCreated || 'SITE'
        notificationForm.rapportVehicule = user.value.notificationPreferences.rapportVehicule || 'SITE'
        notificationForm.todo = user.value.notificationPreferences.todo || 'SITE'
      }
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Erreur lors du chargement du profil'
  } finally {
    loading.value = false
  }
}

// Load notification preferences separately if not in profile
const loadNotificationPreferences = async () => {
  try {
    const response = await usersService.getMyNotificationPreferences()
    const prefs = response.data

    if (prefs) {
      notificationForm.acompte = prefs.acompte || 'SITE'
      notificationForm.absence = prefs.absence || 'SITE'
      notificationForm.userCreated = prefs.userCreated || 'SITE'
      notificationForm.rapportVehicule = prefs.rapportVehicule || 'SITE'
      notificationForm.todo = prefs.todo || 'SITE'
    }
  } catch (err) {
    console.error('Error loading notification preferences:', err)
  }
}
const handleDropzoneFileSelect = (files: FileList) => {
  const file = files[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    messages.error('Veuillez selectionner une image valide', 'Erreur')
    return
  }

  selectedFileName.value = file.name
  removePictureOnSave.value = false

  const reader = new FileReader()
  reader.onload = (e) => {
    const base64 = e.target?.result as string
    avatarPreview.value = base64
    profileForm.picture = base64
  }
  reader.onerror = () => {
    messages.error('Erreur lors de la lecture du fichier', 'Erreur')
  }
  reader.readAsDataURL(file)
}

// Clear selected file (reset file input only)
const clearSelectedFile = () => {
  selectedFileName.value = ''
  avatarPreview.value = ''
  profileForm.picture = ''
  removePictureOnSave.value = false
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

// Handle remove picture button click
const handleRemovePicture = () => {
  // Si on a une nouvelle photo sélectionnée, on la retire juste
  if (avatarPreview.value) {
    selectedFileName.value = ''
    avatarPreview.value = ''
    profileForm.picture = ''
    if (fileInputRef.value) {
      fileInputRef.value.value = ''
    }
  } else {
    // Sinon on marque la photo existante pour suppression
    removePictureOnSave.value = true
  }
}

// Start editing profile
const startEditingProfile = () => {
  profileForm.firstName = user.value?.firstName || ''
  profileForm.lastName = user.value?.lastName || ''
  profileForm.pictureUrl = user.value?.pictureUrl || ''
  profileForm.picture = ''
  profileErrors.firstName = ''
  profileErrors.lastName = ''
  profileErrors.picture = ''
  selectedFileName.value = ''
  avatarPreview.value = ''
  removePictureOnSave.value = false
  isEditingProfile.value = true
}

// Cancel editing profile
const cancelEditingProfile = () => {
  isEditingProfile.value = false
  clearSelectedFile()
}

// Start editing notifications
const startEditingNotifications = () => {
  notificationFormEdit.acompte = notificationForm.acompte
  notificationFormEdit.absence = notificationForm.absence
  notificationFormEdit.userCreated = notificationForm.userCreated
  notificationFormEdit.rapportVehicule = notificationForm.rapportVehicule
  notificationFormEdit.todo = notificationForm.todo
  isEditingNotifications.value = true
}

// Cancel editing notifications
const cancelEditingNotifications = () => {
  isEditingNotifications.value = false
}

// Start editing password
const startEditingPassword = () => {
  passwordForm.currentPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
  passwordErrors.currentPassword = ''
  passwordErrors.newPassword = ''
  passwordErrors.confirmPassword = ''
  isEditingPassword.value = true
}

// Cancel editing password
const cancelEditingPassword = () => {
  isEditingPassword.value = false
}

// Validate profile form
const validateProfile = (): boolean => {
  let isValid = true
  profileErrors.firstName = ''
  profileErrors.lastName = ''

  if (!profileForm.firstName.trim()) {
    profileErrors.firstName = 'Le prénom est requis'
    isValid = false
  }

  if (!profileForm.lastName.trim()) {
    profileErrors.lastName = 'Le nom est requis'
    isValid = false
  }

  return isValid
}

// Validate password form
const validatePassword = (): boolean => {
  let isValid = true
  passwordErrors.currentPassword = ''
  passwordErrors.newPassword = ''
  passwordErrors.confirmPassword = ''

  if (!passwordForm.currentPassword) {
    passwordErrors.currentPassword = 'Le mot de passe actuel est requis'
    isValid = false
  }

  if (!passwordForm.newPassword) {
    passwordErrors.newPassword = 'Le nouveau mot de passe est requis'
    isValid = false
  } else if (passwordForm.newPassword.length < 8) {
    passwordErrors.newPassword = 'Le mot de passe doit contenir au moins 8 caractères'
    isValid = false
  }

  if (!passwordForm.confirmPassword) {
    passwordErrors.confirmPassword = 'La confirmation est requise'
    isValid = false
  } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    passwordErrors.confirmPassword = 'Les mots de passe ne correspondent pas'
    isValid = false
  }

  return isValid
}

// Handle profile submit
const handleProfileSubmit = async () => {
  if (!validateProfile()) return

  try {
    savingProfile.value = true

    // Détermine la valeur de picture à envoyer :
    // - Si nouvelle photo : envoie le base64
    // - Si suppression demandée : envoie "" pour supprimer
    // - Sinon : undefined (pas de changement)
    let pictureValue: string | undefined = undefined
    if (profileForm.picture) {
      pictureValue = profileForm.picture
    } else if (removePictureOnSave.value) {
      pictureValue = ''
    }

    await profileService.updateProfile({
      firstName: profileForm.firstName,
      lastName: profileForm.lastName,
      picture: pictureValue
    })

    // Refresh auth store
    await authStore.refreshUser()

    // Update local user data
    if (authStore.user) {
      user.value = authStore.user
    }

    isEditingProfile.value = false
    clearSelectedFile()
    messages.success('Profil mis à jour avec succès', 'Succès')
  } catch (err) {
    messages.error(
      err instanceof Error ? err.message : 'Erreur lors de la mise à jour du profil',
      'Erreur'
    )
  } finally {
    savingProfile.value = false
  }
}

// Handle notification submit
const handleNotificationSubmit = async () => {
  try {
    savingNotifications.value = true

    await usersService.updateMyNotificationPreferences({
      acompte: notificationFormEdit.acompte as NotificationChannel,
      absence: notificationFormEdit.absence as NotificationChannel,
      userCreated: notificationFormEdit.userCreated as NotificationChannel,
      rapportVehicule: notificationFormEdit.rapportVehicule as NotificationChannel,
      todo: notificationFormEdit.todo as NotificationChannel
    })

    // Update view state
    notificationForm.acompte = notificationFormEdit.acompte
    notificationForm.absence = notificationFormEdit.absence
    notificationForm.userCreated = notificationFormEdit.userCreated
    notificationForm.rapportVehicule = notificationFormEdit.rapportVehicule
    notificationForm.todo = notificationFormEdit.todo

    isEditingNotifications.value = false
    messages.success('Préférences de notifications mises à jour', 'Succès')
  } catch (err) {
    messages.error(
      err instanceof Error ? err.message : 'Erreur lors de la mise à jour des préférences',
      'Erreur'
    )
  } finally {
    savingNotifications.value = false
  }
}

// Handle password submit
const handlePasswordSubmit = async () => {
  if (!validatePassword()) return

  try {
    savingPassword.value = true

    await profileService.changePassword({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword
    })

    isEditingPassword.value = false
    messages.success('Mot de passe modifié avec succès', 'Succès')
  } catch (err) {
    messages.error(
      err instanceof Error ? err.message : 'Erreur lors du changement de mot de passe',
      'Erreur'
    )
  } finally {
    savingPassword.value = false
  }
}

onMounted(async () => {
  await loadProfile()
  // Load notification preferences if not already included in profile
  if (!user.value?.notificationPreferences) {
    await loadNotificationPreferences()
  }
})
</script>
