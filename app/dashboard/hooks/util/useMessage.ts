import { useState, useCallback } from 'react'

export type MessageType = 'success' | 'error'

export interface Message {
  type: MessageType
  text: string
}

export function useMessage () {
  const [message, setMessage] = useState<Message | null>(null)

  const showMessage = useCallback((type: MessageType, text: string) => {
    setMessage({ type, text })
  }, [])

  const showSuccess = useCallback((text: string) => {
    showMessage('success', text)
  }, [showMessage])

  const showError = useCallback((text: string) => {
    showMessage('error', text)
  }, [showMessage])

  const clearMessage = useCallback(() => {
    setMessage(null)
  }, [])

  return {
    message,
    showMessage,
    showSuccess,
    showError,
    clearMessage
  }
}

