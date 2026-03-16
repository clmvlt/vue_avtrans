<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Messages } from '@/components/ui/messages'
import { UpdateBanner } from '@/components/ui/update-banner'
import { ChangelogDialog } from '@/components/ui/changelog'
import { useChangelog } from '@/composables/useChangelog'
import { setMessagesInstance } from '@/composables/useMessages'
import { useVersionCheck } from '@/composables/useVersionCheck'
import { usePermissions } from '@/composables/usePermissions'
import Navbar from '@/components/ui/navbar/Navbar.vue'

const messagesRef = ref()
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { canToggleViewMode, toggleViewMode } = usePermissions()

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
    <!-- Navbar authentifiée -->
    <Navbar
      v-if="showNavbar"
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
    />

    <!-- Contenu principal -->
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
