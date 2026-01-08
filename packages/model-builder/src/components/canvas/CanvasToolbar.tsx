'use client'

import { useState } from 'react'
import { useModelBuilderStore } from '../../stores/modelBuilderStore'
import { useToolCanvasStore } from '../../stores/toolCanvasStore'
import { useActionCanvasStore } from '../../stores/actionCanvasStore'
import { useFullscreen } from '../../hooks'
import { Button } from '../ui/button'
import { ConfirmDialog } from '../dialogs/ConfirmDialog'
import {
  Maximize2,
  Minimize2,
  Layout,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  PanelRightClose,
  PanelRightOpen,
  Trash2,
  Grid3x3,
  Square
} from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '../ui/tooltip'

interface CanvasToolbarProps {
  canvasRef?: React.RefObject<HTMLDivElement | null>
  sidebarOpen?: boolean
  onToggleSidebar?: () => void
  onFullscreen?: (fullscreen: boolean) => void
  onZoomIn?: () => void
  onZoomOut?: () => void
  onFitView?: () => void
  showGrid?: boolean
  snapToGrid?: boolean
  onGridToggle?: (enabled: boolean) => void
  onSnapToggle?: (enabled: boolean) => void
}

export function CanvasToolbar ({
  canvasRef,
  sidebarOpen,
  onToggleSidebar,
  onFullscreen,
  onZoomIn,
  onZoomOut,
  onFitView,
  showGrid = false,
  snapToGrid = false,
  onGridToggle,
  onSnapToggle
}: CanvasToolbarProps) {
  const [showClearDialog, setShowClearDialog] = useState(false)
  const organizeLayout = useModelBuilderStore((state) => state.organizeLayout)
  const clear = useModelBuilderStore((state) => state.clear)
  const { isFullscreen, toggleFullscreen } = useFullscreen({ onFullscreenChange: onFullscreen })

  const handleFullscreen = () => {
    if (canvasRef?.current) {
      toggleFullscreen(canvasRef.current)
    }
  }

  const handleOrganize = () => {
    organizeLayout()
    // Small delay to ensure layout is applied before fitting view
    setTimeout(() => {
      onFitView?.()
    }, 100)
  }

  const handleClear = () => {
    setShowClearDialog(true)
  }

  const handleConfirmClear = () => {
    clear()
  }

  return (
    <TooltipProvider>
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-background/95 backdrop-blur-sm border border-border/40 rounded-lg p-1.5 shadow-lg">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleOrganize}
              className="h-8 w-8 p-0"
            >
              <Layout className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Organize Layout</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onFitView}
              className="h-8 w-8 p-0"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Fit View</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Clear All</p>
          </TooltipContent>
        </Tooltip>

        <div className="h-6 w-px bg-border/40" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onZoomIn}
              className="h-8 w-8 p-0"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Zoom In</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onZoomOut}
              className="h-8 w-8 p-0"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Zoom Out</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFullscreen}
              className="h-8 w-8 p-0"
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</p>
          </TooltipContent>
        </Tooltip>


        <div className="h-6 w-px bg-border/40" />

        {onGridToggle && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={showGrid ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onGridToggle(!showGrid)}
                className="h-8 w-8 p-0"
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Toggle Grid</p>
            </TooltipContent>
          </Tooltip>
        )}

        {onSnapToggle && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={snapToGrid ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onSnapToggle(!snapToGrid)}
                className="h-8 w-8 p-0"
              >
                <Square className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Snap to Grid</p>
            </TooltipContent>
          </Tooltip>
        )}

        <div className="h-6 w-px bg-border/40" />

        {onToggleSidebar && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleSidebar}
                className="h-8 w-8 p-0"
              >
                {sidebarOpen ? (
                  <PanelRightClose className="h-4 w-4" />
                ) : (
                  <PanelRightOpen className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{sidebarOpen ? 'Hide Sidebar' : 'Show Sidebar'}</p>
            </TooltipContent>
          </Tooltip>
        )}

        <div className="h-6 w-px bg-border/40" />
      </div>
      <ConfirmDialog
        open={showClearDialog}
        onOpenChange={setShowClearDialog}
        title="Clear All Nodes and Relationships"
        description="Are you sure you want to clear all nodes and relationships? This action cannot be undone."
        confirmText="Clear All"
        cancelText="Cancel"
        onConfirm={handleConfirmClear}
        variant="destructive"
      />
    </TooltipProvider>
  )
}

