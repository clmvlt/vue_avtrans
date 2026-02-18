<template>
  <div class="relative inline-block" ref="notificationsContainer">
    <Button
      variant="ghost"
      size="icon"
      @click="toggleDropdown"
      title="Notifications"
      class="relative"
    >
      <Bell class="size-5 text-muted-foreground" />
      <span
        v-if="unreadCount > 0"
        class="absolute -right-0.5 -top-0.5 flex size-[18px] items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground"
      >
        {{ unreadCount > 99 ? '99+' : unreadCount }}
      </span>
    </Button>

    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="scale-95 opacity-0"
        enter-to-class="scale-100 opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="scale-100 opacity-100"
        leave-to-class="scale-95 opacity-0"
      >
        <div
          v-if="isOpen"
          class="fixed z-50 flex w-[420px] max-w-[calc(100vw-24px)] flex-col overflow-hidden rounded-lg border bg-popover shadow-lg"
          :style="{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            maxHeight: '600px'
          }"
        >
          <!-- Header -->
          <div class="flex items-center justify-between gap-4 border-b bg-muted/50 px-5 py-3">
            <div class="flex items-center gap-3">
              <Bell class="size-4 text-primary" />
              <h3 class="text-sm font-bold text-foreground">Notifications</h3>
              <span v-if="unreadCount > 0" class="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
                {{ unreadCount }}
              </span>
            </div>
            <Button
              v-if="unreadCount > 0"
              variant="ghost"
              size="sm"
              :disabled="markingAllAsRead"
              @click="handleMarkAllAsRead"
            >
              <CheckCheck class="size-3.5" />
              {{ markingAllAsRead ? '...' : 'Tout lu' }}
            </Button>
          </div>

          <!-- List -->
          <div class="max-h-[450px] flex-1 overflow-y-auto">
            <!-- Loading -->
            <div v-if="loading" class="flex flex-col items-center gap-3 py-10 text-muted-foreground">
              <LoaderCircle class="size-8 animate-spin text-primary" />
              <p class="text-sm">Chargement...</p>
            </div>

            <!-- Error -->
            <div v-else-if="error" class="flex flex-col items-center gap-3 py-10 text-destructive">
              <AlertTriangle class="size-8" />
              <p class="text-sm">{{ error }}</p>
            </div>

            <!-- Empty -->
            <div v-else-if="notifications.length === 0" class="flex flex-col items-center gap-3 py-10 text-muted-foreground">
              <Inbox class="size-12 opacity-50" />
              <p class="text-sm">Aucune notification</p>
            </div>

            <!-- Items -->
            <div
              v-else
              v-for="notification in notifications"
              :key="notification.uuid"
              class="flex cursor-pointer gap-3 border-b px-5 py-4 transition-colors last:border-b-0 hover:bg-accent"
              :class="!notification.isRead && 'border-l-[3px] border-l-primary bg-primary/5 hover:bg-primary/10'"
              @click="handleNotificationClick(notification)"
            >
              <div class="flex size-10 shrink-0 items-center justify-center rounded-md border bg-muted text-muted-foreground">
                <component :is="getNotificationIcon(notification.refType)" class="size-4" />
              </div>
              <div class="flex min-w-0 flex-1 flex-col gap-1">
                <div class="flex items-start justify-between gap-2">
                  <h4 class="text-sm font-semibold leading-tight text-foreground">{{ notification.title }}</h4>
                  <span v-if="!notification.isRead" class="mt-1 size-2 shrink-0 rounded-full bg-primary"></span>
                </div>
                <p class="line-clamp-2 text-xs text-muted-foreground">{{ notification.description }}</p>
                <div class="mt-0.5 flex items-center justify-between gap-2">
                  <span class="text-xs text-muted-foreground/70">{{ formatTime(notification.createdAt) }}</span>
                  <Badge v-if="notification.refType" variant="outline" class="text-[10px]">
                    {{ getRefTypeLabel(notification.refType) }}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="flex gap-2 border-t bg-muted/50 px-4 py-3">
            <Button variant="outline" size="sm" class="flex-1" @click="goToNotifications">
              <List class="size-3.5" />
              Voir tout
            </Button>
            <Button
              :variant="soundEnabled ? 'ghost' : 'secondary'"
              size="sm"
              :title="soundEnabled ? 'Couper le son' : 'Activer le son'"
              @click="toggleSound"
            >
              <Volume2 v-if="soundEnabled" class="size-3.5" />
              <VolumeX v-else class="size-3.5" />
              {{ soundEnabled ? 'Son activé' : 'Son coupé' }}
            </Button>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { notificationsService } from '@/services/notifications'
import { getFaviconBadgeInstance } from '@/composables/useFaviconBadge'

// shadcn components
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

// Lucide icons
import {
  Bell,
  CheckCheck,
  LoaderCircle,
  AlertTriangle,
  Inbox,
  List,
  Volume2,
  VolumeX,
  Wrench,
  Car,
  CalendarX,
  Banknote,
  UserPlus,
  ListChecks,
} from 'lucide-vue-next'

const router = useRouter()
const faviconBadge = getFaviconBadgeInstance()

const SOUND_ENABLED_KEY = 'notifications_sound_enabled'

const isOpen = ref(false)
const notifications = ref<any[]>([])
const unreadCount = ref(0)
const loading = ref(false)
const error = ref('')
const markingAllAsRead = ref(false)
const notificationsContainer = ref<HTMLElement | null>(null)
const dropdownPosition = ref({ top: 0, left: 0 })
const originalTitle = ref('')
const soundEnabled = ref(true)

let pollInterval: number | null = null
let notificationAudio: HTMLAudioElement | null = null
let previousUnreadCount = -1 // -1 = pas encore initialisé (premier chargement)
let isFirstLoad = true

// Charger la préférence de son depuis localStorage
const loadSoundPreference = () => {
  const saved = localStorage.getItem(SOUND_ENABLED_KEY)
  if (saved !== null) {
    soundEnabled.value = saved === 'true'
  }
}

// Sauvegarder la préférence de son
const saveSoundPreference = () => {
  localStorage.setItem(SOUND_ENABLED_KEY, String(soundEnabled.value))
}

// Toggle le son
const toggleSound = () => {
  soundEnabled.value = !soundEnabled.value
  saveSoundPreference()
}

// Initialiser l'élément audio pour le son de notification
const initAudio = () => {
  if (!notificationAudio) {
    notificationAudio = new Audio('/sounds/notif.wav')
    notificationAudio.volume = 0.5
  }
}

// Mettre à jour le titre du document et le favicon avec le nombre de notifications
const updateDocumentTitle = (count: number) => {
  if (!originalTitle.value) {
    // Stocker le titre original (sans les notifications)
    originalTitle.value = document.title.replace(/^\(\d+\)\s*/, '')
  }

  if (count > 0) {
    document.title = `(${count}) ${originalTitle.value}`
  } else {
    document.title = originalTitle.value
  }

  // Mettre à jour le badge sur le favicon
  faviconBadge.setBadgeCount(count)
}

// Jouer le son de notification
const playNotificationSound = () => {
  // Vérifier si le son est activé
  if (!soundEnabled.value) {
    return
  }

  try {
    initAudio()
    if (notificationAudio) {
      notificationAudio.currentTime = 0
      notificationAudio.play().catch(() => {
        // L'utilisateur n'a pas encore interagi avec la page - ignorer silencieusement
      })
    }
  } catch {
    // Ignorer les erreurs de lecture audio
  }
}

// Charger les notifications
const loadNotifications = async () => {
  try {
    // Ne pas mettre loading à true si on a déjà des notifications (polling silencieux)
    if (notifications.value.length === 0) {
      loading.value = true
    }
    error.value = ''
    const response = await notificationsService.getUnreadNotifications()
    const newNotifications = response.notifications || []

    // Calculer le count à partir des notifications réellement reçues
    const actualCount = newNotifications.filter((n: any) => !n.isRead).length

    // Vérifier s'il y a de nouvelles notifications (seulement après le premier chargement)
    if (!isFirstLoad && actualCount > previousUnreadCount) {
      playNotificationSound()
    }

    // Mettre à jour le compteur précédent pour la prochaine comparaison
    previousUnreadCount = actualCount
    isFirstLoad = false

    notifications.value = newNotifications
    unreadCount.value = actualCount

    // Mettre à jour le titre
    updateDocumentTitle(actualCount)
  } catch (err: any) {
    error.value = err.message || 'Erreur lors du chargement'
    unreadCount.value = 0
    updateDocumentTitle(0)
  } finally {
    loading.value = false
  }
}

// Get icon component based on type
const getNotificationIcon = (refType?: string) => {
  switch (refType) {
    case 'entretien':
      return Wrench
    case 'vehicule':
      return Car
    case 'absence':
      return CalendarX
    case 'acompte':
      return Banknote
    case 'user':
      return UserPlus
    case 'todo':
      return ListChecks
    default:
      return Bell
  }
}

// Get type label
const getRefTypeLabel = (refType?: string): string => {
  switch (refType) {
    case 'entretien':
      return 'Entretien'
    case 'vehicule':
      return 'Véhicule'
    case 'absence':
      return 'Absence'
    case 'acompte':
      return 'Acompte'
    case 'user':
      return 'Utilisateur'
    case 'todo':
      return 'Tâche'
    default:
      return 'Général'
  }
}

// Calculer la position du dropdown
const calculateDropdownPosition = () => {
  if (!notificationsContainer.value) return

  const rect = notificationsContainer.value.getBoundingClientRect()
  const dropdownWidth = 420
  const dropdownMaxHeight = 600
  const padding = 12

  // Position par défaut : en dessous à droite du bouton
  let top = rect.bottom + padding
  let left = rect.right - dropdownWidth

  // Ajuster si déborde à gauche
  if (left < padding) {
    left = rect.left
  }

  // Si déborde toujours, centrer sur l'écran
  if (left + dropdownWidth > window.innerWidth - padding) {
    left = Math.max(padding, window.innerWidth - dropdownWidth - padding)
  }

  // Ajuster si déborde en bas
  const availableSpaceBelow = window.innerHeight - rect.bottom - padding
  const availableSpaceAbove = rect.top - padding

  if (availableSpaceBelow < dropdownMaxHeight && availableSpaceAbove > availableSpaceBelow) {
    // Afficher au-dessus si plus d'espace
    top = rect.top - dropdownMaxHeight - padding
    // S'assurer que ça ne déborde pas en haut
    if (top < padding) {
      top = padding
    }
  }

  dropdownPosition.value = { top, left }
}

// Toggle dropdown
const toggleDropdown = () => {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    calculateDropdownPosition()
    if (notifications.value.length === 0) {
      loadNotifications()
    }
  }
}

// Fermer le dropdown
const closeDropdown = () => {
  isOpen.value = false
}

// Aller à la page des notifications
const goToNotifications = () => {
  closeDropdown()
  router.push('/notifications')
}

// Gérer le clic sur une notification
const handleNotificationClick = async (notification: any) => {
  try {
    // Marquer comme lue si non lue
    if (!notification.isRead) {
      await notificationsService.markAsRead(notification.uuid)
      notification.isRead = true

      // Recalculer le count à partir des notifications en mémoire
      const actualUnreadCount = notifications.value.filter(n => !n.isRead).length
      unreadCount.value = actualUnreadCount
      updateDocumentTitle(actualUnreadCount)
    }

    closeDropdown()

    // Naviguer selon le type de référence
    if (notification.refType && notification.refId) {
      switch (notification.refType) {
        case 'entretien':
          router.push(`/entretiens`)
          break
        case 'vehicule':
          router.push(`/vehicules/${notification.refId}`)
          break
        case 'absence':
          router.push('/absences')
          break
        case 'acompte':
          router.push('/acomptes')
          break
        case 'user':
          router.push('/users')
          break
        case 'todo':
          router.push('/todos')
          break
        default:
          router.push('/notifications')
      }
    } else {
      router.push('/notifications')
    }
  } catch {
    // Ignorer les erreurs de navigation
  }
}

// Marquer toutes comme lues
const handleMarkAllAsRead = async () => {
  try {
    markingAllAsRead.value = true
    await notificationsService.markAllAsRead()

    // Mettre à jour toutes les notifications
    notifications.value.forEach(n => n.isRead = true)
    unreadCount.value = 0
    updateDocumentTitle(0)
  } catch {
    // Ignorer les erreurs
  } finally {
    markingAllAsRead.value = false
  }
}

// Formater le temps
const formatTime = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'À l\'instant'
  if (minutes < 60) return `Il y a ${minutes} min`
  if (hours < 24) return `Il y a ${hours}h`
  if (days === 1) return 'Hier'
  if (days < 7) return `Il y a ${days}j`

  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short'
  })
}

// Fermer le dropdown si on clique en dehors
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  const dropdown = document.querySelector('.fixed.z-50.w-\\[420px\\]')

  if (notificationsContainer.value &&
      !notificationsContainer.value.contains(target) &&
      dropdown &&
      !dropdown.contains(target)) {
    closeDropdown()
  }
}

// Polling des notifications toutes les 5 secondes
const startPolling = () => {
  pollInterval = window.setInterval(() => {
    loadNotifications()
  }, 5000) // 5 secondes
}

const stopPolling = () => {
  if (pollInterval) {
    clearInterval(pollInterval)
    pollInterval = null
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  window.addEventListener('resize', calculateDropdownPosition)

  // Charger la préférence de son
  loadSoundPreference()

  // Stocker le titre original
  originalTitle.value = document.title.replace(/^\(\d+\)\s*/, '')

  // Charger les notifications complètes immédiatement au montage
  loadNotifications()

  // Démarrer le polling pour les mises à jour futures
  startPolling()
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('resize', calculateDropdownPosition)
  stopPolling()

  // Restaurer le titre original
  if (originalTitle.value) {
    document.title = originalTitle.value
  }

  // Restaurer le favicon original
  faviconBadge.clearBadge()
})
</script>
