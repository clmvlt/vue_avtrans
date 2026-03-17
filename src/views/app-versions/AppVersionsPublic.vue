<template>
  <div class="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background">
    <!-- Header -->
    <div class="border-b bg-card/80 backdrop-blur-sm">
      <div class="mx-auto max-w-3xl px-4 py-8 text-center sm:py-12">
        <div class="mx-auto mb-4 inline-flex size-18 items-center justify-center overflow-hidden rounded-2xl shadow-lg ring-2 ring-primary/20 sm:size-22">
          <img :src="logoUrl" alt="Logo AVTRANS" class="size-full object-cover" />
        </div>
        <h1 class="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">AVTRANS Pointage</h1>
        <p class="mt-2 text-sm text-muted-foreground sm:text-base">Téléchargez l'application mobile</p>
      </div>
    </div>

    <!-- Content -->
    <div class="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <div class="grid grid-cols-1 gap-6 md:grid-cols-2">

        <!-- Section Android -->
        <div class="flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md"
             :class="{ 'order-1 md:order-2': showIOSFirst }">
          <!-- Card header -->
          <div class="flex items-center gap-4 border-b bg-gradient-to-r from-[#3ddc84]/10 to-transparent p-5">
            <div class="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#3ddc84] text-white shadow-sm">
              <svg class="size-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.27-.86-.31-.16-.69-.04-.86.27l-1.86 3.22c-1.37-.64-2.88-1-4.45-1s-3.08.36-4.45 1L5.73 5.71c-.16-.31-.54-.43-.86-.27-.31.16-.43.54-.27.86L6.4 9.48C3.3 11.25 1.28 14.44 1 18h22c-.28-3.56-2.3-6.75-5.4-8.52zM7 15.25c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25 1.25.56 1.25 1.25-.56 1.25-1.25 1.25zm10 0c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25 1.25.56 1.25 1.25-.56 1.25-1.25 1.25z" />
              </svg>
            </div>
            <div>
              <h2 class="text-lg font-bold text-foreground">Android</h2>
              <p class="text-xs text-muted-foreground">Téléchargement direct APK</p>
            </div>
          </div>

          <!-- Card body -->
          <div class="flex flex-1 flex-col p-5">
            <!-- Loading -->
            <div v-if="loading" class="flex flex-1 flex-col items-center justify-center gap-3 py-10">
              <LoaderCircle class="size-8 animate-spin text-primary" />
              <p class="text-sm text-muted-foreground">Chargement des versions…</p>
            </div>

            <!-- Error -->
            <div v-else-if="error" class="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              <AlertCircle class="size-5 shrink-0" />
              <span>{{ error }}</span>
            </div>

            <!-- Latest version -->
            <template v-else-if="latestVersion">
              <div class="flex-1">
                <div class="mb-4 flex items-baseline gap-2">
                  <span class="text-2xl font-bold text-foreground">{{ latestVersion.versionName }}</span>
                  <span class="text-xs text-muted-foreground">Build {{ latestVersion.versionCode }}</span>
                </div>

                <div class="mb-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                  <span class="flex items-center gap-1.5">
                    <FileText class="size-3.5" />
                    {{ formatFileSize(latestVersion.fileSize) }}
                  </span>
                  <span class="flex items-center gap-1.5">
                    <Calendar class="size-3.5" />
                    {{ formatDate(latestVersion.createdAt) }}
                  </span>
                  <span class="flex items-center gap-1.5">
                    <Download class="size-3.5" />
                    {{ formatDownloadCount(latestVersion.downloadCount) }}
                  </span>
                </div>

                <div v-if="latestVersion.changelog" class="mb-5 rounded-lg bg-muted/60 p-3.5">
                  <h4 class="mb-1.5 flex items-center gap-2 text-xs font-semibold text-foreground">
                    <Sparkles class="size-3.5 text-primary" />
                    Nouveautés
                  </h4>
                  <p class="whitespace-pre-line text-xs leading-relaxed text-muted-foreground">{{ latestVersion.changelog }}</p>
                </div>
              </div>

              <a
                :href="appVersionsService.getLatestDownloadUrl()"
                class="block no-underline"
                download
              >
                <Button class="w-full gap-2" size="lg">
                  <Download class="size-4" />
                  Télécharger l'APK
                </Button>
              </a>

              <!-- Version history -->
              <div v-if="olderVersions.length > 0" class="mt-4 border-t pt-4">
                <button
                  type="button"
                  class="flex w-full items-center justify-between rounded-lg px-1 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  @click="showHistory = !showHistory"
                >
                  <span>Versions précédentes ({{ olderVersions.length }})</span>
                  <component :is="showHistory ? ChevronUp : ChevronDown" class="size-4" />
                </button>

                <div v-if="showHistory" class="mt-2 space-y-2.5">
                  <div
                    v-for="version in olderVersions"
                    :key="version.id"
                    class="rounded-lg border bg-muted/40 p-3"
                  >
                    <div class="mb-2 flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
                      <div class="flex items-baseline gap-2">
                        <span class="text-sm font-semibold text-foreground">{{ version.versionName }}</span>
                        <span class="text-[11px] text-muted-foreground">Build {{ version.versionCode }}</span>
                      </div>
                      <div class="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span>{{ formatFileSize(version.fileSize) }}</span>
                        <span class="text-border">&middot;</span>
                        <span>{{ formatDate(version.createdAt) }}</span>
                        <span class="text-border">&middot;</span>
                        <span class="flex items-center gap-1">
                          <Download class="size-3" />
                          {{ formatDownloadCount(version.downloadCount) }}
                        </span>
                      </div>
                    </div>

                    <div v-if="version.changelog" class="mb-2">
                      <button
                        type="button"
                        class="flex items-center gap-1.5 text-xs text-primary hover:underline"
                        @click="toggleChangelog(version.id)"
                      >
                        <component :is="expandedChangelogs.has(version.id) ? ChevronUp : ChevronDown" class="size-3" />
                        Notes de version
                      </button>
                      <p
                        v-if="expandedChangelogs.has(version.id)"
                        class="mt-2 whitespace-pre-line rounded-md bg-background p-2.5 text-xs leading-relaxed text-muted-foreground"
                      >
                        {{ version.changelog }}
                      </p>
                    </div>

                    <a
                      :href="appVersionsService.getDownloadUrl(version.id)"
                      class="inline-block no-underline"
                      download
                    >
                      <Button variant="outline" size="sm" class="gap-1.5">
                        <Download class="size-3.5" />
                        Télécharger
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
            </template>

            <!-- No versions -->
            <div v-else class="flex flex-1 flex-col items-center justify-center py-10 text-muted-foreground">
              <PackageOpen class="mb-3 size-10 opacity-40" />
              <p class="text-sm">Aucune version disponible</p>
            </div>
          </div>

          <!-- Footer note -->
          <div class="mt-auto border-t bg-muted/30 px-5 py-3">
            <p class="flex items-center gap-2 text-[11px] text-muted-foreground">
              <Info class="size-3.5 shrink-0" />
              Autorisez l'installation depuis des sources inconnues si nécessaire.
            </p>
          </div>
        </div>

        <!-- Section iOS -->
        <div class="flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md"
             :class="{ '-order-1': showIOSFirst }">
          <!-- Card header -->
          <div class="flex items-center gap-4 border-b bg-gradient-to-r from-foreground/5 to-transparent p-5">
            <div class="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-foreground text-background shadow-sm">
              <svg class="size-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
            </div>
            <div>
              <h2 class="text-lg font-bold text-foreground">iOS</h2>
              <p class="text-xs text-muted-foreground">Via TestFlight (iPhone & iPad)</p>
            </div>
          </div>

          <!-- Card body -->
          <div class="flex flex-1 flex-col p-5">
            <Badge variant="outline" class="mb-5 w-fit border-violet-500/30 text-violet-600 dark:text-violet-400">
              <Plane class="size-3" />
              Programme TestFlight
            </Badge>

            <div class="mb-5 space-y-3">
              <div
                v-for="(step, i) in iosSteps"
                :key="i"
                class="flex items-start gap-3"
              >
                <span class="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {{ i + 1 }}
                </span>
                <div class="flex-1 text-sm leading-relaxed text-muted-foreground">
                  <span class="font-medium text-foreground">{{ step.title }}</span>
                  {{ step.description }}
                  <a
                    v-if="step.link"
                    :href="step.link"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="ml-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <ExternalLink class="size-3" />
                    {{ step.linkLabel }}
                  </a>
                </div>
              </div>
            </div>

            <div class="mt-auto">
              <a
                href="https://testflight.apple.com/join/cGHBQbTh"
                target="_blank"
                rel="noopener noreferrer"
                class="block no-underline"
              >
                <Button class="w-full gap-2" size="lg">
                  <svg class="size-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                  </svg>
                  Rejoindre sur TestFlight
                </Button>
              </a>
            </div>
          </div>

          <!-- Footer note -->
          <div class="mt-auto border-t bg-muted/30 px-5 py-3">
            <p class="flex items-center gap-2 text-[11px] text-muted-foreground">
              <Info class="size-3.5 shrink-0" />
              TestFlight doit être installé depuis l'App Store.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { appVersionsService } from '@/services'
import type { AppVersionDTO } from '@/models'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  FileText, Calendar, Download, AlertCircle,
  PackageOpen, ChevronUp, ChevronDown, ExternalLink,
  Plane, LoaderCircle, Info, Sparkles
} from 'lucide-vue-next'
import logoUrl from '@/assets/favicon.png'

const deviceType = computed(() => {
  const ua = navigator.userAgent.toLowerCase()
  if (/iphone|ipad|ipod/.test(ua)) return 'ios'
  if (/android/.test(ua)) return 'android'
  return 'desktop'
})

const showIOSFirst = computed(() => deviceType.value === 'ios')

const iosSteps = [
  {
    title: 'Téléchargez TestFlight',
    description: " depuis l'App Store si ce n'est pas déjà fait",
    link: 'https://apps.apple.com/app/testflight/id899247664',
    linkLabel: "Ouvrir l'App Store"
  },
  {
    title: 'Ouvrez TestFlight',
    description: ' sur votre iPhone ou iPad',
    link: null,
    linkLabel: null
  },
  {
    title: 'Appuyez sur le bouton ci-dessous',
    description: ' pour rejoindre le programme de test',
    link: null,
    linkLabel: null
  },
  {
    title: "Installez l'application",
    description: ' AVTRANS Pointage depuis TestFlight',
    link: null,
    linkLabel: null
  }
]

const versions = ref<AppVersionDTO[]>([])
const loading = ref(true)
const error = ref('')
const showHistory = ref(false)
const expandedChangelogs = ref<Set<string>>(new Set())

const latestVersion = computed(() => {
  if (versions.value.length === 0) return null
  const sorted = [...versions.value].sort((a, b) => b.versionCode - a.versionCode)
  return sorted[0] || null
})

const olderVersions = computed(() => {
  if (!latestVersion.value) return []
  return versions.value
    .filter(v => v.id !== latestVersion.value!.id)
    .sort((a, b) => b.versionCode - a.versionCode)
})

const loadVersions = async () => {
  try {
    loading.value = true
    error.value = ''
    const response = await appVersionsService.getActiveVersions()
    versions.value = response.versions || []
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Erreur lors du chargement des versions'
  } finally {
    loading.value = false
  }
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1048576).toFixed(1) + ' MB'
}

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

const formatDownloadCount = (count: number): string => {
  if (count === 0) return 'Aucun téléchargement'
  if (count === 1) return '1 téléchargement'
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k téléchargements`
  return `${count} téléchargements`
}

const toggleChangelog = (versionId: string) => {
  if (expandedChangelogs.value.has(versionId)) {
    expandedChangelogs.value.delete(versionId)
  } else {
    expandedChangelogs.value.add(versionId)
  }
}

onMounted(() => {
  loadVersions()
})
</script>
