'use client'

import { useState } from 'react'
import { MiniMap } from 'reactflow'
import { Button } from '../ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Filter, X } from 'lucide-react'
import { cn } from '../../utils/cn'

interface EnhancedMiniMapProps {
  nodeTypes?: string[]
  onFilterChange?: (filter: string) => void
  className?: string
}

export function EnhancedMiniMap({
  nodeTypes = [],
  onFilterChange,
  className
}: EnhancedMiniMapProps) {
  const [filter, setFilter] = useState<string>('all')
  const [isExpanded, setIsExpanded] = useState(false)

  const handleFilterChange = (value: string) => {
    setFilter(value)
    onFilterChange?.(value)
  }

  const nodeColor = (node: { type?: string }) => {
    if (filter !== 'all' && node.type !== filter) {
      return '#e5e7eb' // Gray for filtered out
    }
    
    switch (node.type) {
      case 'custom':
        return '#3b82f6' // Blue
      case 'tool':
        return '#8b5cf6' // Purple
      case 'action':
        return '#10b981' // Green
      case 'actionGroup':
        return '#f59e0b' // Amber
      default:
        return '#6b7280' // Gray
    }
  }

  return (
    <div className={cn('relative', className)}>
      <MiniMap
        nodeColor={nodeColor}
        nodeStrokeWidth={2}
        maskColor="rgba(0, 0, 0, 0.1)"
        pannable
        zoomable
        className="bg-muted/50 border rounded-lg"
        style={{
          width: isExpanded ? 200 : 150,
          height: isExpanded ? 150 : 100
        }}
      />
      <div className="absolute top-1 right-1 flex gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-6 w-6 p-0"
          title={isExpanded ? 'Collapse' : 'Expand'}
        >
          {isExpanded ? <X className="h-3 w-3" /> : <Filter className="h-3 w-3" />}
        </Button>
      </div>
      {isExpanded && (
        <div className="absolute top-8 right-1 bg-background border rounded-lg p-2 shadow-lg z-10 min-w-[150px]">
          <Select value={filter} onValueChange={handleFilterChange}>
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Nodes</SelectItem>
              <SelectItem value="custom">Schema Nodes</SelectItem>
              <SelectItem value="tool">Tools</SelectItem>
              <SelectItem value="action">Actions</SelectItem>
              <SelectItem value="actionGroup">Action Groups</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )
}

