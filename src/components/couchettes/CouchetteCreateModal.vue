<template>
  <Dialog v-model:open="localOpen">
    <DialogContent class="max-h-[90dvh] overflow-y-auto sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Nouvelle couchette</DialogTitle>
        <DialogDescription>Créer une nouvelle couchette pour un employé</DialogDescription>
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

        <!-- Employé -->
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-foreground">Employé *</label>
          <Select
            :model-value="formData.userUuid"
            :options="userOptions"
            placeholder="Sélectionner un employé"
            :searchable="true"
            :disabled="saving"
            search-placeholder="Rechercher un employé..."
            @update:model-value="(val: string) => formData.userUuid = val"
          />
        </div>

        <!-- Date -->
        <div class="flex flex-col gap-2">
          <label for="createDate" class="text-sm font-medium text-foreground">Date</label>
          <Input
            type="date"
            id="createDate"
            v-model="formData.date"
            :disabled="saving"
          />
          <span class="text-xs text-muted-foreground">Laisser vide pour aujourd'hui</span>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" @click="handleClose" :disabled="saving">
            Annuler
          </Button>
          <Button
            type="submit"
            :disabled="saving || !isFormValid"
          >
            <LoaderCircle v-if="saving" class="size-4 animate-spin mr-2" />
            Créer la couchette
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { couchettesService, usersService } from '@/services'
import { useMessages } from '@/composables/useMessages'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select } from '@/components/ui/select'
import { LoaderCircle, AlertCircle } from 'lucide-vue-next'
import type { CouchetteDTO, UserDTO } from '@/models'

interface Props {
  modelValue: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'saved': [couchette: CouchetteDTO]
  'close': []
}>()

const messages = useMessages()

const localOpen = computed({
  get: () => props.modelValue,
  set: (val: boolean) => {
    if (!val) handleClose()
  }
})

const loading = ref(false)
const saving = ref(false)
const error = ref('')

const users = ref<UserDTO[]>([])

const formData = ref({
  userUuid: '',
  date: ''
})

const userOptions = computed(() => {
  return users.value
    .filter(user => user.uuid)
    .map(user => ({
      value: user.uuid!,
      label: `${user.firstName} ${user.lastName}`
    }))
})

const isFormValid = computed(() => {
  return !!formData.value.userUuid
})

watch(() => props.modelValue, async (isOpen) => {
  if (isOpen) {
    resetForm()
    await loadData()
  }
}, { immediate: true })

const loadData = async () => {
  loading.value = true
  error.value = ''

  try {
    const usersResponse = await usersService.getUsers()

    if (usersResponse && usersResponse.data) {
      users.value = Array.isArray(usersResponse.data) ? usersResponse.data : []
    } else if (Array.isArray(usersResponse)) {
      users.value = usersResponse as unknown as UserDTO[]
    } else {
      users.value = []
    }
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Erreur lors du chargement'
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  formData.value = {
    userUuid: '',
    date: ''
  }
  error.value = ''
}

const handleSubmit = async () => {
  if (!isFormValid.value) return

  try {
    saving.value = true
    error.value = ''

    const response = await couchettesService.createCouchetteForUser({
      userUuid: formData.value.userUuid,
      date: formData.value.date || undefined
    })

    emit('saved', response.data as CouchetteDTO)
    messages.success('Couchette créée avec succès', 'Succès')
    handleClose()
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Erreur lors de la création'
    messages.error(error.value, 'Erreur')
  } finally {
    saving.value = false
  }
}

const handleClose = () => {
  emit('update:modelValue', false)
  emit('close')
}
</script>
