import type { InjectionKey, Ref } from 'vue'
import { ref, computed, inject, provide, onMounted, onUnmounted } from 'vue'
import { useMediaQuery } from '@vueuse/core'

export const SIDEBAR_WIDTH = '16rem'
export const SIDEBAR_WIDTH_ICON = '3rem'
export const SIDEBAR_COOKIE_NAME = 'sidebar:state'
export const SIDEBAR_KEYBOARD_SHORTCUT = 'b'

export interface SidebarContext {
  state: Ref<'expanded' | 'collapsed'>
  open: Ref<boolean>
  setOpen: (value: boolean) => void
  openMobile: Ref<boolean>
  setOpenMobile: (value: boolean) => void
  isMobile: Ref<boolean>
  toggleSidebar: () => void
}

const SidebarSymbol: InjectionKey<SidebarContext> = Symbol('Sidebar')

export function useSidebar() {
  const context = inject(SidebarSymbol)
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}

export function provideSidebar(defaultOpen = true) {
  const isMobile = useMediaQuery('(max-width: 767px)')
  const openMobile = ref(false)

  // Restore from localStorage
  const storedState = localStorage.getItem(SIDEBAR_COOKIE_NAME)
  const open = ref(storedState !== null ? storedState === 'true' : defaultOpen)

  const setOpen = (value: boolean) => {
    open.value = value
    localStorage.setItem(SIDEBAR_COOKIE_NAME, String(value))
  }

  const setOpenMobile = (value: boolean) => {
    openMobile.value = value
  }

  const toggleSidebar = () => {
    if (isMobile.value) {
      openMobile.value = !openMobile.value
    } else {
      const newValue = !open.value
      open.value = newValue
      localStorage.setItem(SIDEBAR_COOKIE_NAME, String(newValue))
    }
  }

  const state = computed<'expanded' | 'collapsed'>(() =>
    open.value ? 'expanded' : 'collapsed'
  )

  // Keyboard shortcut
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === SIDEBAR_KEYBOARD_SHORTCUT && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      toggleSidebar()
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown)
  })

  const context: SidebarContext = {
    state,
    open,
    setOpen,
    openMobile,
    setOpenMobile,
    isMobile,
    toggleSidebar,
  }

  provide(SidebarSymbol, context)

  return context
}
