import { ref, onMounted, onUnmounted, nextTick, type Ref } from 'vue'

export interface ContextMenuState<T> {
  show: boolean
  x: number
  y: number
  entity: T | null
}

export interface UseContextMenuOptions {
  viewportMargin?: number
}

export interface UseContextMenuReturn<T> {
  state: Ref<ContextMenuState<T>>
  menuRef: Ref<HTMLElement | null>
  open: (event: MouseEvent, entity: T) => Promise<void>
  close: () => void
  handleAction: (action: string, callback: (entity: T, action: string) => void) => void
}

export function useContextMenu<T>(
  options: UseContextMenuOptions = {}
): UseContextMenuReturn<T> {
  const { viewportMargin = 8 } = options

  const state = ref<ContextMenuState<T>>({
    show: false,
    x: 0,
    y: 0,
    entity: null,
  }) as Ref<ContextMenuState<T>>

  const menuRef = ref<HTMLElement | null>(null)

  const open = async (event: MouseEvent, entity: T) => {
    event.preventDefault()

    state.value = {
      show: true,
      x: event.clientX,
      y: event.clientY,
      entity,
    }

    await nextTick()

    if (menuRef.value) {
      const rect = menuRef.value.getBoundingClientRect()

      if (rect.right > window.innerWidth) {
        state.value.x = window.innerWidth - rect.width - viewportMargin
      }
      if (rect.bottom > window.innerHeight) {
        state.value.y = window.innerHeight - rect.height - viewportMargin
      }
      if (state.value.x < viewportMargin) {
        state.value.x = viewportMargin
      }
      if (state.value.y < viewportMargin) {
        state.value.y = viewportMargin
      }
    }
  }

  const close = () => {
    state.value.show = false
  }

  const handleAction = (
    action: string,
    callback: (entity: T, action: string) => void
  ) => {
    const entity = state.value.entity
    close()
    if (entity) {
      callback(entity, action)
    }
  }

  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && state.value.show) {
      close()
    }
  }

  onMounted(() => {
    document.addEventListener('keydown', handleKeydown)
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown)
  })

  return {
    state,
    menuRef,
    open,
    close,
    handleAction,
  }
}
