import { useState, useEffect, useRef, useMemo } from 'react'

interface UseXmlPanelResizeOptions {
  initialLeftWidth?: number
  initialXmlWidth?: number
  minWidth?: number
  maxWidth?: number
}

export function useXmlPanelResize({
  initialLeftWidth = 50,
  initialXmlWidth = 33,
  minWidth = 20,
  maxWidth = 80
}: UseXmlPanelResizeOptions = {}) {
  const [leftWidth, setLeftWidth] = useState(initialLeftWidth)
  const [xmlWidth, setXmlWidth] = useState(initialXmlWidth)
  const [isResizing, setIsResizing] = useState(false)
  const [isResizingXml, setIsResizingXml] = useState(false)
  const [isDetailsPanelOpen, setIsDetailsPanelOpen] = useState(false)
  const [isXmlPanelOpen, setIsXmlPanelOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const resizeRef = useRef<HTMLDivElement>(null)
  const xmlResizeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return
      
      const containerRect = containerRef.current.getBoundingClientRect()
      const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100
      
      const constrainedWidth = Math.max(minWidth, Math.min(maxWidth, newLeftWidth))
      setLeftWidth(constrainedWidth)
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

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingXml || !containerRef.current) return
      
      const containerRect = containerRef.current.getBoundingClientRect()
      const relativeX = e.clientX - containerRect.left
      const totalWidth = containerRect.width
      const treeWidth = (leftWidth / 100) * totalWidth
      const remainingWidth = totalWidth - treeWidth
      const xmlRelativeX = relativeX - treeWidth
      
      if (remainingWidth > 0) {
        const newXmlWidth = (xmlRelativeX / remainingWidth) * 100
        const constrainedWidth = Math.max(10, Math.min(90, newXmlWidth))
        setXmlWidth(constrainedWidth)
      }
    }

    const handleMouseUp = () => {
      setIsResizingXml(false)
    }

    if (isResizingXml) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isResizingXml, leftWidth])

  const panelWidths = useMemo(() => {
    if (!isDetailsPanelOpen && !isXmlPanelOpen) {
      return { tree: 100, xml: 0, details: 0 }
    } else if (isDetailsPanelOpen && !isXmlPanelOpen) {
      return { tree: leftWidth, xml: 0, details: 100 - leftWidth }
    } else if (!isDetailsPanelOpen && isXmlPanelOpen) {
      return { tree: leftWidth, xml: 100 - leftWidth, details: 0 }
    } else {
      const treeW = leftWidth
      const remaining = 100 - leftWidth
      const xmlW = (xmlWidth / 100) * remaining
      const detailsW = remaining - xmlW
      return { tree: treeW, xml: xmlW, details: detailsW }
    }
  }, [leftWidth, xmlWidth, isDetailsPanelOpen, isXmlPanelOpen])

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }

  const handleXmlMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizingXml(true)
  }

  return {
    leftWidth,
    xmlWidth,
    isResizing,
    isResizingXml,
    isDetailsPanelOpen,
    isXmlPanelOpen,
    containerRef,
    resizeRef,
    xmlResizeRef,
    setLeftWidth,
    setXmlWidth,
    setIsDetailsPanelOpen,
    setIsXmlPanelOpen,
    panelWidths,
    handleMouseDown,
    handleXmlMouseDown
  }
}

