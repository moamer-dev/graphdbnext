import { useState, useEffect } from 'react'

interface UseFullscreenOptions {
  onFullscreenChange?: (isFullscreen: boolean) => void
}

/**
 * Hook for managing fullscreen state
 */
export function useFullscreen (options: UseFullscreenOptions = {}) {
  const { onFullscreenChange } = options
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!document.fullscreenElement
      setIsFullscreen(isCurrentlyFullscreen)
      onFullscreenChange?.(isCurrentlyFullscreen)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [onFullscreenChange])

  const requestFullscreen = async (element: HTMLElement) => {
    try {
      await element.requestFullscreen()
    } catch (err) {
      console.error('Error attempting to enable fullscreen:', err)
    }
  }

  const exitFullscreen = async () => {
    try {
      await document.exitFullscreen()
    } catch (err) {
      console.error('Error attempting to exit fullscreen:', err)
    }
  }

  const toggleFullscreen = (element: HTMLElement | null) => {
    if (!element) return

    if (!document.fullscreenElement) {
      requestFullscreen(element)
    } else {
      exitFullscreen()
    }
  }

  return {
    isFullscreen,
    requestFullscreen,
    exitFullscreen,
    toggleFullscreen
  }
}

