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
import type { ToolCanvasNode } from '../../../stores/toolCanvasStore'

interface LimitConfig {
  limit: number
  offset: number
  target: 'children' | 'self'
}

interface ToolLimitConfigurationProps {
  toolNodeId: string
  toolNode: ToolCanvasNode | null
  limitConfig: LimitConfig
  onLimitConfigChange: (config: LimitConfig) => void
  onUpdateToolNode: (id: string, updates: Partial<ToolCanvasNode>) => void
}

export function ToolLimitConfiguration({
  toolNodeId,
  toolNode,
  limitConfig,
  onLimitConfigChange,
  onUpdateToolNode
}: ToolLimitConfigurationProps) {
  return (
    <div className="space-y-4">
      <div className="mb-2">
        <Label className="text-xs font-medium">Limit Configuration</Label>
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Limit</Label>
        <Input
          type="number"
          value={limitConfig.limit}
          onChange={(e) => {
            const value = parseInt(e.target.value, 10) || 0
            const updated = { ...limitConfig, limit: value }
            onLimitConfigChange(updated)
            onUpdateToolNode(toolNodeId, {
              config: { ...toolNode?.config, limit: value }
            })
          }}
          placeholder="Maximum number of items"
          className="h-8 text-xs"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Offset</Label>
        <Input
          type="number"
          value={limitConfig.offset}
          onChange={(e) => {
            const value = parseInt(e.target.value, 10) || 0
            const updated = { ...limitConfig, offset: value }
            onLimitConfigChange(updated)
            onUpdateToolNode(toolNodeId, {
              config: { ...toolNode?.config, offset: value }
            })
          }}
          placeholder="Number of items to skip"
          className="h-8 text-xs"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Target</Label>
        <Select
          value={limitConfig.target}
          onValueChange={(value) => {
            const updated = { ...limitConfig, target: value as LimitConfig['target'] }
            onLimitConfigChange(updated)
            onUpdateToolNode(toolNodeId, {
              config: { ...toolNode?.config, target: value }
            })
          }}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="children">Children</SelectItem>
            <SelectItem value="self">Self</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

