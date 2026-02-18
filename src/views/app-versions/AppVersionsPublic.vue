<template>
  <div class="flex min-h-screen items-center justify-center bg-muted p-4 sm:p-6"
       :class="{ 'items-start': isMobile }">
    <div class="w-full max-w-[1000px]">
      <!-- Header avec logo -->
      <div class="mb-8 text-center">
        <div class="mx-auto mb-4 inline-flex size-16 items-center justify-center overflow-hidden rounded-full bg-primary sm:size-20">
          <img src="/src/assets/favicon.png" alt="Logo AVTRANS" class="size-full rounded-full object-cover" />
        </div>
        <h1 class="text-xl font-bold text-foreground sm:text-2xl">Télécharger l'application</h1>
        <p class="mt-2 text-muted-foreground">Application mobile AVTRANS Pointage</p>
      </div>

      <!-- Grille des plateformes -->
      <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
        <!-- Section Android -->
        <div class="flex flex-col rounded-lg border bg-card p-4 shadow-md sm:p-6"
             :class="{ 'order-1 md:order-2': showIOSFirst }">
          <div class="mb-6 border-b pb-4 text-center">
            <div class="mx-auto mb-3 inline-flex size-14 items-center justify-center rounded-lg bg-[#3ddc84] text-white sm:size-16">
              <!-- Android icon -->
              <svg class="size-7 sm:size-8" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.27-.86-.31-.16-.69-.04-.86.27l-1.86 3.22c-1.37-.64-2.88-1-4.45-1s-3.08.36-4.45 1L5.73 5.71c-.16-.31-.54-.43-.86-.27-.31.16-.43.54-.27.86L6.4 9.48C3.3 11.25 1.28 14.44 1 18h22c-.28-3.56-2.3-6.75-5.4-8.52zM7 15.25c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25 1.25.56 1.25 1.25-.56 1.25-1.25 1.25zm10 0c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25 1.25.56 1.25 1.25-.56 1.25-1.25 1.25z" />
              </svg>
            </div>
            <h2 class="mb-2 text-xl font-bold text-foreground">Android</h2>
            <Badge variant="outline" class="border-green-500/50 text-green-600 dark:text-green-400">
              Disponible
            </Badge>
          </div>

          <!-- État de chargement -->
          <div v-if="loading" class="flex flex-1 flex-col items-center gap-4 py-8">
            <LoaderCircle class="size-10 animate-spin text-primary" />
            <p class="text-muted-foreground">Chargement...</p>
          </div>

          <!-- État d'erreur -->
          <div v-else-if="error" class="flex items-center gap-3 rounded-md border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
            <AlertCircle class="size-5 shrink-0" />
            <span>{{ error }}</span>
          </div>

          <!-- Contenu Android -->
          <template v-else>
            <!-- Dernière version -->
            <div v-if="latestVersion" class="flex-1">
              <Badge variant="outline" class="mb-4 border-green-500/50 text-green-600 dark:text-green-400">
                <Star class="size-3" />
                Dernière version
              </Badge>

              <div class="mb-6">
                <div class="mb-3 flex items-baseline gap-2">
                  <span class="text-xl font-bold text-foreground sm:text-2xl">{{ latestVersion.versionName }}</span>
                  <span class="text-sm text-muted-foreground">(Build {{ latestVersion.versionCode }})</span>
                </div>

                <div class="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-4">
                  <span class="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText class="size-3.5" />
                    {{ formatFileSize(latestVersion.fileSize) }}
                  </span>
                  <span class="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar class="size-3.5" />
                    {{ formatDate(latestVersion.createdAt) }}
                  </span>
                  <span class="flex items-center gap-2 text-sm text-muted-foreground">
                    <Download class="size-3.5" />
                    {{ formatDownloadCount(latestVersion.downloadCount) }}
                  </span>
                </div>

                <div v-if="latestVersion.changelog" class="rounded-md bg-muted p-4">
                  <h4 class="mb-2 text-sm font-semibold text-foreground">Nouveautés</h4>
                  <p class="whitespace-pre-line text-sm text-muted-foreground">{{ latestVersion.changelog }}</p>
                </div>
              </div>

              <a
                :href="appVersionsService.getLatestDownloadUrl()"
                class="mb-4 block no-underline"
                download
              >
                <Button class="w-full" size="lg">
                  <Download class="size-4" />
                  Télécharger l'APK
                </Button>
              </a>

              <!-- Historique des versions -->
              <div v-if="olderVersions.length > 0" class="mt-4 border-t pt-4">
                <Button
                  variant="outline"
                  class="w-full justify-between"
                  @click="showHistory = !showHistory"
                >
                  <span>Versions précédentes ({{ olderVersions.length }})</span>
                  <component :is="showHistory ? ChevronUp : ChevronDown" class="size-4" />
                </Button>

                <div v-if="showHistory" class="mt-4 space-y-3">
                  <div
                    v-for="version in olderVersions"
                    :key="version.id"
                    class="rounded-md border bg-muted p-3"
                  >
                    <div class="mb-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div class="flex items-baseline gap-2">
                        <span class="font-semibold text-foreground">{{ version.versionName }}</span>
                        <span class="text-xs text-muted-foreground">(Build {{ version.versionCode }})</span>
                      </div>
                      <div class="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{{ formatFileSize(version.fileSize) }}</span>
                        <span>&middot;</span>
                        <span>{{ formatDate(version.createdAt) }}</span>
                        <span>&middot;</span>
                        <span class="flex items-center gap-1">
                          <Download class="size-3" />
                          {{ formatDownloadCount(version.downloadCount) }}
                        </span>
                      </div>
                    </div>

                    <div v-if="version.changelog" class="mb-2">
                      <button
                        type="button"
                        class="flex items-center gap-2 text-xs text-primary hover:underline"
                        @click="toggleChangelog(version.id)"
                      >
                        <component :is="expandedChangelogs.has(version.id) ? ChevronUp : ChevronDown" class="size-3" />
                        Notes de version
                      </button>
                      <p
                        v-if="expandedChangelogs.has(version.id)"
                        class="mt-2 whitespace-pre-line rounded-sm bg-background p-2 text-xs text-muted-foreground"
                      >
                        {{ version.changelog }}
                      </p>
                    </div>

                    <a
                      :href="appVersionsService.getDownloadUrl(version.id)"
                      class="inline-block no-underline"
                      download
                    >
                      <Button variant="outline" size="sm">
                        <Download class="size-3.5" />
                        Télécharger
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <!-- Aucune version disponible -->
            <div v-else class="flex flex-1 flex-col items-center justify-center py-8 text-muted-foreground">
              <PackageOpen class="mb-4 size-12 opacity-50" />
              <p>Aucune version disponible pour le moment.</p>
            </div>
          </template>

          <!-- Note Android -->
          <div class="mt-auto flex items-start gap-3 border-t pt-4 text-xs text-muted-foreground">
            <Info class="mt-0.5 size-4 shrink-0" />
            <span>Vous devrez peut-être autoriser l'installation d'applications provenant de sources inconnues.</span>
          </div>
        </div>

        <!-- Section iOS -->
        <div class="flex flex-col rounded-lg border bg-card p-4 shadow-md sm:p-6"
             :class="{ '-order-1': showIOSFirst }">
          <div class="mb-6 border-b pb-4 text-center">
            <div class="mx-auto mb-3 inline-flex size-14 items-center justify-center rounded-lg bg-foreground text-background sm:size-16">
              <!-- Apple icon -->
              <svg class="size-7 sm:size-8" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
            </div>
            <h2 class="mb-2 text-xl font-bold text-foreground">iOS (iPhone/iPad)</h2>
            <Badge variant="outline" class="border-green-500/50 text-green-600 dark:text-green-400">
              Disponible
            </Badge>
          </div>

          <div class="flex-1">
            <Badge variant="outline" class="mb-4 border-violet-500/50 text-violet-600 dark:text-violet-400">
              <Plane class="size-3" />
              Via TestFlight
            </Badge>

            <div class="mb-4 rounded-md bg-muted p-4 text-left">
              <h4 class="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                <ListOrdered class="size-4" />
                Comment installer l'application
              </h4>
              <ol class="m-0 space-y-3 pl-5">
                <li class="text-sm leading-relaxed text-muted-foreground">
                  <strong class="text-foreground">Téléchargez TestFlight</strong> depuis l'App Store si ce n'est pas déjà fait
                  <a
                    href="https://apps.apple.com/app/testflight/id899247664"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="ml-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <ExternalLink class="size-3" />
                    Ouvrir dans l'App Store
                  </a>
                </li>
                <li class="text-sm leading-relaxed text-muted-foreground">
                  <strong class="text-foreground">Ouvrez TestFlight</strong> sur votre iPhone ou iPad
                </li>
                <li class="text-sm leading-relaxed text-muted-foreground">
                  <strong class="text-foreground">Appuyez sur le bouton ci-dessous</strong> pour rejoindre le programme de test
                </li>
                <li class="text-sm leading-relaxed text-muted-foreground">
                  <strong class="text-foreground">Installez l'application</strong> AVTRANS Pointage depuis TestFlight
                </li>
              </ol>
            </div>

            <a
              href="https://testflight.apple.com/join/cGHBQbTh"
              target="_blank"
              rel="noopener noreferrer"
              class="block no-underline"
            >
              <Button class="w-full" size="lg">
                <!-- Apple icon inline -->
                <svg class="size-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
                Rejoindre sur TestFlight
              </Button>
            </a>
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
import { useBrowserDetection } from '@/composables/useBrowserDetection'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Star, FileText, Calendar, Download, AlertCircle,
  PackageOpen, ChevronUp, ChevronDown, ExternalLink,
  ListOrdered, Plane, LoaderCircle, Info
} from 'lucide-vue-next'

const { isMobileDevice } = useBrowserDetection()

const deviceType = computed(() => {
  const ua = navigator.userAgent.toLowerCase()
  const isIOS = /iphone|ipad|ipod/.test(ua)
  const isAndroid = /android/.test(ua)

  if (isIOS) return 'ios'
  if (isAndroid) return 'android'
  return 'desktop'
})

const showIOSFirst = computed(() => deviceType.value === 'ios')
const isMobile = computed(() => isMobileDevice())

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
