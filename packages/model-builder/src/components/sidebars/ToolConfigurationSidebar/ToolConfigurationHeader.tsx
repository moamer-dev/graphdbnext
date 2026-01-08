'use client'

import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { X } from 'lucide-react'
import type { ToolCanvasNode } from '../../../stores/toolCanvasStore'
import type { Node } from '../../../types'

interface ToolConfigurationHeaderProps {
  toolLabel: string
  toolNode: ToolCanvasNode | null
  attachedNode: Node | null | undefined
  onToolLabelChange: (label: string) => void
  onUpdateToolNode: (id: string, updates: Partial<ToolCanvasNode>) => void
  onClose: () => void
}

export function ToolConfigurationHeader({
  toolLabel,
  toolNode,
  attachedNode,
  onToolLabelChange,
  onUpdateToolNode,
  onClose
}: ToolConfigurationHeaderProps) {
  return (
    <div className="p-4 border-b">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Tool Configuration</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-7 w-7 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="mt-3 space-y-2">
        <div>
          <Label htmlFor="tool-label" className="text-xs font-medium">Tool Name</Label>
          <Input
            id="tool-label"
            value={toolLabel}
            onChange={(e) => {
              const newLabel = e.target.value
              onToolLabelChange(newLabel)
              if (toolNode) {
                onUpdateToolNode(toolNode.id, { label: newLabel })
              }
            }}
            className="mt-1 h-8 text-xs"
            placeholder="Enter tool name"
          />
        </div>
        <div className="text-xs text-muted-foreground">
          Type: <span className="font-medium">{toolNode?.type}</span>
        </div>
      </div>
      {attachedNode && (
        <div className="mt-2 text-xs text-muted-foreground">
          Attached to: <span className="font-medium">{attachedNode.label}</span>
        </div>
      )}
    </div>
  )
}

