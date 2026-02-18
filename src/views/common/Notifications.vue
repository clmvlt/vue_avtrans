<template>
  <div class="min-h-screen bg-background">
    <main class="px-6 py-6">
      <div class="mx-auto max-w-[1400px]">
        <!-- Header info -->
        <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p class="text-sm text-muted-foreground">
              {{ allNotifications.length }} notification{{ allNotifications.length > 1 ? 's' : '' }}
              <Badge v-if="unreadCount > 0" variant="outline" class="ml-2 border-primary/50 text-primary">
                {{ unreadCount }} non lue{{ unreadCount > 1 ? 's' : '' }}
              </Badge>
            </p>
          </div>
          <div class="flex items-center gap-3">
            <Button
              v-if="isDev"
              variant="outline"
              size="sm"
              class="border-amber-500/50 text-amber-600"
              @click="playTestSound"
            >
              <Volume2 class="size-3.5" />
              Test son
            </Button>
            <Button
              v-if="unreadCount > 0"
              variant="default"
              size="sm"
              :disabled="markingAllAsRead"
              @click="handleMarkAllAsRead"
            >
              <CheckCheck class="size-3.5" />
              {{ markingAllAsRead ? 'Chargement...' : 'Tout marquer comme lu' }}
            </Button>
          </div>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="flex flex-col items-center justify-center gap-4 py-16">
          <LoaderCircle class="size-10 animate-spin text-primary" />
          <p class="text-lg text-muted-foreground">Chargement des notifications...</p>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="mb-4 rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
          <div class="flex items-center gap-3">
            <AlertTriangle class="size-5 shrink-0" />
            {{ error }}
          </div>
        </div>

        <!-- Content -->
        <div v-else>
          <!-- Tabs filter -->
          <Tabs v-model="selectedFilter" class="space-y-4">
            <TabsList>
              <TabsTrigger value="all">
                <List class="mr-1.5 size-3.5" />
                Toutes ({{ allNotifications.length }})
              </TabsTrigger>
              <TabsTrigger value="unread">
                <Mail class="mr-1.5 size-3.5" />
                Non lues ({{ unreadCount }})
              </TabsTrigger>
              <TabsTrigger value="read">
                <MailOpen class="mr-1.5 size-3.5" />
                Lues ({{ readCount }})
              </TabsTrigger>
            </TabsList>

            <!-- All -->
            <TabsContent value="all">
              <!-- Empty -->
              <div v-if="allNotifications.length === 0" class="flex flex-col items-center gap-3 rounded-lg border bg-card py-16 text-center">
                <Inbox class="size-16 text-muted-foreground opacity-50" />
                <h3 class="text-lg font-semibold text-foreground">Aucune notification</h3>
                <p class="text-sm text-muted-foreground">Vous n'avez pas encore reçu de notification.</p>
              </div>
              <!-- List -->
              <div v-else class="flex flex-col gap-3">
                <div
                  v-for="notification in allNotifications"
                  :key="notification.uuid"
                  class="flex cursor-pointer gap-4 rounded-lg border bg-card p-4 shadow-sm transition-all hover:border-primary hover:shadow-md"
                  :class="!notification.isRead && 'border-l-4 border-l-primary bg-primary/[0.02]'"
                  @click="handleNotificationClick(notification)"
                >
                  <div class="flex size-12 shrink-0 items-center justify-center rounded-lg border text-lg" :class="getIconClasses(notification.refType)">
                    <component :is="getNotificationIcon(notification.refType)" class="size-5" />
                  </div>
                  <div class="flex min-w-0 flex-1 flex-col gap-2">
                    <div class="flex items-start justify-between gap-2">
                      <h3 class="text-sm font-semibold leading-snug text-foreground">{{ notification.title }}</h3>
                      <span v-if="!notification.isRead" class="mt-1 size-2.5 shrink-0 rounded-full bg-primary"></span>
                    </div>
                    <p class="text-sm text-muted-foreground">{{ notification.description }}</p>
                    <div class="flex flex-wrap items-center justify-between gap-2">
                      <span class="flex items-center gap-1.5 text-xs text-muted-foreground/70">
                        <Clock class="size-3" />
                        {{ formatTime(notification.createdAt) }}
                      </span>
                      <Badge v-if="notification.refType" variant="outline" class="text-xs">
                        {{ getRefTypeLabel(notification.refType) }}
                      </Badge>
                    </div>
                  </div>
                  <div class="flex items-start">
                    <Button
                      v-if="!notification.isRead"
                      variant="ghost"
                      size="icon-sm"
                      title="Marquer comme lu"
                      @click.stop="markAsRead(notification)"
                    >
                      <Check class="size-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <!-- Unread -->
            <TabsContent value="unread">
              <div v-if="unreadNotifications.length === 0" class="flex flex-col items-center gap-3 rounded-lg border bg-card py-16 text-center">
                <Inbox class="size-16 text-muted-foreground opacity-50" />
                <h3 class="text-lg font-semibold text-foreground">Aucune notification</h3>
                <p class="text-sm text-muted-foreground">Vous n'avez pas de notification non lue.</p>
              </div>
              <div v-else class="flex flex-col gap-3">
                <div
                  v-for="notification in unreadNotifications"
                  :key="notification.uuid"
                  class="flex cursor-pointer gap-4 rounded-lg border border-l-4 border-l-primary bg-card bg-primary/[0.02] p-4 shadow-sm transition-all hover:border-primary hover:shadow-md"
                  @click="handleNotificationClick(notification)"
                >
                  <div class="flex size-12 shrink-0 items-center justify-center rounded-lg border text-lg" :class="getIconClasses(notification.refType)">
                    <component :is="getNotificationIcon(notification.refType)" class="size-5" />
                  </div>
                  <div class="flex min-w-0 flex-1 flex-col gap-2">
                    <div class="flex items-start justify-between gap-2">
                      <h3 class="text-sm font-semibold leading-snug text-foreground">{{ notification.title }}</h3>
                      <span class="mt-1 size-2.5 shrink-0 rounded-full bg-primary"></span>
                    </div>
                    <p class="text-sm text-muted-foreground">{{ notification.description }}</p>
                    <div class="flex flex-wrap items-center justify-between gap-2">
                      <span class="flex items-center gap-1.5 text-xs text-muted-foreground/70">
                        <Clock class="size-3" />
                        {{ formatTime(notification.createdAt) }}
                      </span>
                      <Badge v-if="notification.refType" variant="outline" class="text-xs">
                        {{ getRefTypeLabel(notification.refType) }}
                      </Badge>
                    </div>
                  </div>
                  <div class="flex items-start">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      title="Marquer comme lu"
                      @click.stop="markAsRead(notification)"
                    >
                      <Check class="size-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <!-- Read -->
            <TabsContent value="read">
              <div v-if="readNotifications.length === 0" class="flex flex-col items-center gap-3 rounded-lg border bg-card py-16 text-center">
                <Inbox class="size-16 text-muted-foreground opacity-50" />
                <h3 class="text-lg font-semibold text-foreground">Aucune notification</h3>
                <p class="text-sm text-muted-foreground">Vous n'avez pas de notification lue.</p>
              </div>
              <div v-else class="flex flex-col gap-3">
                <div
                  v-for="notification in readNotifications"
                  :key="notification.uuid"
                  class="flex cursor-pointer gap-4 rounded-lg border bg-card p-4 shadow-sm transition-all hover:border-primary hover:shadow-md"
                  @click="handleNotificationClick(notification)"
                >
                  <div class="flex size-12 shrink-0 items-center justify-center rounded-lg border text-lg" :class="getIconClasses(notification.refType)">
                    <component :is="getNotificationIcon(notification.refType)" class="size-5" />
                  </div>
                  <div class="flex min-w-0 flex-1 flex-col gap-2">
                    <div class="flex items-start justify-between gap-2">
                      <h3 class="text-sm font-semibold leading-snug text-foreground">{{ notification.title }}</h3>
                    </div>
                    <p class="text-sm text-muted-foreground">{{ notification.description }}</p>
                    <div class="flex flex-wrap items-center justify-between gap-2">
                      <span class="flex items-center gap-1.5 text-xs text-muted-foreground/70">
                        <Clock class="size-3" />
                        {{ formatTime(notification.createdAt) }}
                      </span>
                      <Badge v-if="notification.refType" variant="outline" class="text-xs">
                        {{ getRefTypeLabel(notification.refType) }}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { notificationsService } from '@/services'
import type { NotificationDTO } from '@/models'

// shadcn components
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Lucide icons
import {
  LoaderCircle,
  AlertTriangle,
  CheckCheck,
  Volume2,
  List,
  Mail,
  MailOpen,
  Inbox,
  Check,
  Clock,
  Wrench,
  Car,
  CalendarX,
  Banknote,
  UserPlus,
  ListChecks,
  Bell,
} from 'lucide-vue-next'

type FilterType = 'all' | 'unread' | 'read'

const router = useRouter()

// Mode développement
const isDev = import.meta.env.DEV

const allNotifications = ref<NotificationDTO[]>([])
const loading = ref(true)
const error = ref('')
const selectedFilter = ref<FilterType>('all')
const markingAllAsRead = ref(false)

// Audio pour le test du son
let notificationAudio: HTMLAudioElement | null = null

const playTestSound = () => {
  try {
    if (!notificationAudio) {
      notificationAudio = new Audio('/sounds/notif.wav')
      notificationAudio.volume = 0.5
    }
    notificationAudio.currentTime = 0
    notificationAudio.play().catch(err => {
      console.error('[Notifications] Cannot play test sound:', err.message)
    })
  } catch (err: any) {
    console.error('[Notifications] Cannot play test sound:', err.message)
  }
}

// Computed
const unreadCount = computed(() => allNotifications.value.filter(n => !n.isRead).length)
const readCount = computed(() => allNotifications.value.filter(n => n.isRead).length)
const unreadNotifications = computed(() => allNotifications.value.filter(n => !n.isRead))
const readNotifications = computed(() => allNotifications.value.filter(n => n.isRead))

// Load all notifications
const loadNotifications = async () => {
  try {
    loading.value = true
    error.value = ''
    const response = await notificationsService.getNotifications()
    allNotifications.value = response.notifications ?? []
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Erreur lors du chargement des notifications'
  } finally {
    loading.value = false
  }
}

// Mark single as read
const markAsRead = async (notification: NotificationDTO) => {
  try {
    if (notification.uuid) {
      await notificationsService.markAsRead(notification.uuid)
      notification.isRead = true
    }
  } catch (err) {
    console.error('Error marking notification as read:', err)
  }
}

// Mark all as read
const handleMarkAllAsRead = async () => {
  try {
    markingAllAsRead.value = true
    await notificationsService.markAllAsRead()
    allNotifications.value.forEach(n => n.isRead = true)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Erreur lors de la mise à jour'
  } finally {
    markingAllAsRead.value = false
  }
}

// Handle notification click
const handleNotificationClick = async (notification: NotificationDTO) => {
  try {
    if (!notification.isRead && notification.uuid) {
      await notificationsService.markAsRead(notification.uuid)
      notification.isRead = true
    }

    if (notification.refType && notification.refId) {
      switch (notification.refType) {
        case 'entretien':
          router.push('/entretiens')
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
      }
    }
  } catch (err) {
    console.error('Error handling notification click:', err)
  }
}

// Get icon component based on type
const getNotificationIcon = (refType?: string) => {
  switch (refType) {
    case 'entretien': return Wrench
    case 'vehicule': return Car
    case 'absence': return CalendarX
    case 'acompte': return Banknote
    case 'user': return UserPlus
    case 'todo': return ListChecks
    default: return Bell
  }
}

// Get icon color classes based on type
const getIconClasses = (refType?: string): string => {
  switch (refType) {
    case 'entretien': return 'bg-amber-100 text-amber-600 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800'
    case 'vehicule': return 'bg-violet-100 text-violet-600 border-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-800'
    case 'absence': return 'bg-red-100 text-red-600 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
    case 'acompte': return 'bg-green-100 text-green-600 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'
    case 'user': return 'bg-primary/10 text-primary border-primary/20'
    case 'todo': return 'bg-muted text-muted-foreground border-border'
    default: return 'bg-muted text-muted-foreground border-border'
  }
}

// Get type label
const getRefTypeLabel = (refType?: string): string => {
  switch (refType) {
    case 'entretien': return 'Entretien'
    case 'vehicule': return 'Véhicule'
    case 'absence': return 'Absence'
    case 'acompte': return 'Acompte'
    case 'user': return 'Utilisateur'
    case 'todo': return 'Tâche'
    default: return 'Général'
  }
}

// Format time
const formatTime = (dateString?: Date | string): string => {
  if (!dateString) return ''

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
  if (days < 7) return `Il y a ${days} jours`

  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  })
}

onMounted(() => {
  loadNotifications()
})
</script>
