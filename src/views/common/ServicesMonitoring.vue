<template>
  <div class="min-h-screen bg-background" @click="closeContextMenu">
    <!-- Sticky Header with Stats -->
    <header class="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div class="mx-auto max-w-[1400px] px-4 py-3 md:px-6">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 class="text-lg font-semibold text-foreground md:text-xl">Suivi des présences</h1>

          <!-- Stats Pills -->
          <div class="flex flex-wrap items-center gap-2">
            <div class="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1 text-sm font-medium text-green-600 dark:text-green-400">
              <span class="size-2 rounded-full bg-green-500" />
              <span>{{ presentUsers.length }}</span>
              <span class="hidden sm:inline">présents</span>
            </div>
            <div class="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-sm font-medium text-amber-600 dark:text-amber-400">
              <span class="size-2 rounded-full bg-amber-500" />
              <span>{{ onBreakUsers.length }}</span>
              <span class="hidden sm:inline">en pause</span>
            </div>
            <div class="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
              <span class="size-2 rounded-full bg-muted-foreground" />
              <span>{{ absentUsers.length }}</span>
              <span class="hidden sm:inline">absents</span>
            </div>
          </div>
        </div>
      </div>
    </header>

    <main class="px-4 py-4 md:px-6 md:py-6">
      <div class="mx-auto max-w-[1400px]">
        <!-- Loading -->
        <div v-if="loading" class="flex flex-col items-center justify-center gap-4 py-16">
          <LoaderCircle class="size-10 animate-spin text-primary" />
          <p class="text-lg text-muted-foreground">Chargement des services...</p>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="mb-4 rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
          {{ error }}
        </div>

        <!-- Content -->
        <div v-else class="space-y-6">
          <!-- Search bar -->
          <div class="relative">
            <Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              v-model="searchQuery"
              type="search"
              placeholder="Rechercher un employé..."
              class="pl-9"
            />
          </div>

          <!-- Section Présents -->
          <section v-if="filteredPresentUsers.length > 0">
            <h2 class="mb-3 flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">
              <span class="size-2 rounded-full bg-green-500" />
              Présents ({{ filteredPresentUsers.length }})
            </h2>
            <TransitionGroup
              name="card-list"
              tag="div"
              class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
            >
              <UserCard
                v-for="user in filteredPresentUsers"
                :key="user.uuid"
                :user="user"
                status-color="green"
                @contextmenu="openContextMenu($event, user)"
                @open-hours="openHoursModal"
                @go-absences="goToAbsences"
                @go-acomptes="goToAcomptes"
              />
            </TransitionGroup>
          </section>

          <!-- Section En pause -->
          <section v-if="filteredOnBreakUsers.length > 0">
            <h2 class="mb-3 flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">
              <span class="size-2 rounded-full bg-amber-500" />
              En pause ({{ filteredOnBreakUsers.length }})
            </h2>
            <TransitionGroup
              name="card-list"
              tag="div"
              class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
            >
              <UserCard
                v-for="user in filteredOnBreakUsers"
                :key="user.uuid"
                :user="user"
                status-color="amber"
                @contextmenu="openContextMenu($event, user)"
                @open-hours="openHoursModal"
                @go-absences="goToAbsences"
                @go-acomptes="goToAcomptes"
              />
            </TransitionGroup>
          </section>

          <!-- Section Absents (collapsible) -->
          <section v-if="filteredAbsentUsers.length > 0">
            <button
              class="-mx-2 mb-3 flex w-[calc(100%+1rem)] items-center justify-between rounded-lg px-2 py-2 transition-colors hover:bg-muted"
              @click="showAbsent = !showAbsent"
            >
              <h2 class="flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">
                <span class="size-2 rounded-full bg-muted-foreground" />
                Absents ({{ filteredAbsentUsers.length }})
              </h2>
              <ChevronRight :class="['size-4 text-muted-foreground transition-transform', showAbsent && 'rotate-90']" />
            </button>
            <Transition
              enter-active-class="transition-all duration-200 ease-out"
              enter-from-class="opacity-0 -translate-y-2"
              enter-to-class="opacity-100 translate-y-0"
              leave-active-class="transition-all duration-150 ease-in"
              leave-from-class="opacity-100 translate-y-0"
              leave-to-class="opacity-0 -translate-y-2"
            >
              <div
                v-if="showAbsent"
                class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
              >
                <UserCard
                  v-for="user in filteredAbsentUsers"
                  :key="user.uuid"
                  :user="user"
                  status-color="gray"
                  @contextmenu="openContextMenu($event, user)"
                  @open-hours="openHoursModal"
                  @go-absences="goToAbsences"
                  @go-acomptes="goToAcomptes"
                />
              </div>
            </Transition>
          </section>

          <!-- Empty state -->
          <div
            v-if="filteredPresentUsers.length === 0 && filteredOnBreakUsers.length === 0 && filteredAbsentUsers.length === 0"
            class="flex flex-col items-center gap-3 py-16 text-muted-foreground"
          >
            <Users class="size-12 opacity-50" />
            <p class="text-lg">Aucun employé trouvé</p>
            <Button v-if="searchQuery" variant="outline" size="sm" @click="searchQuery = ''">
              Effacer la recherche
            </Button>
          </div>
        </div>
      </div>
    </main>

    <!-- Context menu (right-click) -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-100 ease-out"
        enter-from-class="opacity-0 scale-95"
        enter-to-class="opacity-100 scale-100"
        leave-active-class="transition duration-75 ease-in"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95"
      >
        <div
          v-if="contextMenu.show"
          ref="contextMenuRef"
          class="fixed z-50 min-w-[12rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
          :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }"
          @click.stop
        >
          <div class="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
            {{ contextMenu.user?.firstName }} {{ contextMenu.user?.lastName }}
          </div>
          <div class="-mx-1 my-1 h-px bg-border" />
          <button
            class="flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            @click="handleContextAction('services')"
          >
            <ClipboardList class="size-4" />
            Gérer les services
          </button>
          <button
            class="flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            @click="handleContextAction('heures')"
          >
            <Clock class="size-4" />
            Heures
          </button>
          <div class="-mx-1 my-1 h-px bg-border" />
          <button
            class="flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            @click="handleContextAction('absences')"
          >
            <CalendarX2 class="size-4" />
            Absences
          </button>
          <button
            class="flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            @click="handleContextAction('acomptes')"
          >
            <Banknote class="size-4" />
            Acomptes
          </button>
        </div>
      </Transition>
    </Teleport>

    <!-- Hours modal -->
    <UserHoursModal ref="hoursModalRef" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, defineComponent, h } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { usersService } from '@/services'
import type { UserWithStatusDTO } from '@/models'
import UserHoursModal from '@/components/users/UserHoursModal.vue'

// shadcn components
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// Lucide icons
import {
  LoaderCircle,
  Search,
  Users,
  ClipboardList,
  CalendarX2,
  Banknote,
  Clock,
  MoreVertical,
  ChevronRight,
} from 'lucide-vue-next'

// ============================================================================
// UserCard Component (inline)
// ============================================================================
const UserCard = defineComponent({
  name: 'UserCard',
  props: {
    user: { type: Object as () => UserWithStatusDTO, required: true },
    statusColor: { type: String as () => 'green' | 'amber' | 'gray', default: 'gray' },
  },
  emits: ['contextmenu', 'open-hours', 'go-absences', 'go-acomptes'],
  setup(props, { emit }) {
    const getInitials = (firstName?: string, lastName?: string) => {
      const first = firstName ? firstName.charAt(0).toUpperCase() : ''
      const last = lastName ? lastName.charAt(0).toUpperCase() : ''
      return first + last || '?'
    }

    const formatTime = (dateInput?: string | Date) => {
      if (!dateInput) return '-'
      const date = dateInput instanceof Date ? dateInput : new Date(dateInput)
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    }

    const formatHoursToday = (hours?: number) => {
      if (!hours || hours === 0) return '0h00'
      const h = Math.floor(hours)
      const m = Math.round((hours - h) * 60)
      return `${h}h${m.toString().padStart(2, '0')}`
    }


    const dotClass = computed(() => {
      switch (props.statusColor) {
        case 'green': return 'bg-green-500'
        case 'amber': return 'bg-amber-500'
        default: return 'bg-muted-foreground/50'
      }
    })

    const statusText = computed(() => {
      switch (props.user.status) {
        case 'PRESENT': return { label: 'Présent', class: 'text-green-600 dark:text-green-400' }
        case 'ON_BREAK': return { label: 'En pause', class: 'text-amber-600 dark:text-amber-400' }
        default: return { label: 'Absent', class: 'text-muted-foreground' }
      }
    })

    return () =>
      h('div', { class: 'group relative' }, [
        h(
          RouterLink,
          {
            to: `/users/${props.user.uuid}/services`,
            class: 'flex flex-col items-center gap-2 rounded-lg border bg-card p-3 text-center transition-all hover:shadow-md md:gap-3 md:p-4',
            onContextmenu: (e: MouseEvent) => {
              e.preventDefault()
              emit('contextmenu', e, props.user)
            },
          },
          () => [
            // Avatar with status dot
            h('div', { class: 'relative' }, [
              h('div', { class: 'size-12 shrink-0 overflow-hidden rounded-full bg-muted md:size-14' }, [
                props.user.pictureUrl
                  ? h('img', {
                      src: props.user.pictureUrl,
                      alt: props.user.firstName,
                      class: 'size-full object-cover',
                    })
                  : h(
                      'span',
                      {
                        class:
                          'flex size-full items-center justify-center bg-primary text-sm font-semibold text-primary-foreground md:text-base',
                      },
                      getInitials(props.user.firstName, props.user.lastName)
                    ),
              ]),
              h('span', {
                class: [
                  'absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-card md:size-3.5',
                  dotClass.value,
                ],
              }),
            ]),
            // Name
            h('div', { class: 'w-full min-w-0' }, [
              h('p', { class: 'truncate text-sm font-medium text-foreground md:text-base' }, props.user.firstName),
              h('p', { class: 'truncate text-xs text-muted-foreground md:text-sm' }, props.user.lastName),
            ]),
            // Status info
            h('div', { class: 'w-full text-xs text-muted-foreground' }, [
              h('span', { class: statusText.value.class }, statusText.value.label),
              props.user.status !== 'ABSENT' && props.user.activeService?.debut
                ? h('span', { class: 'hidden sm:inline' }, ` · ${formatTime(props.user.activeService?.debut)}`)
                : null,
            ]),
            // Hours today
            props.user.hoursToday !== undefined && props.user.hoursToday > 0
              ? h(
                  'div',
                  { class: 'hidden rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground sm:block' },
                  formatHoursToday(props.user.hoursToday)
                )
              : null,
          ]
        ),
        // Dropdown menu
        h(
          DropdownMenu,
          {},
          {
            default: () => [
              h(
                DropdownMenuTrigger,
                { asChild: true },
                () =>
                  h(
                    Button,
                    {
                      variant: 'secondary',
                      size: 'icon-sm',
                      class: 'absolute right-1.5 top-1.5 opacity-0 transition-opacity group-hover:opacity-100 md:right-2 md:top-2',
                    },
                    () => h(MoreVertical, { class: 'size-4' })
                  )
              ),
              h(
                DropdownMenuContent,
                { align: 'end', class: 'w-48' },
                () => [
                  h(
                    DropdownMenuItem,
                    { onClick: () => window.location.href = `/users/${props.user.uuid}/services` },
                    () => [h(ClipboardList, { class: 'mr-2 size-4' }), 'Services']
                  ),
                  h(
                    DropdownMenuItem,
                    { onClick: () => emit('open-hours', props.user) },
                    () => [h(Clock, { class: 'mr-2 size-4' }), 'Heures']
                  ),
                  h(DropdownMenuSeparator),
                  h(
                    DropdownMenuItem,
                    { onClick: () => emit('go-absences', props.user) },
                    () => [h(CalendarX2, { class: 'mr-2 size-4' }), 'Absences']
                  ),
                  h(
                    DropdownMenuItem,
                    { onClick: () => emit('go-acomptes', props.user) },
                    () => [h(Banknote, { class: 'mr-2 size-4' }), 'Acomptes']
                  ),
                ]
              ),
            ],
          }
        ),
      ])
  },
})

// ============================================================================
// Main component logic
// ============================================================================
const router = useRouter()

// Data
const users = ref<UserWithStatusDTO[]>([])
const loading = ref(true)
const error = ref('')
const searchQuery = ref('')
const showAbsent = ref(false)
let refreshInterval: ReturnType<typeof setInterval> | null = null

// Context menu state
const contextMenu = ref<{
  show: boolean
  x: number
  y: number
  user: UserWithStatusDTO | null
}>({
  show: false,
  x: 0,
  y: 0,
  user: null,
})
const contextMenuRef = ref<HTMLElement | null>(null)

// Hours modal
const hoursModalRef = ref<InstanceType<typeof UserHoursModal> | null>(null)

// Computed - Filter users by status
const presentUsers = computed(() => users.value.filter((user) => user.status === 'PRESENT'))
const onBreakUsers = computed(() => users.value.filter((user) => user.status === 'ON_BREAK'))
const absentUsers = computed(() => users.value.filter((user) => !user.status || user.status === 'ABSENT'))

// Computed - Apply search filter
const filterBySearch = (list: UserWithStatusDTO[]) => {
  if (!searchQuery.value.trim()) return list
  const query = searchQuery.value.toLowerCase()
  return list.filter((user) => {
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase()
    return fullName.includes(query)
  })
}

const filteredPresentUsers = computed(() => filterBySearch(presentUsers.value))
const filteredOnBreakUsers = computed(() => filterBySearch(onBreakUsers.value))
const filteredAbsentUsers = computed(() => filterBySearch(absentUsers.value))

// Context menu handlers
const openContextMenu = async (event: MouseEvent, user: UserWithStatusDTO) => {
  contextMenu.value = {
    show: true,
    x: event.clientX,
    y: event.clientY,
    user,
  }

  await nextTick()

  if (contextMenuRef.value) {
    const rect = contextMenuRef.value.getBoundingClientRect()
    if (rect.right > window.innerWidth) {
      contextMenu.value.x = window.innerWidth - rect.width - 8
    }
    if (rect.bottom > window.innerHeight) {
      contextMenu.value.y = window.innerHeight - rect.height - 8
    }
  }
}

const closeContextMenu = () => {
  contextMenu.value.show = false
}

const handleContextAction = (action: string) => {
  const user = contextMenu.value.user
  if (!user) return

  closeContextMenu()

  switch (action) {
    case 'services':
      router.push(`/users/${user.uuid}/services`)
      break
    case 'absences':
      goToAbsences(user)
      break
    case 'acomptes':
      goToAcomptes(user)
      break
    case 'heures':
      openHoursModal(user)
      break
  }
}

// Navigation helpers
const goToAbsences = (user: UserWithStatusDTO) => {
  router.push({ path: '/absences', query: { userUuid: user.uuid } })
}

const goToAcomptes = (user: UserWithStatusDTO) => {
  router.push({ path: '/acomptes', query: { userUuid: user.uuid } })
}

const openHoursModal = (user: UserWithStatusDTO) => {
  if (user.uuid) {
    hoursModalRef.value?.open(user.uuid, `${user.firstName} ${user.lastName}`)
  }
}

// Keyboard handler
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') closeContextMenu()
}

// Data loading
const loadUsers = async (showLoading = true) => {
  try {
    if (showLoading && users.value.length === 0) {
      loading.value = true
    }
    error.value = ''
    const data = await usersService.getUsersWithStatus()
    users.value = Array.isArray(data) ? data : []
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des services'
    error.value = errorMessage
  } finally {
    loading.value = false
  }
}

const refreshUsers = async () => {
  try {
    const data = await usersService.getUsersWithStatus()
    users.value = Array.isArray(data) ? data : []
  } catch (err: unknown) {
    console.warn('Erreur lors du rafraîchissement:', err instanceof Error ? err.message : 'Erreur inconnue')
  }
}

// Lifecycle
onMounted(() => {
  loadUsers()
  refreshInterval = setInterval(refreshUsers, 10000)
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style>
/* Transition animations - must be global for TransitionGroup */
.card-list-enter-active,
.card-list-leave-active {
  transition: all 0.2s ease;
}

.card-list-enter-from,
.card-list-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.card-list-move {
  transition: transform 0.2s ease;
}
</style>
