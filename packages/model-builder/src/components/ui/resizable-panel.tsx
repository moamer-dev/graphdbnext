'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { GripVertical } from 'lucide-react'

interface ResizablePanelProps {
  children: React.ReactNode
  defaultWidth?: number
  minWidth?: number
  maxWidth?: number
  className?: string
  onWidthChange?: (width: number) => void
}

export function ResizablePanel({
  children,
  defaultWidth = 400,
  minWidth = 300,
  maxWidth = 800,
  className = '',
  onWidthChange
}: ResizablePanelProps) {
  const [width, setWidth] = useState(defaultWidth)
  const [isResizing, setIsResizing] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const startXRef = useRef(0)
  const startWidthRef = useRef(0)

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const deltaX = e.clientX - startXRef.current
    const newWidth = startWidthRef.current - deltaX

    const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth))
    setWidth(clampedWidth)
    onWidthChange?.(clampedWidth)
  }, [minWidth, maxWidth, onWidthChange])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
    startXRef.current = e.clientX
    startWidthRef.current = width

    const handleMouseUp = () => {
      setIsResizing(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [width, handleMouseMove])

  useEffect(() => {
    if (!isResizing) return

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
    }
  }, [isResizing, handleMouseMove])

  return (
    <div
      ref={panelRef}
      className={`relative shrink-0 ${className}`}
      style={{ width: `${width}px` }}
    >
      <div
        className={`absolute -left-1.5 top-0 bottom-0 w-3 cursor-col-resize hover:bg-primary/30 transition-colors z-10 flex items-center justify-center ${isResizing ? 'bg-primary/40' : ''
          }`}
        onMouseDown={handleMouseDown}
      >
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <GripVertical className={`h-5 w-5 transition-colors ${isResizing ? 'text-primary' : 'text-muted-foreground/50'
            }`} />
        </div>
      </div>
      <div className="h-full w-full">{children}</div>
    </div>
  )
}

