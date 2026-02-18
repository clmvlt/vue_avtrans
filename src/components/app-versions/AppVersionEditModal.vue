<template>
  <Dialog :open="modelValue" @update:open="handleOpenChange">
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Modifier la version</DialogTitle>
        <DialogDescription>Modifiez les informations de la version.</DialogDescription>
      </DialogHeader>

      <div v-if="loading" class="flex flex-col items-center justify-center gap-4 py-12">
        <LoaderCircle class="size-10 animate-spin text-primary" />
        <p class="text-muted-foreground">Chargement...</p>
      </div>

      <form v-else @submit.prevent="handleSubmit" class="space-y-4">
        <div v-if="error" class="flex items-center gap-2 rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle class="size-4 shrink-0" />
          {{ error }}
        </div>

        <!-- Informations en lecture seule -->
        <div class="grid grid-cols-2 gap-4 rounded-lg border bg-muted/50 p-4">
          <div class="space-y-1">
            <p class="text-xs text-muted-foreground">Version</p>
            <p class="text-sm font-medium text-foreground">{{ versionData?.versionName }} (Build {{ versionData?.versionCode }})</p>
          </div>
          <div class="space-y-1">
            <p class="text-xs text-muted-foreground">Fichier</p>
            <p class="break-words text-sm font-medium text-foreground">{{ versionData?.originalFileName }}</p>
          </div>
          <div class="space-y-1">
            <p class="text-xs text-muted-foreground">Taille</p>
            <p class="text-sm font-medium text-foreground">{{ formatFileSize(versionData?.fileSize || 0) }}</p>
          </div>
          <div class="space-y-1">
            <p class="text-xs text-muted-foreground">Téléchargements</p>
            <p class="text-sm font-medium text-foreground">{{ versionData?.downloadCount || 0 }}</p>
          </div>
          <div class="space-y-1">
            <p class="text-xs text-muted-foreground">Créé le</p>
            <p class="text-sm font-medium text-foreground">{{ formatDate(versionData?.createdAt) }}</p>
          </div>
          <div class="space-y-1">
            <p class="text-xs text-muted-foreground">Créé par</p>
            <p class="text-sm font-medium text-foreground">{{ versionData?.createdByName || '-' }}</p>
          </div>
        </div>

        <!-- Statut actif -->
        <div class="flex items-center gap-2">
          <Checkbox
            id="editIsActive"
            :checked="formData.isActive"
            :disabled="saving"
            @update:checked="formData.isActive = $event as boolean"
          />
          <div>
            <label for="editIsActive" class="text-sm font-medium text-foreground cursor-pointer">Version active</label>
            <p class="text-xs text-muted-foreground">Les versions inactives ne sont pas visibles publiquement</p>
          </div>
        </div>

        <!-- Changelog -->
        <div class="space-y-2">
          <label for="editChangelog" class="text-sm font-medium text-foreground">Notes de version</label>
          <Textarea
            id="editChangelog"
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
          <Button type="submit" :disabled="saving">
            <LoaderCircle v-if="saving" class="size-4 animate-spin" />
            Enregistrer
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { appVersionsService } from '@/services'
import { useMessages } from '@/composables/useMessages'
import type { AppVersionDTO } from '@/models'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { AlertCircle, LoaderCircle } from 'lucide-vue-next'

interface Props {
  modelValue: boolean
  versionId?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  versionId: null
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'saved': [version: AppVersionDTO]
  'close': []
}>()

const messages = useMessages()

// États
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const versionData = ref<AppVersionDTO | null>(null)

// Données du formulaire
const formData = ref({
  changelog: '',
  isActive: true
})

// Charger les données quand le modal s'ouvre
watch(() => props.modelValue, async (isOpen) => {
  if (isOpen && props.versionId) {
    await loadVersionData()
  }
}, { immediate: true })

// Charger les données de la version
const loadVersionData = async () => {
  if (!props.versionId) return

  try {
    loading.value = true
    error.value = ''

    const response = await appVersionsService.getVersionById(props.versionId)

    if (response.success && response.version) {
      versionData.value = response.version
      formData.value = {
        changelog: response.version.changelog || '',
        isActive: response.version.isActive
      }
    } else {
      throw new Error('Version non trouvée')
    }
  } catch (err: unknown) {
    if (err instanceof Error) {
      error.value = err.message
    } else {
      error.value = 'Erreur lors du chargement de la version'
    }
  } finally {
    loading.value = false
  }
}

// Formater la taille du fichier
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1048576).toFixed(1) + ' MB'
}

// Formater une date
const formatDate = (dateString?: string) => {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return '-'

    return date.toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return '-'
  }
}

// Soumettre le formulaire
const handleSubmit = async () => {
  if (!props.versionId) return

  error.value = ''

  try {
    saving.value = true

    const response = await appVersionsService.updateVersion(props.versionId, {
      changelog: formData.value.changelog || undefined,
      isActive: formData.value.isActive
    })

    if (response.success && response.version) {
      emit('saved', response.version)
      messages.success('Version modifiée avec succès !', 'Succès')
      handleClose()
    } else {
      throw new Error(response.message || 'Erreur lors de la modification')
    }
  } catch (err: unknown) {
    if (err instanceof Error) {
      error.value = err.message
    } else {
      error.value = 'Erreur lors de la modification de la version'
    }
    messages.error(error.value, 'Erreur')
  } finally {
    saving.value = false
  }
}

// Fermer le modal
const handleClose = () => {
  emit('update:modelValue', false)
  emit('close')
}

// Gérer le changement d'état du Dialog
const handleOpenChange = (open: boolean) => {
  if (!open && !saving.value) {
    handleClose()
  }
}
</script>
