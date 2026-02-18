<template>
  <nav class="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-sm">
    <div class="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-6 py-2">
      <!-- Left: Logo/Brand + Navigation Links -->
      <div ref="leftSection" class="flex min-w-0 flex-1 items-center gap-6 overflow-hidden">
        <slot name="brand">
          <router-link v-if="brandLink" :to="brandLink" class="flex shrink-0 items-center gap-2.5 no-underline transition-opacity hover:opacity-80">
            <img :src="faviconUrl" alt="AVTRANS" class="size-8 rounded-lg" />
            <span v-if="brandText" class="hidden text-lg font-bold tracking-wide text-foreground sm:inline">{{ brandText }}</span>
          </router-link>
          <div v-else class="flex shrink-0 items-center gap-2.5">
            <img :src="faviconUrl" alt="AVTRANS" class="size-8 rounded-lg" />
            <span v-if="brandText" class="hidden text-lg font-bold tracking-wide text-foreground sm:inline">{{ brandText }}</span>
          </div>
        </slot>

        <!-- Navigation Links -->
        <div v-if="!hideNav && links.length > 0" ref="linksContainer" class="flex items-center gap-1">
          <router-link
            v-for="(link, index) in links"
            :key="link.to"
            v-show="index < visibleLinksCount"
            :to="link.to"
            class="flex items-center justify-center gap-2 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            active-class="!bg-primary/10 !text-primary !font-semibold"
          >
            <component v-if="link.lucideIcon" :is="link.lucideIcon" class="size-4 shrink-0" />
            <span v-else-if="link.icon" class="shrink-0 text-base">{{ link.icon }}</span>
            <span v-show="showLabels">{{ link.label }}</span>
          </router-link>
        </div>
      </div>

      <!-- Right: Actions + User Dropdown + Hamburger Menu -->
      <div class="flex shrink-0 items-center gap-1.5">
        <!-- Actions (notifications, hidden on small screens) -->
        <div class="hidden items-center gap-1.5 sm:flex">
          <slot name="actions"></slot>
        </div>

        <!-- User Avatar Dropdown -->
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="ghost" size="icon" class="rounded-full ring-offset-background transition-colors hover:ring-2 hover:ring-ring hover:ring-offset-2">
              <Avatar class="size-8">
                <AvatarImage v-if="userImage" :src="userImage" :alt="userName" class="object-cover" />
                <AvatarFallback class="bg-primary text-xs font-bold text-primary-foreground">
                  {{ userInitials || '?' }}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" class="w-56">
            <DropdownMenuLabel class="font-normal">
              <div class="flex flex-col gap-1">
                <p class="text-sm font-medium leading-none">{{ userName }}</p>
                <p class="text-xs leading-none text-muted-foreground">{{ userEmail }}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem as-child>
              <router-link to="/profile" class="flex cursor-pointer items-center gap-2">
                <UserPen class="size-4" />
                Mon profil
              </router-link>
            </DropdownMenuItem>
            <DropdownMenuItem @click="toggleTheme">
              <Sun v-if="isDark" class="size-4" />
              <Moon v-else class="size-4" />
              {{ isDark ? 'Mode clair' : 'Mode sombre' }}
            </DropdownMenuItem>
            <DropdownMenuItem v-if="showViewModeToggle" @click="emit('toggle-view-mode')">
              <ArrowLeftRight class="size-4" />
              {{ isViewingAsUser ? 'Vue Admin' : 'Vue Utilisateur' }}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem @click="emit('show-changelog')" class="relative">
              <Sparkles class="size-4" />
              Nouveautés
              <Badge
                v-if="hasUnseenChanges"
                variant="default"
                class="ml-auto size-2 min-w-0 rounded-full p-0"
              />
            </DropdownMenuItem>
            <DropdownMenuItem as-child>
              <router-link to="/add-to-homescreen" class="flex cursor-pointer items-center gap-2">
                <Smartphone class="size-4" />
                Ajouter à l'écran d'accueil
              </router-link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem class="text-destructive focus:text-destructive" @click="emit('logout')">
              <LogOut class="size-4" />
              Se déconnecter
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <!-- Sheet Trigger -->
        <Sheet v-model:open="showFullNav">
          <SheetTrigger as-child>
            <Button variant="ghost" size="icon" class="size-9 shrink-0" title="Navigation">
              <PanelRight class="size-5" />
            </Button>
          </SheetTrigger>

          <SheetContent side="right" class="!inset-y-auto !right-[4%] !top-4 !h-auto !w-[92vw] !max-w-[1200px] !max-h-[90dvh] overflow-y-auto !rounded-xl !border p-6 pt-12 shadow-2xl">
            <SheetHeader class="sr-only">
              <SheetTitle>Navigation</SheetTitle>
              <SheetDescription>Menu de navigation principal</SheetDescription>
            </SheetHeader>
            <slot name="full-nav"></slot>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { PanelRight, UserPen, LogOut, Smartphone, ArrowLeftRight, Moon, Sun, Sparkles } from 'lucide-vue-next'
import { useTheme } from '@/composables/useTheme'
import faviconUrl from '@/assets/favicon.png'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

interface NavLink {
  to: string
  label: string
  icon?: string
  lucideIcon?: Component
}

interface Props {
  brandText?: string
  brandLogo?: string
  brandLink?: string
  links?: NavLink[]
  hideNav?: boolean
  userName?: string
  userEmail?: string
  userInitials?: string
  userImage?: string
  showViewModeToggle?: boolean
  isViewingAsUser?: boolean
  hasUnseenChanges?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  links: () => [],
  hideNav: false,
  showViewModeToggle: false,
  isViewingAsUser: false,
  hasUnseenChanges: false,
})

const { isDark, toggleTheme } = useTheme()

const emit = defineEmits<{
  (e: 'logout'): void
  (e: 'toggle-view-mode'): void
  (e: 'show-changelog'): void
}>()

const showFullNav = ref(false)
const leftSection = ref<HTMLElement | null>(null)
const linksContainer = ref<HTMLElement | null>(null)
const availableWidth = ref(0)
const isMobile = ref(false)

// Constantes pour le calcul des tailles
const ICON_ONLY_WIDTH = 40 // icône 16px + padding 24px
const CHAR_WIDTH = 7.5 // largeur moyenne d'un caractère en px (text-sm)
const LINK_GAP = 8 // gap-2 entre icône et label
const LINKS_GAP = 4 // gap-1 entre les liens
const BRAND_WIDTH_DESKTOP = 140 // logo + texte approximatif
const BRAND_WIDTH_MOBILE = 40 // logo uniquement
const SECTION_GAP = 24 // gap-6 entre brand et liens
const SM_BREAKPOINT = 640 // Tailwind sm breakpoint

// Largeur effective du brand selon le mode
const effectiveBrandWidth = computed(() => isMobile.value ? BRAND_WIDTH_MOBILE : BRAND_WIDTH_DESKTOP)

// Calcule la largeur estimée d'un lien
const getLinkWidth = (link: NavLink, withLabel: boolean): number => {
  if (!withLabel) return ICON_ONLY_WIDTH + LINKS_GAP
  return ICON_ONLY_WIDTH + LINK_GAP + (link.label.length * CHAR_WIDTH) + LINKS_GAP
}

// Calcule combien de liens peuvent tenir avec labels
const getVisibleCountWithLabels = (width: number): number => {
  let usedWidth = 0
  let count = 0
  for (const link of props.links) {
    const linkWidth = getLinkWidth(link, true)
    if (usedWidth + linkWidth <= width) {
      usedWidth += linkWidth
      count++
    } else {
      break
    }
  }
  return count
}

// Calcule combien de liens peuvent tenir sans labels (icônes seules)
const getVisibleCountIconsOnly = (width: number): number => {
  let usedWidth = 0
  let count = 0
  for (const link of props.links) {
    const linkWidth = getLinkWidth(link, false)
    if (usedWidth + linkWidth <= width) {
      usedWidth += linkWidth
      count++
    } else {
      break
    }
  }
  return count
}

// Détermine si on affiche les labels
const showLabels = computed(() => {
  // Sur mobile, toujours afficher en mode icônes uniquement
  if (isMobile.value) return false

  const spaceForLinks = availableWidth.value - effectiveBrandWidth.value - SECTION_GAP
  const countWithLabels = getVisibleCountWithLabels(spaceForLinks)
  const countIconsOnly = getVisibleCountIconsOnly(spaceForLinks)

  // Afficher les labels si on peut montrer au moins autant de liens qu'avec icônes seules
  // ou si on a assez de place pour au moins 2 liens avec labels
  return countWithLabels >= Math.min(countIconsOnly, 2) || spaceForLinks > 300
})

// Nombre de liens visibles
const visibleLinksCount = computed(() => {
  const spaceForLinks = availableWidth.value - effectiveBrandWidth.value - SECTION_GAP
  if (spaceForLinks <= 0) return 0

  if (showLabels.value) {
    return getVisibleCountWithLabels(spaceForLinks)
  } else {
    return getVisibleCountIconsOnly(spaceForLinks)
  }
})

// Observer pour détecter les changements de taille
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

  resizeObserver = new ResizeObserver(() => {
    updateAvailableWidth()
  })

  if (leftSection.value) {
    resizeObserver.observe(leftSection.value)
  }

  // Écouter les changements de breakpoint
  mediaQuery = window.matchMedia(`(max-width: ${SM_BREAKPOINT - 1}px)`)
  mediaQuery.addEventListener('change', updateMobileState)
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  mediaQuery?.removeEventListener('change', updateMobileState)
})

// Recalculer quand les liens changent
watch(() => props.links, updateAvailableWidth, { deep: true })

const closeFullNav = () => {
  showFullNav.value = false
}

defineExpose({
  closeFullNav,
  showFullNav
})
</script>
