'use client'

import { useState } from 'react'
import { Button } from '../ui/button'
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Grid3x3, 
  MousePointer2,
  Square,
  Filter
} from 'lucide-react'
import { useReactFlow } from 'reactflow'
import { cn } from '../../utils/cn'

interface EnhancedCanvasControlsProps {
  showGrid?: boolean
  snapToGrid?: boolean
  onGridToggle?: (enabled: boolean) => void
  onSnapToggle?: (enabled: boolean) => void
  className?: string
}

export function EnhancedCanvasControls({
  showGrid = false,
  snapToGrid = false,
  onGridToggle,
  onSnapToggle,
  className
}: EnhancedCanvasControlsProps) {
  const { zoomIn, zoomOut, fitView } = useReactFlow()
  const [minimapFilter, setMinimapFilter] = useState<string>('all')

  return (
    <div className={cn('flex flex-col gap-2 p-2 bg-background border rounded-lg shadow-lg', className)}>
      <div className="flex flex-col gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => zoomIn()}
          className="h-7 w-7 p-0"
          title="Zoom In"
        >
          <ZoomIn className="h-3 w-3" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => zoomOut()}
          className="h-7 w-7 p-0"
          title="Zoom Out"
        >
          <ZoomOut className="h-3 w-3" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fitView({ padding: 0.2 })}
          className="h-7 w-7 p-0"
          title="Zoom to Fit"
        >
          <Maximize2 className="h-3 w-3" />
        </Button>
      </div>
      <div className="border-t pt-1">
        <Button
          variant={showGrid ? 'default' : 'outline'}
          size="sm"
          onClick={() => onGridToggle?.(!showGrid)}
          className="h-7 w-7 p-0"
          title="Toggle Grid"
        >
          <Grid3x3 className="h-3 w-3" />
        </Button>
        <Button
          variant={snapToGrid ? 'default' : 'outline'}
          size="sm"
          onClick={() => onSnapToggle?.(!snapToGrid)}
          className="h-7 w-7 p-0 mt-1"
          title="Snap to Grid"
        >
          <Square className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}

