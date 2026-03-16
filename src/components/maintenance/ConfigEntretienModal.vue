<template>
  <Dialog v-model:open="localOpen">
    <DialogContent class="max-h-[90dvh] overflow-y-auto sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ isEdit ? 'Modifier la configuration' : 'Nouvelle configuration' }}</DialogTitle>
        <DialogDescription>
          {{ isEdit ? 'Modifier les paramètres de cette configuration d\'entretien' : 'Ajouter une nouvelle configuration d\'entretien pour ce véhicule' }}
        </DialogDescription>
      </DialogHeader>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div v-if="!isEdit" class="flex flex-col gap-2">
          <label class="text-sm font-medium text-foreground">Type d'entretien *</label>
          <Select
            :model-value="formData.typeEntretienId"
            :options="typesEntretienOptions"
            placeholder="Sélectionner un type"
            :required="true"
            searchable
            search-placeholder="Rechercher un type..."
            @update:model-value="(v: string) => formData.typeEntretienId = v"
          />
        </div>

        <div v-else class="flex flex-col gap-2">
          <label class="text-sm font-medium text-muted-foreground">Type d'entretien</label>
          <div class="rounded-md bg-muted p-3 text-sm font-semibold text-foreground">
            {{ configToEdit?.typeEntretien?.nom }}
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-foreground">Type de périodicité *</label>
          <Select
            :model-value="formData.periodiciteType"
            :options="periodiciteTypeOptions"
            placeholder="Sélectionner un type"
            :required="true"
            :searchable="false"
            @update:model-value="(v: string) => formData.periodiciteType = v as PeriodiciteType"
          />
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-foreground">
            Valeur *
            <span class="font-normal text-muted-foreground">
              ({{ formData.periodiciteType === 'TEMPOREL' ? 'jours' : 'km' }})
            </span>
          </label>
          <Input
            v-model.number="formData.periodiciteValeur"
            type="number"
            :placeholder="formData.periodiciteType === 'TEMPOREL' ? '365' : '30000'"
            min="1"
            required
          />
        </div>

        <div v-if="isEdit">
          <label class="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-accent/50 has-[[data-state=checked]]:border-primary/30 has-[[data-state=checked]]:bg-primary/5">
            <Checkbox
              :checked="formData.actif"
              @update:checked="(v: boolean) => formData.actif = v"
            />
            <div class="flex flex-col gap-0.5">
              <span class="text-sm font-medium leading-none">Configuration active</span>
              <span class="text-xs text-muted-foreground">Activer le suivi de cet entretien</span>
            </div>
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" type="button" @click="handleClose">
            Annuler
          </Button>
          <Button variant="default" type="submit" :disabled="saving">
            <LoaderCircle v-if="saving" class="mr-2 size-4 animate-spin" />
            {{ isEdit ? 'Modifier' : 'Ajouter' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { vehiculesTypesEntretienService } from '@/services'
import { useMessages } from '@/composables/useMessages'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import Select from '@/components/ui/select/Select.vue'
import { LoaderCircle } from 'lucide-vue-next'
import type { TypeEntretienDTO, VehiculeTypeEntretienDTO } from '@/models'
import type { PeriodiciteType } from '@/services/vehiculesTypesEntretien'

interface Props {
  modelValue: boolean
  vehiculeId: string
  typesEntretien: TypeEntretienDTO[]
  configurationsExistantes: VehiculeTypeEntretienDTO[]
  configToEdit?: VehiculeTypeEntretienDTO | null
}

const props = withDefaults(defineProps<Props>(), {
  configToEdit: null
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'saved': []
}>()

const messages = useMessages()

const saving = ref(false)
const formData = ref({
  typeEntretienId: '',
  periodiciteType: 'KILOMETRAGE' as PeriodiciteType,
  periodiciteValeur: undefined as number | undefined,
  actif: true
})

const isEdit = computed(() => !!props.configToEdit)

const localOpen = computed({
  get: () => props.modelValue,
  set: (val: boolean) => {
    if (!val) handleClose()
  }
})

// Types d'entretien disponibles (non encore configurés pour ce véhicule)
const typesEntretienDisponibles = computed(() => {
  const configuredIds = props.configurationsExistantes.map(c => c.typeEntretien?.id)
  return props.typesEntretien.filter(t => !configuredIds.includes(t.id))
})

const typesEntretienOptions = computed(() => {
  return typesEntretienDisponibles.value
    .filter(t => t.id && t.nom)
    .map(t => ({
      value: t.id!,
      label: t.nom!
    }))
})

const periodiciteTypeOptions = [
  { value: 'KILOMETRAGE', label: 'Kilométrage (km)' },
  { value: 'TEMPOREL', label: 'Temporel (jours)' }
]

// Réinitialiser le formulaire quand le modal s'ouvre
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    if (props.configToEdit) {
      formData.value = {
        typeEntretienId: props.configToEdit.typeEntretien?.id || '',
        periodiciteType: props.configToEdit.periodiciteType || 'KILOMETRAGE',
        periodiciteValeur: props.configToEdit.periodiciteValeur || undefined,
        actif: props.configToEdit.actif ?? true
      }
    } else {
      formData.value = {
        typeEntretienId: '',
        periodiciteType: 'KILOMETRAGE',
        periodiciteValeur: undefined,
        actif: true
      }
    }
  }
})

const handleClose = () => {
  emit('update:modelValue', false)
}

const handleSubmit = async () => {
  if (!props.vehiculeId) return

  if (!isEdit.value && !formData.value.typeEntretienId) {
    messages.error('Veuillez sélectionner un type d\'entretien')
    return
  }

  if (!formData.value.periodiciteValeur || formData.value.periodiciteValeur <= 0) {
    messages.error('Veuillez saisir une valeur de périodicité valide')
    return
  }

  saving.value = true
  try {
    if (isEdit.value && props.configToEdit?.id) {
      await vehiculesTypesEntretienService.update(props.configToEdit.id, {
        periodiciteType: formData.value.periodiciteType,
        periodiciteValeur: formData.value.periodiciteValeur,
        actif: formData.value.actif
      })
      messages.success('Configuration modifiée avec succès')
    } else {
      await vehiculesTypesEntretienService.create({
        vehiculeId: props.vehiculeId,
        typeEntretienId: formData.value.typeEntretienId,
        periodiciteType: formData.value.periodiciteType,
        periodiciteValeur: formData.value.periodiciteValeur
      })
      messages.success('Configuration ajoutée avec succès')
    }
    emit('update:modelValue', false)
    emit('saved')
  } catch {
    messages.error('Erreur lors de l\'enregistrement de la configuration')
  } finally {
    saving.value = false
  }
}
</script>
