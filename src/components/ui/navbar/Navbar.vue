<template>
  <nav v-if="authStore.user" class="sticky top-0 z-50 h-14 border-b" :class="navClasses">
    <div class="mx-auto flex h-full max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6">
      <!-- ZONE GAUCHE — Logo + liens de navigation -->
      <div ref="leftSection" class="flex min-w-0 flex-1 items-center gap-4 overflow-hidden">
        <!-- Logo AVTRANS -->
        <router-link :to="defaultRoute" class="flex shrink-0 items-center gap-2.5 no-underline transition-opacity hover:opacity-80">
          <div class="flex size-8 items-center justify-center rounded-lg bg-primary/10">
            <img :src="faviconUrl" alt="AVTRANS" class="size-7 rounded-md" />
          </div>
          <span class="hidden text-lg font-bold tracking-wide text-foreground md:inline">AVTRANS</span>
        </router-link>

        <!-- Séparateur vertical -->
        <div class="hidden h-6 w-px bg-border sm:block" />

        <!-- Liens de navigation dynamiques -->
        <div v-if="filteredMainLinks.length > 0" class="flex items-center gap-1">
          <router-link
            v-for="(link, index) in filteredMainLinks"
            :key="link.to"
            v-show="index < visibleLinksCount"
            :to="link.to"
            class="flex items-center justify-center gap-2 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            active-class="!bg-primary/10 !text-primary !font-semibold"
          >
            <component v-if="link.lucideIcon" :is="link.lucideIcon" class="size-4 shrink-0" />
            <span v-show="showLabels">{{ link.label }}</span>
          </router-link>
        </div>
      </div>

      <!-- ZONE DROITE — Notifications + Menu -->
      <div class="flex shrink-0 items-center gap-1.5">
        <!-- Notifications (masqué sur mobile) -->
        <div class="hidden sm:block">
          <Notifications />
        </div>

        <!-- Bouton Menu (Sheet trigger) -->
        <Sheet v-model:open="sheetOpen">
          <SheetTrigger as-child>
            <Button variant="ghost" size="icon" class="size-9 shrink-0" title="Menu">
              <Menu class="size-5" />
            </Button>
          </SheetTrigger>

          <SheetContent side="right" class="flex w-[85vw] max-w-[448px] flex-col p-0">
            <SheetHeader class="sr-only">
              <SheetTitle>Menu de navigation</SheetTitle>
              <SheetDescription>Navigation principale AVTRANS</SheetDescription>
            </SheetHeader>

            <!-- PANNEAU LATÉRAL — En-tête utilisateur -->
            <div class="border-b p-6">
              <div class="flex items-center gap-3">
                <Avatar class="size-10">
                  <AvatarImage v-if="userImage" :src="userImage" :alt="userName" class="object-cover" />
                  <AvatarFallback class="bg-primary text-sm font-bold text-primary-foreground">
                    {{ userInitials || '?' }}
                  </AvatarFallback>
                </Avatar>
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-semibold leading-tight">{{ userName }}</p>
                  <p class="truncate text-xs text-muted-foreground">{{ userEmail }}</p>
                </div>
              </div>
            </div>

            <!-- Contenu scrollable -->
            <div class="flex-1 overflow-y-auto">
              <!-- Notifications (mobile uniquement) -->
              <div class="border-b p-4 sm:hidden">
                <Notifications />
              </div>

              <!-- Sections de navigation -->
              <div v-for="section in filteredNavSections" :key="section.title" class="border-b px-4 py-3">
                <p class="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <component :is="section.lucideIcon" class="size-3.5" />
                  {{ section.title }}
                </p>
                <div class="space-y-0.5">
                  <router-link
                    v-for="link in section.links"
                    :key="link.to"
                    :to="link.to"
                    class="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                    :class="isActiveRoute(link.to) && 'bg-accent text-primary font-semibold'"
                    @click="sheetOpen = false"
                  >
                    <component v-if="link.lucideIcon" :is="link.lucideIcon" class="size-4 shrink-0 text-muted-foreground" />
                    <span>{{ link.label }}</span>
                  </router-link>
                </div>
              </div>
            </div>

            <!-- Footer compact -->
            <div class="flex items-center justify-between border-t px-4 py-3">
              <div class="flex items-center gap-1">
                <!-- Mon profil -->
                <Button variant="ghost" size="icon" class="size-9" title="Mon profil" as-child>
                  <router-link to="/profile" @click="sheetOpen = false">
                    <UserPen class="size-4" />
                  </router-link>
                </Button>

                <!-- Toggle dark/light mode -->
                <Button variant="ghost" size="icon" class="size-9" :title="isDark ? 'Mode clair' : 'Mode sombre'" @click="toggleTheme">
                  <Sun v-if="isDark" class="size-4" />
                  <Moon v-else class="size-4" />
                </Button>

                <!-- Toggle vue admin/utilisateur -->
                <Button v-if="showViewModeToggle" variant="ghost" size="icon" class="size-9" :title="isViewingAsUser ? 'Vue Admin' : 'Vue Utilisateur'" @click="emit('toggle-view-mode')">
                  <ArrowLeftRight class="size-4" />
                </Button>

                <!-- Nouveautés -->
                <Button variant="ghost" size="icon" class="relative size-9" title="Nouveautés" @click="sheetOpen = false; emit('show-changelog')">
                  <Sparkles class="size-4" />
                  <span
                    v-if="hasUnseenChanges"
                    class="absolute right-1.5 top-1.5 size-2 rounded-full bg-primary"
                  />
                </Button>

                <!-- Ajouter à l'écran d'accueil -->
                <Button variant="ghost" size="icon" class="size-9" title="Ajouter à l'écran d'accueil" as-child>
                  <router-link to="/add-to-homescreen" @click="sheetOpen = false">
                    <Smartphone class="size-4" />
                  </router-link>
                </Button>
              </div>

              <!-- Déconnexion -->
              <Button variant="destructive" size="sm" @click="emit('logout')">
                <LogOut class="size-4" />
                Déconnexion
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { usePermissions } from '@/composables/usePermissions'
import { useTheme } from '@/composables/useTheme'
import { mainNavLinks, fullNavSections } from '@/config/navConfig'
import faviconUrl from '@/assets/favicon.png'

// shadcn components
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Notifications } from '@/components/ui/notifications'

// Lucide icons
import {
  Menu,
  UserPen,
  LogOut,
  Smartphone,
  ArrowLeftRight,
  Moon,
  Sun,
  Sparkles,
} from 'lucide-vue-next'

interface Props {
  userName?: string
  userEmail?: string
  userInitials?: string
  userImage?: string
  showViewModeToggle?: boolean
  isViewingAsUser?: boolean
  hasUnseenChanges?: boolean
}

withDefaults(defineProps<Props>(), {
  showViewModeToggle: false,
  isViewingAsUser: false,
  hasUnseenChanges: false,
})

const emit = defineEmits<{
  (e: 'logout'): void
  (e: 'toggle-view-mode'): void
  (e: 'show-changelog'): void
}>()

const route = useRoute()
const authStore = useAuthStore()
const { canAccess } = usePermissions()
const { isDark, toggleTheme } = useTheme()

const sheetOpen = ref(false)
const leftSection = ref<HTMLElement | null>(null)
const availableWidth = ref(0)
const isMobile = ref(false)

// Route par défaut selon le rôle
const defaultRoute = computed(() => {
  if (authStore.isAdmin) return '/users'
  if (authStore.isMechanic) return '/vehicules'
  return '/pointage'
})

// Classes CSS de la navbar
const navClasses = computed(() => 'bg-background/80 backdrop-blur-sm')

// Liens de navigation filtrés par permissions
const filteredMainLinks = computed(() => {
  const userEmail = authStore.user?.email
  return mainNavLinks.filter(link => {
    if (!canAccess(link.requiredRoles, link.requiredPermissions)) return false
    if (link.requiredEmails?.length) {
      return !!userEmail && link.requiredEmails.includes(userEmail)
    }
    return true
  })
})

// Sections de navigation filtrées (pour le Sheet)
const filteredNavSections = computed(() => {
  const userEmail = authStore.user?.email
  return fullNavSections
    .map(section => ({
      ...section,
      links: section.links.filter(link => {
        if (!canAccess(link.requiredRoles, link.requiredPermissions)) return false
        if (link.requiredEmails?.length) {
          return !!userEmail && link.requiredEmails.includes(userEmail)
        }
        return true
      })
    }))
    .filter(section => section.links.length > 0)
})

// Route active
const isActiveRoute = (to: string) => {
  return route.path === to || route.path.startsWith(to + '/')
}

// Fermer le Sheet au changement de route
watch(() => route.path, () => {
  sheetOpen.value = false
})

// --- Calcul responsive des liens visibles ---

const ICON_ONLY_WIDTH = 40
const CHAR_WIDTH = 7.5
const LINK_GAP = 8
const LINKS_GAP = 4
const BRAND_WIDTH_DESKTOP = 140
const BRAND_WIDTH_MOBILE = 40
const SECTION_GAP = 24
const SM_BREAKPOINT = 640

const effectiveBrandWidth = computed(() => isMobile.value ? BRAND_WIDTH_MOBILE : BRAND_WIDTH_DESKTOP)

const getLinkWidth = (link: typeof mainNavLinks[0], withLabel: boolean): number => {
  if (!withLabel) return ICON_ONLY_WIDTH + LINKS_GAP
  return ICON_ONLY_WIDTH + LINK_GAP + (link.label.length * CHAR_WIDTH) + LINKS_GAP
}

const getVisibleCountWithLabels = (width: number): number => {
  let usedWidth = 0
  let count = 0
  for (const link of filteredMainLinks.value) {
    const linkWidth = getLinkWidth(link, true)
    if (usedWidth + linkWidth <= width) {
      usedWidth += linkWidth
      count++
    } else break
  }
  return count
}

const getVisibleCountIconsOnly = (width: number): number => {
  let usedWidth = 0
  let count = 0
  for (const link of filteredMainLinks.value) {
    const linkWidth = getLinkWidth(link, false)
    if (usedWidth + linkWidth <= width) {
      usedWidth += linkWidth
      count++
    } else break
  }
  return count
}

const showLabels = computed(() => {
  if (isMobile.value) return false
  const spaceForLinks = availableWidth.value - effectiveBrandWidth.value - SECTION_GAP
  const countWithLabels = getVisibleCountWithLabels(spaceForLinks)
  const countIconsOnly = getVisibleCountIconsOnly(spaceForLinks)
  return countWithLabels >= Math.min(countIconsOnly, 2) || spaceForLinks > 300
})

const visibleLinksCount = computed(() => {
  const spaceForLinks = availableWidth.value - effectiveBrandWidth.value - SECTION_GAP
  if (spaceForLinks <= 0) return 0
  return showLabels.value
    ? getVisibleCountWithLabels(spaceForLinks)
    : getVisibleCountIconsOnly(spaceForLinks)
})

// ResizeObserver
let resizeObserver: ResizeObserver | null = null
let mediaQuery: MediaQueryList | null = null

const updateAvailableWidth = () => {
  if (leftSection.value) {
    availableWidth.value = leftSection.value.offsetWidth
  }
}

const updateMobileState = () => {
  isMobile.value = window.innerWidth < SM_BREAKPOINT
}

onMounted(() => {
  updateAvailableWidth()
  updateMobileState()

  resizeObserver = new ResizeObserver(() => updateAvailableWidth())
  if (leftSection.value) {
    resizeObserver.observe(leftSection.value)
  }

  mediaQuery = window.matchMedia(`(max-width: ${SM_BREAKPOINT - 1}px)`)
  mediaQuery.addEventListener('change', updateMobileState)
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  mediaQuery?.removeEventListener('change', updateMobileState)
})

watch(() => filteredMainLinks.value, updateAvailableWidth, { deep: true })
</script>
