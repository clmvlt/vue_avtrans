<template>
  <Teleport to="body">
    <div class="pointer-events-none fixed inset-x-3 top-16 z-[1070] mx-auto flex max-w-sm flex-col gap-2 sm:inset-x-auto sm:right-4 sm:left-auto">
      <!-- Liste des messages -->
      <TransitionGroup name="message">
        <div
          v-for="message in messages"
          :key="message.id"
          class="pointer-events-auto relative overflow-hidden flex items-start gap-3 rounded-lg border bg-card p-4 shadow-lg"
          :class="variantBorderClass(message.variant)"
        >
          <!-- Icon -->
          <component
            :is="variantIcon(message.variant)"
            class="size-5 shrink-0"
            :class="variantIconClass(message.variant)"
          />

          <!-- Content -->
          <div class="min-w-0 flex-1">
            <p v-if="message.title" class="text-sm font-semibold text-foreground leading-tight">
              {{ message.title }}
            </p>
            <p
              v-if="message.text"
              class="text-sm text-muted-foreground leading-tight"
              :class="{ 'mt-1': message.title }"
            >
              {{ message.text }}
            </p>
            <button
              v-if="message.action"
              class="mt-2 cursor-pointer text-sm font-medium underline underline-offset-2 transition-colors"
              :class="variantActionClass(message.variant)"
              @click="message.action.onClick(); removeMessage(message.id)"
            >
              {{ message.action.label }}
            </button>
          </div>

          <!-- Close -->
          <button
            class="shrink-0 cursor-pointer rounded-md p-1 text-muted-foreground/60 transition-colors hover:bg-destructive/10 hover:text-destructive"
            @click="removeMessage(message.id)"
            aria-label="Fermer"
          >
            <X class="size-4" />
          </button>

          <!-- Progress bar -->
          <div
            v-if="message.duration && message.duration > 0"
            class="progress-bar absolute bottom-0 left-0 right-0 h-1 origin-left"
            :class="variantProgressClass(message.variant)"
            :style="{ '--progress-duration': `${message.duration}ms` }"
          />
        </div>
      </TransitionGroup>

      <!-- Bouton Tout fermer -->
      <Transition name="fade">
        <button
          v-if="messages.length > 1"
          class="pointer-events-auto cursor-pointer self-end rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground"
          @click="clearAll"
        >
          Tout fermer
        </button>
      </Transition>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { X, CheckCircle2, XCircle, AlertTriangle, Info, CircleDot } from 'lucide-vue-next'
import type { Component } from 'vue'

export interface MessageAction {
  label: string
  onClick: () => void
}

export interface Message {
  id: string
  title?: string
  text: string
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  duration?: number
  action?: MessageAction
}

interface MessageInternal extends Message {
  timeout?: number
}

const messages = ref<MessageInternal[]>([])

const variantIcon = (variant?: string): Component => {
  switch (variant) {
    case 'success': return CheckCircle2
    case 'danger': return XCircle
    case 'warning': return AlertTriangle
    case 'info': return Info
    default: return CircleDot
  }
}

const variantIconClass = (variant?: string): string => {
  switch (variant) {
    case 'success': return 'text-green-600 dark:text-green-400'
    case 'danger': return 'text-destructive'
    case 'warning': return 'text-amber-600 dark:text-amber-400'
    case 'info': return 'text-violet-600 dark:text-violet-400'
    default: return 'text-primary'
  }
}

const variantBorderClass = (variant?: string): string => {
  switch (variant) {
    case 'success': return 'border-green-500/30'
    case 'danger': return 'border-destructive/30'
    case 'warning': return 'border-amber-500/30'
    case 'info': return 'border-violet-500/30'
    default: return 'border-primary/30'
  }
}

const variantActionClass = (variant?: string): string => {
  switch (variant) {
    case 'success': return 'text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300'
    case 'danger': return 'text-destructive hover:text-destructive/80'
    case 'warning': return 'text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300'
    case 'info': return 'text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300'
    default: return 'text-primary hover:text-primary/80'
  }
}

const variantProgressClass = (variant?: string): string => {
  switch (variant) {
    case 'success': return 'bg-green-600 dark:bg-green-400'
    case 'danger': return 'bg-destructive'
    case 'warning': return 'bg-amber-600 dark:bg-amber-400'
    case 'info': return 'bg-violet-600 dark:bg-violet-400'
    default: return 'bg-primary'
  }
}

const addMessage = (config: Omit<Message, 'id'> & { id?: string }): string => {
  const id = config.id || `msg-${Date.now()}-${Math.random()}`
  const duration = config.duration ?? 5000
  const variant = config.variant ?? 'info'

  const message: MessageInternal = {
    id,
    title: config.title,
    text: config.text,
    variant,
    duration
  }

  messages.value.push(message)

  if (duration > 0) {
    message.timeout = window.setTimeout(() => {
      removeMessage(id)
    }, duration)
  }

  return id
}

const removeMessage = (id: string) => {
  const index = messages.value.findIndex(m => m.id === id)
  if (index > -1) {
    const msg = messages.value[index]
    if (msg && msg.timeout) {
      clearTimeout(msg.timeout)
    }
    messages.value.splice(index, 1)
  }
}

const clearAll = () => {
  messages.value.forEach(message => {
    if (message.timeout) {
      clearTimeout(message.timeout)
    }
  })
  messages.value = []
}

defineExpose({
  addMessage,
  removeMessage,
  clearAll
})
</script>

<style scoped>
@keyframes progress {
  from {
    transform: scaleX(1);
  }
  to {
    transform: scaleX(0);
  }
}

.progress-bar {
  animation: progress var(--progress-duration) linear forwards;
}

/* Animations - Messages slide down from top */
.message-enter-active {
  animation: message-in 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.message-leave-active {
  animation: message-out 0.2s ease-in;
}

.message-move {
  transition: transform 0.25s ease;
}

@keyframes message-in {
  from {
    opacity: 0;
    transform: translateY(-10px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes message-out {
  from {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateX(100%) scale(0.95);
  }
}

/* Fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

</style>
