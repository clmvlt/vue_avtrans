<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { usePermissions } from '@/composables/usePermissions'
import { useTheme } from '@/composables/useTheme'
import { fullNavSections } from '@/config/navConfig'
import { useSidebar } from '@/components/ui/sidebar/utils'
import faviconUrl from '@/assets/favicon.png'

// Sidebar UI
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'

// shadcn components
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Notifications } from '@/components/ui/notifications'

// Lucide icons
import {
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

const props = withDefaults(defineProps<Props>(), {
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
const { isMobile, setOpenMobile } = useSidebar()

// Filter nav sections by permissions
const filteredNavSections = computed(() => {
  const userEmail = authStore.user?.email
  return fullNavSections
    .map(section => ({
      ...section,
      links: section.links.filter(link => {
        if (!canAccess(link.requiredRoles, link.requiredPermissions)) return false
        if (link.requiredEmails && link.requiredEmails.length > 0) {
          return !!userEmail && link.requiredEmails.includes(userEmail)
        }
        return true
      })
    }))
    .filter(section => section.links.length > 0)
})

// Check if a route is active
const isActiveRoute = (to: string) => {
  return route.path === to || route.path.startsWith(to + '/')
}

// Close mobile sidebar on route change
watch(() => route.path, () => {
  if (isMobile.value) {
    setOpenMobile(false)
  }
})
</script>

<template>
  <Sidebar side="right" collapsible="icon">
    <!-- Header: Logo + collapse trigger -->
    <SidebarHeader class="border-b border-sidebar-border">
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            :tooltip="'AVTRANS'"
          >
            <div class="flex aspect-square size-8 items-center justify-center rounded-lg">
              <img :src="faviconUrl" alt="AVTRANS" class="size-8 rounded-lg" />
            </div>
            <span class="truncate text-lg font-bold tracking-wide">AVTRANS</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>

    <!-- Content: Scrollable nav sections -->
    <SidebarContent>
      <SidebarGroup v-for="section in filteredNavSections" :key="section.title">
        <SidebarGroupLabel>
          <component :is="section.lucideIcon" class="mr-1" />
          {{ section.title }}
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem v-for="link in section.links" :key="link.to">
              <SidebarMenuButton
                :is-active="isActiveRoute(link.to)"
                :tooltip="link.label"
                as-child
              >
                <router-link :to="link.to">
                  <component v-if="link.lucideIcon" :is="link.lucideIcon" />
                  <span>{{ link.label }}</span>
                </router-link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>

    <!-- Footer: Notifications + User dropdown -->
    <SidebarFooter class="border-t border-sidebar-border">
      <!-- Notifications -->
      <SidebarMenu>
        <SidebarMenuItem>
          <Notifications />
        </SidebarMenuItem>
      </SidebarMenu>

      <!-- User dropdown -->
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <SidebarMenuButton
                size="lg"
                class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                :tooltip="props.userName || ''"
              >
                <Avatar class="size-8 shrink-0 rounded-lg">
                  <AvatarImage
                    v-if="props.userImage"
                    :src="props.userImage"
                    :alt="props.userName"
                    class="object-cover"
                  />
                  <AvatarFallback class="rounded-lg bg-primary text-xs font-bold text-primary-foreground">
                    {{ props.userInitials || '?' }}
                  </AvatarFallback>
                </Avatar>
                <div class="grid flex-1 text-left text-sm leading-tight">
                  <span class="truncate font-semibold">{{ props.userName }}</span>
                  <span class="truncate text-xs text-muted-foreground">{{ props.userEmail }}</span>
                </div>
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="left"
              :side-offset="8"
              align="end"
              class="w-56"
            >
              <DropdownMenuLabel class="font-normal">
                <div class="flex flex-col gap-1">
                  <p class="text-sm font-medium leading-none">{{ props.userName }}</p>
                  <p class="text-xs leading-none text-muted-foreground">{{ props.userEmail }}</p>
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
              <DropdownMenuItem v-if="props.showViewModeToggle" @click="emit('toggle-view-mode')">
                <ArrowLeftRight class="size-4" />
                {{ props.isViewingAsUser ? 'Vue Admin' : 'Vue Utilisateur' }}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem class="relative" @click="emit('show-changelog')">
                <Sparkles class="size-4" />
                Nouveautés
                <Badge
                  v-if="props.hasUnseenChanges"
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
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>

    <SidebarRail />
  </Sidebar>
</template>
