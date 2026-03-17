import type { ComponentPublicInstance } from 'vue'

interface MessageAction {
  label: string
  onClick: () => void
}

interface Message {
  title?: string
  text: string
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  duration?: number
  action?: MessageAction
}

// Instance globale du composant Messages
let messagesInstance: ComponentPublicInstance | null = null

/**
 * Enregistrer l'instance du composant Messages
 */
export const setMessagesInstance = (instance: ComponentPublicInstance) => {
  messagesInstance = instance
}

/**
 * Composable pour afficher des messages
 */
export function useMessages() {
  /**
   * Afficher un message
   */
  const showMessage = (config: Message): string | null => {
    if (!messagesInstance) {
      console.warn('Messages instance not found. Make sure to include <Messages ref="messages" /> in your app.')
      return null
    }

    return (messagesInstance as any).addMessage(config)
  }

  /**
   * Raccourcis pour les différents types de messages
   */
  const success = (text: string, title?: string, duration = 5000, action?: MessageAction): string | null => {
    return showMessage({ text, title, variant: 'success', duration, action })
  }

  const error = (text: string, title?: string, duration = 7000, action?: MessageAction): string | null => {
    return showMessage({ text, title, variant: 'danger', duration, action })
  }

  const warning = (text: string, title?: string, duration = 6000, action?: MessageAction): string | null => {
    return showMessage({ text, title, variant: 'warning', duration, action })
  }

  const info = (text: string, title?: string, duration = 5000, action?: MessageAction): string | null => {
    return showMessage({ text, title, variant: 'info', duration, action })
  }

  const primary = (text: string, title?: string, duration = 5000, action?: MessageAction): string | null => {
    return showMessage({ text, title, variant: 'primary', duration, action })
  }

  /**
   * Supprimer un message par ID
   */
  const removeMessage = (id: string) => {
    if (!messagesInstance) return
    ;(messagesInstance as any).removeMessage(id)
  }

  /**
   * Fermer tous les messages
   */
  const clearAll = () => {
    if (!messagesInstance) return
    ;(messagesInstance as any).clearAll()
  }

  return {
    showMessage,
    success,
    error,
    warning,
    info,
    primary,
    removeMessage,
    clearAll
  }
}
