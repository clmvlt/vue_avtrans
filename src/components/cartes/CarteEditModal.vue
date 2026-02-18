<template>
  <Dialog v-model:open="localOpen">
    <DialogContent class="sm:max-w-lg" @interact-outside.prevent>
      <DialogHeader>
        <DialogTitle>{{ isCreating ? 'Créer une carte' : 'Modifier la carte' }}</DialogTitle>
        <DialogDescription>
          {{ isCreating ? 'Ajouter une nouvelle carte au système' : 'Modifier les informations de la carte' }}
        </DialogDescription>
      </DialogHeader>

      <div v-if="loading" class="flex flex-col items-center justify-center gap-4 py-12">
        <LoaderCircle class="size-10 animate-spin text-primary" />
        <p class="text-lg text-muted-foreground">Chargement...</p>
      </div>

      <form v-else @submit.prevent="handleSubmit" class="space-y-4">
        <div v-if="error" class="flex items-center gap-2 rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle class="size-4 shrink-0" />
          {{ error }}
        </div>

        <div class="flex flex-col gap-2">
          <label for="carteNom" class="text-sm font-medium text-foreground">Nom de la carte *</label>
          <Input
            id="carteNom"
            v-model="formData.nom"
            type="text"
            placeholder="Ex: Carte entreprise principale"
            required
            :disabled="saving"
          />
        </div>

        <div class="flex flex-col gap-2">
          <label for="carteDescription" class="text-sm font-medium text-foreground">Description</label>
          <Input
            id="carteDescription"
            v-model="formData.description"
            type="text"
            placeholder="Description de la carte (optionnel)"
            :disabled="saving"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-2">
            <label for="carteNumero" class="text-sm font-medium text-foreground">Numéro de carte</label>
            <Input
              id="carteNumero"
              v-model="formData.numero"
              type="text"
              placeholder="4111 1111 1111 1111"
              :disabled="saving"
            />
            <p class="text-xs text-muted-foreground">Numéro complet de la carte (optionnel)</p>
          </div>

          <div class="flex flex-col gap-2">
            <label for="carteCode" class="text-sm font-medium text-foreground">Code PIN *</label>
            <Input
              id="carteCode"
              v-model="formData.code"
              type="password"
              placeholder="****"
              required
              :disabled="saving"
            />
            <p class="text-xs text-muted-foreground">Code à 4 chiffres</p>
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-foreground">Type de carte *</label>
          <Select
            :model-value="formData.typeCarteUuid || ''"
            :options="typeCarteOptions"
            placeholder="Sélectionner un type"
            :disabled="saving"
            :required="true"
            search-placeholder="Rechercher un type..."
            no-results-text="Aucun type trouvé"
            @update:model-value="(v: string) => formData.typeCarteUuid = v"
          />
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-foreground">Utilisateur associé</label>
          <Select
            :model-value="formData.userUuid || ''"
            :options="userOptions"
            placeholder="Sélectionner un utilisateur (optionnel)"
            :disabled="saving"
            search-placeholder="Rechercher un utilisateur..."
            no-results-text="Aucun utilisateur trouvé"
            :clearable="true"
            @update:model-value="(v: string) => formData.userUuid = v || undefined"
          />
        </div>

        <!-- Section informations en lecture seule (uniquement en mode édition) -->
        <div v-if="carteData && !isCreating" class="rounded-md border bg-muted/50 p-4">
          <h4 class="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Informations système</h4>
          <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-col gap-1">
              <span class="text-xs text-muted-foreground">UUID</span>
              <span class="break-all font-mono text-xs text-muted-foreground">{{ carteData.uuid }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-xs text-muted-foreground">Créé le</span>
              <span class="text-sm font-medium text-foreground">{{ formatDate(carteData.createdAt) }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-xs text-muted-foreground">Modifié le</span>
              <span class="text-sm font-medium text-foreground">{{ formatDate(carteData.updatedAt) }}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" @click="handleClose" :disabled="saving">
            Annuler
          </Button>
          <Button type="submit" :disabled="saving || !isFormValid">
            <LoaderCircle v-if="saving" class="size-4 animate-spin mr-2" />
            {{ isCreating ? 'Créer' : 'Enregistrer' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { cartesService, typeCartesService, usersService } from '@/services'
import { useMessages } from '@/composables/useMessages'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { LoaderCircle, AlertCircle } from 'lucide-vue-next'
import type { CarteDTO, CarteCreateRequest, CarteUpdateRequest, TypeCarteDTO, UserDTO } from '@/models'

interface Props {
  modelValue: boolean
  carteUuid?: string | null
  isCreating?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  carteUuid: null,
  isCreating: false
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'saved': [carte: CarteDTO]
  'close': []
}>()

const messages = useMessages()

// Local open state synced with modelValue
const localOpen = computed({
  get: () => props.modelValue,
  set: (val: boolean) => {
    if (!val) handleClose()
  }
})

// États
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const carteData = ref<CarteDTO | null>(null)

// Données pour les selects
const typeCartes = ref<TypeCarteDTO[]>([])
const users = ref<UserDTO[]>([])

// Données du formulaire
const formData = ref({
  nom: '',
  description: '',
  code: '',
  numero: '',
  userUuid: '' as string | undefined,
  typeCarteUuid: '' as string | undefined
})

// Options pour les selects
const typeCarteOptions = computed(() => {
  return typeCartes.value.map(type => ({
    value: type.uuid || '',
    label: type.nom || 'Type inconnu'
  }))
})

const userOptions = computed(() => {
  return users.value.map(user => ({
    value: user.uuid || '',
    label: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Utilisateur inconnu'
  }))
})

// Validation
const isFormValid = computed(() => {
  return (
    formData.value.nom.trim().length >= 2 &&
    formData.value.code.trim().length >= 4 &&
    !!formData.value.typeCarteUuid
  )
})

// Charger les données de référence
const loadReferenceData = async () => {
  try {
    const [typesResponse, usersResponse] = await Promise.all([
      typeCartesService.getTypeCartes(),
      usersService.getUsers()
    ])

    typeCartes.value = Array.isArray(typesResponse) ? typesResponse : []

    // L'API peut retourner { data: UserDTO[] } ou directement UserDTO[]
    const usersData = (usersResponse as any).data || usersResponse
    users.value = Array.isArray(usersData) ? usersData : []
  } catch {
    // Ignorer les erreurs de chargement des données de référence
  }
}

// Charger les données quand le modal s'ouvre
watch(() => props.modelValue, async (isOpen) => {
  if (isOpen) {
    resetForm()
    await loadReferenceData()
    if (props.carteUuid && !props.isCreating) {
      await loadCarteData()
    }
  }
}, { immediate: true })

// Charger les données de la carte
const loadCarteData = async () => {
  if (!props.carteUuid) return

  try {
    loading.value = true
    error.value = ''

    const response = await cartesService.getCarteById(props.carteUuid)
    const carte = response as CarteDTO

    if (carte && carte.uuid) {
      carteData.value = carte
      formData.value = {
        nom: carte.nom || '',
        description: carte.description || '',
        code: carte.code || '',
        numero: carte.numero || '',
        userUuid: carte.userUuid || carte.user?.uuid || '',
        typeCarteUuid: carte.typeCarteUuid || carte.typeCarte?.uuid || ''
      }
    } else {
      error.value = 'Carte non trouvée'
    }
  } catch (err: any) {
    error.value = err.message || 'Erreur lors du chargement de la carte'
  } finally {
    loading.value = false
  }
}

// Réinitialiser le formulaire
const resetForm = () => {
  formData.value = {
    nom: '',
    description: '',
    code: '',
    numero: '',
    userUuid: '',
    typeCarteUuid: ''
  }
  carteData.value = null
  error.value = ''
}

// Soumettre le formulaire
const handleSubmit = async () => {
  if (!isFormValid.value) return

  error.value = ''

  try {
    saving.value = true

    // typeCarteUuid est requis, validé par isFormValid
    if (!formData.value.typeCarteUuid) {
      throw new Error('Le type de carte est obligatoire')
    }

    if (props.isCreating) {
      const createData: CarteCreateRequest = {
        nom: formData.value.nom.trim(),
        code: formData.value.code.trim(),
        typeCarteUuid: formData.value.typeCarteUuid,
        description: formData.value.description.trim() || undefined,
        numero: formData.value.numero.trim() || undefined,
        userUuid: formData.value.userUuid || undefined
      }
      const response = await cartesService.createCarte(createData)
      emit('saved', response.carte)
      messages.success('Carte créée avec succès !', 'Succès')
    } else if (props.carteUuid) {
      const updateData: CarteUpdateRequest = {
        nom: formData.value.nom.trim(),
        code: formData.value.code.trim(),
        typeCarteUuid: formData.value.typeCarteUuid,
        description: formData.value.description.trim() || undefined,
        numero: formData.value.numero.trim() || undefined
      }
      // Gestion de l'utilisateur
      if (formData.value.userUuid) {
        updateData.userUuid = formData.value.userUuid
      } else {
        // Si pas d'utilisateur sélectionné, envoyer clearUser pour retirer l'association
        updateData.clearUser = true
      }
      const response = await cartesService.updateCarte(props.carteUuid, updateData)
      emit('saved', response.carte)
      messages.success('Carte modifiée avec succès !', 'Succès')
    }

    handleClose()
  } catch (err: any) {
    error.value = err.message || `Erreur lors de ${props.isCreating ? 'la création' : 'la modification'}`
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

// Formater une date
const formatDate = (dateString?: Date | string) => {
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
</script>
