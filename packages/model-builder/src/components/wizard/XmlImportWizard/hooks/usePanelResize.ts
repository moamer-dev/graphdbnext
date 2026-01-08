import { useState, useEffect, useRef } from 'react'

interface UsePanelResizeOptions {
  initialWidth?: number
  minWidth?: number
  maxWidth?: number
}

export function usePanelResize({
  initialWidth = 50,
  minWidth = 20,
  maxWidth = 80
}: UsePanelResizeOptions = {}) {
  const [panelWidth, setPanelWidth] = useState(initialWidth)
  const [isResizing, setIsResizing] = useState(false)
  const panelsContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !panelsContainerRef.current) return
      
      const containerRect = panelsContainerRef.current.getBoundingClientRect()
      const newPanelWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100
      
      const constrainedWidth = Math.max(minWidth, Math.min(maxWidth, newPanelWidth))
      setPanelWidth(constrainedWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isResizing, minWidth, maxWidth])

  const startResizing = () => {
    setIsResizing(true)
  }

  return {
    panelWidth,
    isResizing,
    panelsContainerRef,
    startResizing
  }
}

