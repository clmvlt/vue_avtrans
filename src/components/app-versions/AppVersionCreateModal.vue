<template>
  <Dialog :open="modelValue" @update:open="handleOpenChange">
    <DialogContent class="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Nouvelle version</DialogTitle>
        <DialogDescription>Uploadez un fichier APK et renseignez les informations de la version.</DialogDescription>
      </DialogHeader>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div v-if="error" class="flex items-center gap-2 rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle class="size-4 shrink-0" />
          {{ error }}
        </div>

        <!-- Upload de fichier APK -->
        <div class="space-y-2">
          <label class="text-sm font-medium text-foreground">Fichier APK <span class="text-destructive">*</span></label>
          <div v-if="!selectedFile">
            <FileDropzone
              accept=".apk"
              :multiple="false"
              :disabled="saving || isReading"
              :uploading="isReading"
              :upload-progress="readProgress"
              upload-current-file="Lecture du fichier..."
              placeholder-title="Glissez-deposez votre fichier APK ici"
              placeholder-subtitle="ou cliquez pour parcourir"
              hint="Fichiers .apk uniquement"
              @files-selected="handleDropzoneFiles($event)"
              @error="error = $event"
            />
          </div>
          <div v-else class="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
            <FileIcon class="size-5 text-primary" />
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-foreground">{{ selectedFile.name }}</p>
              <p class="text-xs text-muted-foreground">{{ formatFileSize(selectedFile.size) }}</p>
            </div>
            <Button type="button" variant="ghost" size="icon-sm" @click.stop="removeFile" :disabled="saving || isReading">
              <X class="size-4" />
            </Button>
          </div>
        </div>

        <!-- Version Code -->
        <div class="space-y-2">
          <label for="versionCode" class="text-sm font-medium text-foreground">Code de version <span class="text-destructive">*</span></label>
          <Input
            id="versionCode"
            v-model.number="formData.versionCode"
            type="number"
            placeholder="10"
            required
            :disabled="saving"
          />
          <p class="text-xs text-muted-foreground">Numéro incrémental unique (ex: 10, 11, 12...)</p>
        </div>

        <!-- Version Name -->
        <div class="space-y-2">
          <label for="versionName" class="text-sm font-medium text-foreground">Nom de version <span class="text-destructive">*</span></label>
          <Input
            id="versionName"
            v-model="formData.versionName"
            type="text"
            placeholder="1.2.3"
            required
            :disabled="saving"
          />
          <p class="text-xs text-muted-foreground">Format sémantique (ex: 1.2.3)</p>
        </div>

        <!-- Changelog -->
        <div class="space-y-2">
          <label for="changelog" class="text-sm font-medium text-foreground">Notes de version</label>
          <Textarea
            id="changelog"
            v-model="formData.changelog"
            placeholder="Décrivez les changements de cette version..."
            :rows="4"
            :disabled="saving"
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" @click="handleClose" :disabled="saving">
            Annuler
          </Button>
          <Button type="submit" :disabled="saving || isReading || !isFormValid">
            <LoaderCircle v-if="saving" class="size-4 animate-spin" />
            Créer la version
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { appVersionsService } from '@/services'
import { useMessages } from '@/composables/useMessages'
import { FileDropzone } from '@/components/ui/file-dropzone'
import type { AppVersionDTO } from '@/models'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { AlertCircle, FileIcon, X, LoaderCircle } from 'lucide-vue-next'

interface Props {
  modelValue: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'saved': [version: AppVersionDTO]
  'close': []
}>()

const messages = useMessages()

// États
const saving = ref(false)
const isReading = ref(false)
const readProgress = ref(0)
const error = ref('')
const selectedFile = ref<File | null>(null)
const apkBase64 = ref('')

// Données du formulaire
const formData = ref({
  versionCode: 1,
  versionName: '',
  changelog: ''
})

// Validation du formulaire
const isFormValid = computed(() => {
  return selectedFile.value !== null &&
    apkBase64.value !== '' &&
    formData.value.versionCode > 0 &&
    formData.value.versionName.trim() !== ''
})

// Reset quand le modal s'ouvre
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    resetForm()
  }
})

// Gérer les fichiers du FileDropzone
const handleDropzoneFiles = (files: FileList) => {
  const file = files[0]
  if (file) {
    if (file.name.endsWith('.apk')) {
      processFile(file)
    } else {
      error.value = 'Veuillez sélectionner un fichier APK'
    }
  }
}

// Traiter le fichier sélectionné
const processFile = async (file: File) => {
  selectedFile.value = file
  error.value = ''
  apkBase64.value = ''

  try {
    isReading.value = true
    readProgress.value = 0

    apkBase64.value = await readFileAsBase64(file)
  } catch {
    error.value = 'Erreur lors de la lecture du fichier'
    selectedFile.value = null
    apkBase64.value = ''
  } finally {
    isReading.value = false
  }
}

// Lire le fichier en base64 avec progression
const readFileAsBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        readProgress.value = Math.round((event.loaded / event.total) * 100)
      }
    }

    reader.onload = () => {
      const result = reader.result as string
      const base64 = result.split(',')[1]
      resolve(base64 || '')
    }

    reader.onerror = () => {
      reject(new Error('Erreur de lecture du fichier'))
    }

    reader.readAsDataURL(file)
  })
}

// Supprimer le fichier sélectionné
const removeFile = () => {
  selectedFile.value = null
  apkBase64.value = ''
  readProgress.value = 0
}

// Formater la taille du fichier
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1048576).toFixed(1) + ' MB'
}

// Soumettre le formulaire
const handleSubmit = async () => {
  if (!isFormValid.value || !selectedFile.value) return

  error.value = ''

  try {
    saving.value = true

    const response = await appVersionsService.createVersion({
      apkB64: apkBase64.value,
      versionCode: formData.value.versionCode,
      versionName: formData.value.versionName,
      originalFileName: selectedFile.value.name,
      changelog: formData.value.changelog || undefined
    })

    if (response.success && response.version) {
      emit('saved', response.version)
      messages.success('Version créée avec succès !', 'Succès')
      handleClose()
    } else {
      throw new Error(response.message || 'Erreur lors de la création')
    }
  } catch (err: unknown) {
    if (err instanceof Error) {
      error.value = err.message
    } else {
      error.value = 'Erreur lors de la création de la version'
    }
    messages.error(error.value, 'Erreur')
  } finally {
    saving.value = false
  }
}

// Réinitialiser le formulaire
const resetForm = () => {
  formData.value = {
    versionCode: 1,
    versionName: '',
    changelog: ''
  }
  selectedFile.value = null
  apkBase64.value = ''
  readProgress.value = 0
  error.value = ''
}

// Fermer le modal
const handleClose = () => {
  emit('update:modelValue', false)
  emit('close')
}

// Gérer le changement d'état du Dialog
const handleOpenChange = (open: boolean) => {
  if (!open && !saving.value && !isReading.value) {
    handleClose()
  }
}
</script>
