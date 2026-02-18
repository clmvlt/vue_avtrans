<template>
  <div class="flex min-h-screen items-center justify-center bg-muted p-4 sm:p-6">
    <div class="w-full max-w-[540px] rounded-lg border bg-card p-6 shadow-lg sm:p-8">
      <!-- Header -->
      <div class="mb-6 text-center">
        <div class="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary sm:size-20">
          <Smartphone class="size-7 text-primary-foreground sm:size-9" />
        </div>
        <h1 class="text-xl font-bold text-foreground sm:text-2xl">Ajouter à l'écran d'accueil</h1>
        <p class="mt-2 text-base text-muted-foreground">
          Accédez rapidement à l'application depuis votre écran d'accueil
        </p>
      </div>

      <!-- Sélection du navigateur -->
      <div class="mb-4">
        <p class="mb-3 text-sm font-medium text-muted-foreground">
          Instructions pour votre navigateur
        </p>
        <Tabs v-model="selectedBrowser">
          <TabsList class="flex h-auto w-full flex-wrap gap-1">
            <TabsTrigger
              v-for="browser in availableBrowsers"
              :key="browser"
              :value="browser"
              class="flex items-center gap-2"
            >
              <component :is="browserIcons[browser]" class="size-4" />
              <span class="hidden sm:inline">{{ getBrowserName(browser) }}</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <!-- Instructions étape par étape -->
      <div class="mb-6 space-y-3">
        <div class="flex items-start gap-3 rounded-md border border-primary bg-primary/5 p-3">
          <span class="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">1</span>
          <span class="pt-0.5 font-medium text-foreground">
            Cliquez sur le bouton ci-dessous pour aller sur la page Pointage
          </span>
        </div>
        <div
          v-for="(step, index) in currentInstructions.steps"
          :key="index"
          class="flex items-start gap-3 rounded-md bg-muted p-3"
        >
          <span class="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{{ index + 2 }}</span>
          <span class="pt-0.5 text-foreground">{{ step }}</span>
        </div>
      </div>

      <!-- Info box -->
      <div class="mb-6 flex gap-3 rounded-md border border-violet-200 bg-violet-50 p-4 dark:border-violet-800 dark:bg-violet-950">
        <Info class="mt-0.5 size-5 shrink-0 text-violet-500" />
        <p class="text-sm text-muted-foreground">
          Une fois le raccourci ajouté, vous pourrez accéder directement à l'application.
          Si votre session expire, vous serez redirigé vers la page de connexion.
        </p>
      </div>

      <!-- Actions -->
      <div class="flex flex-col gap-3">
        <Button class="w-full" size="lg" @click="goToPointage">
          <Clock class="size-4" />
          Aller au Pointage
        </Button>
        <Button variant="outline" class="w-full" size="lg" @click="goBack">
          <ArrowLeft class="size-4" />
          Retour
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, type Component } from 'vue'
import { useRouter } from 'vue-router'
import { useBrowserDetection, type BrowserType } from '@/composables/useBrowserDetection'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Smartphone, Clock, ArrowLeft, Info, Globe, Compass, Flame, Monitor } from 'lucide-vue-next'

const router = useRouter()
const { detectBrowser, getInstructions, getBrowserName, getAllBrowserTypes } = useBrowserDetection()

const selectedBrowser = ref<BrowserType>('chrome-android')

const browserIcons: Record<BrowserType, Component> = {
  'chrome-android': Globe,
  'chrome-ios': Globe,
  'safari': Compass,
  'firefox': Flame,
  'edge': Monitor,
  'samsung': Smartphone,
  'unknown': Globe,
}

const availableBrowsers = computed<BrowserType[]>(() => {
  return getAllBrowserTypes().filter(b => b !== 'unknown')
})

const currentInstructions = computed(() => {
  return getInstructions(selectedBrowser.value)
})

const goBack = () => {
  router.back()
}

const goToPointage = () => {
  router.push('/pointage')
}

onMounted(() => {
  const detected = detectBrowser()
  if (detected !== 'unknown') {
    selectedBrowser.value = detected
  }
})
</script>
