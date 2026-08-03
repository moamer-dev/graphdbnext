'use client'

import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { X } from 'lucide-react'
import type { ToolCanvasNode } from '../../../stores/toolCanvasStore'
import type { Node } from '../../../types'
import type { ToolDefinition } from '../../../registry/types'

interface ToolConfigurationHeaderProps {
  toolLabel: string
  toolNode: ToolCanvasNode | null
  attachedNode: Node | null | undefined
  toolDefinition: ToolDefinition | undefined
  onToolLabelChange: (label: string) => void
  onUpdateToolNode: (id: string, updates: Partial<ToolCanvasNode>) => void
  onClose: () => void
}

export function ToolConfigurationHeader({
  toolLabel,
  toolNode,
  attachedNode,
  toolDefinition,
  onToolLabelChange,
  onUpdateToolNode,
  onClose
}: ToolConfigurationHeaderProps) {
  return (
    <div className="p-4 border-b bg-primary/[0.02]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {toolDefinition && (
            <div className="p-1.5 rounded-md bg-primary/10 border border-primary/20">
              {toolDefinition.metadata?.icon ? <toolDefinition.metadata.icon className="h-4 w-4 text-primary" /> : null}
            </div>
          )}
          <div className="flex flex-col">
            <h3 className="text-[14px] font-bold">Tool Settings</h3>
            <span className="text-[10px] text-primary/40 font-mono">{toolNode?.label}</span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-7 w-7 p-0 hover:bg-primary/10 hover:text-primary transition-all"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase font-bold text-primary/50 tracking-wider">Tool Identity</Label>
          <Input
            value={toolLabel}
            onChange={(e) => {
              const newLabel = e.target.value
              onToolLabelChange(newLabel)
              if (toolNode) {
                onUpdateToolNode(toolNode.id, { label: newLabel })
              }
            }}
            className="h-8 text-xs bg-primary/5 border-primary/20 focus:bg-background transition-all"
            placeholder="e.g., If children exist"
          />
        </div>

        {attachedNode && (
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase font-bold text-primary/50 tracking-wider">Target Node</Label>
            <div className="h-8 px-2.5 flex items-center bg-primary/10 border border-primary/20 rounded-md">
              <span className="text-xs font-bold text-primary truncate">
                {attachedNode.label}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

