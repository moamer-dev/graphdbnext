'use client'

import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../../ui/select'
import { X } from 'lucide-react'
import type { ToolCanvasNode } from '../../../stores/toolCanvasStore'

interface LoopConfig {
  filterChildren: string[]
  maxDepth?: number
  skipIgnored?: boolean
}

interface ToolLoopConfigurationProps {
  toolNodeId: string
  toolNode: ToolCanvasNode | null
  loopConfig: LoopConfig
  loopInputValues: Record<string, string>
  xmlChildren?: Array<{ name: string; count: number }>
  onLoopConfigChange: (config: LoopConfig) => void
  onLoopInputValuesChange: (values: Record<string, string>) => void
  onUpdateToolNode: (id: string, updates: Partial<ToolCanvasNode>) => void
  getState: () => { loopInputValues: Record<string, string> }
}

export function ToolLoopConfiguration({
  toolNodeId,
  toolNode,
  loopConfig,
  loopInputValues,
  xmlChildren,
  onLoopConfigChange,
  onLoopInputValuesChange,
  onUpdateToolNode,
  getState
}: ToolLoopConfigurationProps) {
  return (
    <div className="space-y-4">
      <div className="mb-2">
        <Label className="text-xs font-medium">Loop Configuration</Label>
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Filter Children By Name</Label>
        <div className="flex gap-2">
          <Input
            value={loopInputValues['children'] || ''}
            onChange={(e) => {
              onLoopInputValuesChange({ ...getState().loopInputValues, children: e.target.value })
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                const newValue = e.currentTarget.value.trim()
                if (!loopConfig.filterChildren.includes(newValue)) {
                  const updated = [...loopConfig.filterChildren, newValue]
                  onLoopConfigChange({ ...loopConfig, filterChildren: updated })
                  onUpdateToolNode(toolNodeId, {
                    config: { ...toolNode?.config, filterChildren: updated }
                  })
                  const newLoopState = { ...getState().loopInputValues }
                  delete newLoopState['children']
                  onLoopInputValuesChange(newLoopState)
                }
              }
            }}
            placeholder="Enter child element name"
            className="h-8 text-xs flex-1"
          />
          {xmlChildren && xmlChildren.length > 0 && (
            <Select
              value=""
              onValueChange={(value) => {
                if (value && !loopConfig.filterChildren.includes(value)) {
                  const updated = [...loopConfig.filterChildren, value]
                  onLoopConfigChange({ ...loopConfig, filterChildren: updated })
                  onUpdateToolNode(toolNodeId, {
                    config: { ...toolNode?.config, filterChildren: updated }
                  })
                }
              }}
            >
              <SelectTrigger className="h-8 text-xs w-32">
                <SelectValue placeholder="Or select" />
              </SelectTrigger>
              <SelectContent>
                {xmlChildren
                  .filter((child) => !loopConfig.filterChildren.includes(child.name))
                  .map((child) => (
                    <SelectItem key={child.name} value={child.name}>
                      {child.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          )}
        </div>
        {loopConfig.filterChildren.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {loopConfig.filterChildren.map((name) => (
              <span key={name} className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs">
                {name}
                <button
                  onClick={() => {
                    const updated = loopConfig.filterChildren.filter((n) => n !== name)
                    onLoopConfigChange({ ...loopConfig, filterChildren: updated })
                    onUpdateToolNode(toolNodeId, {
                      config: { ...toolNode?.config, filterChildren: updated }
                    })
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Max Depth (optional)</Label>
        <Input
          type="number"
          value={loopConfig.maxDepth || ''}
          onChange={(e) => {
            const depth = e.target.value ? parseInt(e.target.value, 10) : undefined
            onLoopConfigChange({ ...loopConfig, maxDepth: depth })
            onUpdateToolNode(toolNodeId, {
              config: { ...toolNode?.config, maxDepth: depth }
            })
          }}
          placeholder="Leave empty for unlimited"
          className="h-8 text-xs"
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={loopConfig.skipIgnored || false}
          onChange={(e) => {
            onLoopConfigChange({ ...loopConfig, skipIgnored: e.target.checked })
            onUpdateToolNode(toolNodeId, {
              config: { ...toolNode?.config, skipIgnored: e.target.checked }
            })
          }}
          className="h-4 w-4"
        />
        <Label className="text-xs">Skip Ignored Elements</Label>
      </div>
    </div>
  )
}

