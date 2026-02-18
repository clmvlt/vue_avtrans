<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Messages } from '@/components/ui/messages'
import { Navbar } from '@/components/ui/navbar'
import { Notifications } from '@/components/ui/notifications'
import { UpdateBanner } from '@/components/ui/update-banner'
import { ChangelogDialog } from '@/components/ui/changelog'
import { useChangelog } from '@/composables/useChangelog'
import { setMessagesInstance } from '@/composables/useMessages'
import { useVersionCheck } from '@/composables/useVersionCheck'
import { usePermissions } from '@/composables/usePermissions'
import { mainNavLinks, fullNavSections } from '@/config/navConfig'

const messagesRef = ref()
const navbarRef = ref<InstanceType<typeof Navbar> | null>(null)
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { canAccess, canToggleViewMode, toggleViewMode } = usePermissions()

// Vérification de version (actif uniquement en production)
const { newVersionAvailable, newVersion, performUpdate, dismissUpdate } = useVersionCheck()

// Changelog
const { latestEntry, hasUnseenChanges, markAsSeen } = useChangelog()
const showChangelog = ref(false)

// Pages qui ne doivent pas afficher la navbar
const pagesWithoutNavbar = ['login', 'register', 'verify', 'forgot-password', 'reset-password', 'unauthorized', 'NotFound']

// Vérifier si la navbar doit être affichée
const showNavbar = computed(() => {
  return authStore.isAuthenticated && !pagesWithoutNavbar.includes(route.name as string)
})

// Navigation links pour la navbar (filtrés par permissions)
const navLinks = computed(() => {
  return mainNavLinks.filter(link =>
    canAccess(link.requiredRoles, link.requiredPermissions)
  )
})

// Navigation sections filtrées par permissions
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

// Grid items: grouped sections share a single grid cell
type NavGridItem =
  | { type: 'single'; section: typeof filteredNavSections.value[number] }
  | { type: 'group'; key: string; sections: typeof filteredNavSections.value }

const navGridItems = computed<NavGridItem[]>(() => {
  const items: NavGridItem[] = []
  const groupMap = new Map<string, typeof filteredNavSections.value>()

  for (const section of filteredNavSections.value) {
    if (section.group) {
      const existing = groupMap.get(section.group)
      if (existing) {
        existing.push(section)
      } else {
        const group = [section]
        groupMap.set(section.group, group)
        items.push({ type: 'group', key: section.group, sections: group })
      }
    } else {
      items.push({ type: 'single', section })
    }
  }
  return items
})

// Fermer le full-nav lors d'un changement de route
watch(() => route.path, () => {
  navbarRef.value?.closeFullNav()
})

const getUserInitials = () => {
  const user = authStore.user
  if (!user) return '?'
  const firstInitial = user.firstName?.charAt(0) || ''
  const lastInitial = user.lastName?.charAt(0) || ''
  return (firstInitial + lastInitial).toUpperCase() || '?'
}

const userName = computed(() => {
  const user = authStore.user
  if (!user) return ''
  return `${user.firstName || ''} ${user.lastName || ''}`.trim()
})

const handleLogout = async () => {
  authStore.logout()
  router.push('/login')
}

onMounted(() => {
  if (messagesRef.value) {
    setMessagesInstance(messagesRef.value)
  }

  // Afficher le changelog si nouvelles mises à jour non vues
  if (hasUnseenChanges.value && authStore.isAuthenticated) {
    showChangelog.value = true
  }
})

const handleChangelogClose = () => {
  showChangelog.value = false
  markAsSeen()
}
</script>

<template>
  <div id="app" class="min-h-screen bg-background">
    <Navbar
      v-if="showNavbar"
      ref="navbarRef"
      brand-text="AVTRANS"
      brand-link="/vehicules"
      :links="navLinks"
      :user-name="userName"
      :user-email="authStore.user?.email || ''"
      :user-initials="getUserInitials()"
      :user-image="authStore.user?.pictureUrl"
      :show-view-mode-toggle="canToggleViewMode"
      :is-viewing-as-user="authStore.viewAsUser"
      :has-unseen-changes="hasUnseenChanges"
      @logout="handleLogout"
      @toggle-view-mode="toggleViewMode()"
      @show-changelog="showChangelog = true"
    >
      <template #actions>
        <Notifications />
      </template>

      <template #full-nav>
        <div class="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-6">
          <template v-for="item in navGridItems" :key="item.type === 'single' ? item.section.title : item.key">
            <!-- Single section -->
            <div v-if="item.type === 'single'" class="min-w-0 rounded-lg border bg-card p-4 shadow-sm">
              <div class="mb-3 flex items-center gap-2 border-b pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <div class="flex size-6 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <component :is="item.section.lucideIcon" class="size-3.5" />
                </div>
                <span>{{ item.section.title }}</span>
              </div>
              <div class="flex flex-col gap-0.5">
                <router-link
                  v-for="link in item.section.links"
                  :key="link.to"
                  :to="link.to"
                  class="group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  active-class="!bg-primary/10 !text-primary !font-semibold"
                >
                  <component
                    v-if="link.lucideIcon"
                    :is="link.lucideIcon"
                    class="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-accent-foreground group-[.router-link-active]:text-primary"
                  />
                  {{ link.label }}
                </router-link>
              </div>
            </div>

            <!-- Grouped sections side by side on desktop -->
            <div v-else class="flex min-w-0 flex-col gap-4 sm:flex-row">
              <div
                v-for="section in item.sections"
                :key="section.title"
                class="shrink-0 rounded-lg border bg-card p-4 shadow-sm"
              >
                <div class="mb-3 flex items-center gap-2 border-b pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                  <div class="flex size-6 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <component :is="section.lucideIcon" class="size-3.5" />
                  </div>
                  <span>{{ section.title }}</span>
                </div>
                <div class="flex flex-col gap-0.5">
                  <router-link
                    v-for="link in section.links"
                    :key="link.to"
                    :to="link.to"
                    class="group flex items-center gap-3 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                    active-class="!bg-primary/10 !text-primary !font-semibold"
                  >
                    <component
                      v-if="link.lucideIcon"
                      :is="link.lucideIcon"
                      class="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-accent-foreground group-[.router-link-active]:text-primary"
                    />
                    {{ link.label }}
                  </router-link>
                </div>
              </div>
            </div>
          </template>
        </div>
      </template>
    </Navbar>

    <router-view />
    <Messages ref="messagesRef" />

    <!-- Bandeau de mise à jour (production uniquement) -->
    <UpdateBanner
      :show="newVersionAvailable"
      :version="newVersion"
      @update="performUpdate"
      @later="dismissUpdate"
    />

    <!-- Dialog des nouveautés -->
    <ChangelogDialog
      v-model:open="showChangelog"
      :entry="latestEntry"
      @close="handleChangelogClose"
    />
  </div>
</template>
