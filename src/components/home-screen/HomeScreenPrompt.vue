<template>
  <Dialog :open="modelValue" @update:open="$emit('update:modelValue', $event)">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Raccourci écran d'accueil</DialogTitle>
      </DialogHeader>
      <div class="flex flex-col items-center gap-6 py-2 text-center">
        <div class="inline-flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-violet-600 text-white">
          <Smartphone class="size-7" />
        </div>
        <p class="text-base leading-relaxed text-foreground">
          Souhaitez-vous ajouter un raccourci sur votre écran d'accueil pour vous connecter en un seul clic ?
        </p>
        <div class="flex w-full flex-col gap-3 text-left">
          <div class="flex items-center gap-3 rounded-md bg-secondary p-3">
            <Zap class="size-5 shrink-0 text-green-600" />
            <span class="text-sm text-muted-foreground">Connexion instantanée</span>
          </div>
          <div class="flex items-center gap-3 rounded-md bg-secondary p-3">
            <Fingerprint class="size-5 shrink-0 text-green-600" />
            <span class="text-sm text-muted-foreground">Pas besoin de mot de passe</span>
          </div>
          <div class="flex items-center gap-3 rounded-md bg-secondary p-3">
            <Clock class="size-5 shrink-0 text-green-600" />
            <span class="text-sm text-muted-foreground">Accès rapide au pointage</span>
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" @click="handleDismiss">Plus tard</Button>
        <Button variant="default" @click="handleNavigate">Voir</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Smartphone, Zap, Fingerprint, Clock } from 'lucide-vue-next'

interface Props {
  modelValue: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'navigate': []
  'dismiss': []
}>()

const handleNavigate = () => {
  emit('update:modelValue', false)
  emit('navigate')
}

const handleDismiss = () => {
  emit('update:modelValue', false)
  emit('dismiss')
}
</script>
