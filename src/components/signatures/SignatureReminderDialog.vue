<template>
  <!-- Modal bloquant : non fermable tant que l'utilisateur n'a pas signé. -->
  <Dialog :open="open" @update:open="onUpdateOpen">
    <DialogContent
      class="sm:max-w-md max-h-[90dvh] overflow-y-auto"
      :show-close-button="false"
    >
      <DialogHeader>
        <DialogTitle class="flex items-center gap-3">
          <div class="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <FileSignature class="size-5" />
          </div>
          Signature de vos heures
        </DialogTitle>
        <DialogDescription>
          Veuillez signer pour valider vos heures du mois dernier. Cette signature est obligatoire.
        </DialogDescription>
      </DialogHeader>

      <!-- Récapitulatif des heures -->
      <div class="flex items-center justify-between rounded-lg border bg-muted/50 p-4">
        <div class="flex items-center gap-3">
          <Clock class="size-5 text-primary" />
          <span class="text-sm font-medium text-foreground">Heures du mois dernier</span>
        </div>
        <span class="font-mono text-lg font-bold text-primary">{{ formattedHours }}</span>
      </div>

      <!-- Erreur -->
      <div
        v-if="error"
        class="flex items-center gap-2 rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive"
      >
        <AlertCircle class="size-4 shrink-0" />
        {{ error }}
      </div>

      <!-- Zone de signature -->
      <SignaturePad ref="padRef" :disabled="saving" />

      <DialogFooter>
        <Button class="w-full" :disabled="saving" @click="handleSubmit">
          <LoaderCircle v-if="saving" class="size-4 animate-spin" />
          <Check v-else class="size-4" />
          Valider ma signature
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { signaturesService } from '@/services'
import { useMessages } from '@/composables/useMessages'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { SignaturePad } from '@/components/ui/signature-pad'
import { FileSignature, Clock, Check, LoaderCircle, AlertCircle } from 'lucide-vue-next'

const props = defineProps<{
  open: boolean
  heuresLastMonth: number
}>()

const emit = defineEmits<{
  signed: []
}>()

const messages = useMessages()

const padRef = ref<InstanceType<typeof SignaturePad> | null>(null)
const saving = ref(false)
const error = ref('')

const formattedHours = computed(() => {
  const total = Math.max(0, props.heuresLastMonth || 0)
  const h = Math.floor(total)
  const m = Math.round((total - h) * 60)
  return m > 0 ? `${h}h ${m.toString().padStart(2, '0')}m` : `${h}h`
})

// On ignore toute tentative de fermeture : le modal reste ouvert tant que
// la signature n'a pas été enregistrée (le parent ferme via l'événement "signed").
const onUpdateOpen = () => {
  /* no-op — modal bloquant */
}

const handleSubmit = async () => {
  error.value = ''

  const signatureBase64 = padRef.value?.toDataURL() ?? null
  if (!signatureBase64) {
    error.value = 'Veuillez dessiner votre signature avant de valider.'
    return
  }

  try {
    saving.value = true
    await signaturesService.createSignature({
      signatureBase64,
      date: new Date().toISOString(),
      heuresSignees: props.heuresLastMonth,
    })

    messages.success('Signature enregistrée avec succès', 'Merci !')
    emit('signed')
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement de la signature'
  } finally {
    saving.value = false
  }
}
</script>
