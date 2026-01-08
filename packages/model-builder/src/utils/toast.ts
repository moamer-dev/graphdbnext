/**
 * Toast notification utilities
 * Uses sonner for toast notifications when available, otherwise falls back to console
 */

let sonnerToast: any = null

// Lazy load sonner toast
function getToast() {
  if (sonnerToast) return sonnerToast
  if (typeof window === 'undefined') return null

  try {
    // Try to get sonner from global scope or require
    if (typeof window !== 'undefined' && (window as any).sonner?.toast) {
      sonnerToast = (window as any).sonner.toast
      return sonnerToast
    }
    
    // Try dynamic import (will be async)
    import('sonner').then((sonner) => {
      sonnerToast = sonner?.toast
    }).catch(() => {
      // Sonner not available
    })
  } catch {
    // Sonner not available
  }

  return null
}

const consoleToast = {
  success: (msg: string) => console.log('✅', msg),
  error: (msg: string) => console.error('❌', msg),
  info: (msg: string) => console.info('ℹ️', msg),
  warning: (msg: string) => console.warn('⚠️', msg),
  loading: (msg: string) => console.log('⏳', msg),
  promise: <T,>(promise: Promise<T>, messages: { loading: string; success: string; error: string }) => {
    console.log('⏳', messages.loading)
    return promise
      .then((result) => {
        console.log('✅', messages.success)
        return result
      })
      .catch((error) => {
        console.error('❌', messages.error, error)
        throw error
      })
  }
}

function callToast(method: string, ...args: any[]) {
  const toast = getToast()
  if (toast && typeof toast[method] === 'function') {
    return toast[method](...args)
  }
  return (consoleToast as any)[method](...args)
}

export const toast = {
  success: (message: string) => callToast('success', message),
  error: (message: string) => callToast('error', message),
  info: (message: string) => callToast('info', message),
  warning: (message: string) => callToast('warning', message),
  loading: (message: string) => callToast('loading', message),
  promise: <T,>(promise: Promise<T>, messages: { loading: string; success: string; error: string }) => {
    const toast = getToast()
    if (toast?.promise) {
      toast.promise(promise, messages)
      return promise
    }
    return consoleToast.promise(promise, messages)
  }
}

