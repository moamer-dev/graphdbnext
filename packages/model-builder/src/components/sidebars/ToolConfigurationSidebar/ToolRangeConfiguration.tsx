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

interface RangeConfig {
  start: number
  end: number
  step?: number
  target?: 'children' | 'self'
}

interface ToolRangeConfigurationProps {
  toolNodeId: string
  toolNode: ToolCanvasNode | null
  rangeConfig: RangeConfig
  onRangeConfigChange: (config: RangeConfig) => void
  onUpdateToolNode: (id: string, updates: Partial<ToolCanvasNode>) => void
}

export function ToolRangeConfiguration({
  toolNodeId,
  toolNode,
  rangeConfig,
  onRangeConfigChange,
  onUpdateToolNode
}: ToolRangeConfigurationProps) {
  return (
    <div className="space-y-4">
      <div className="mb-2">
        <Label className="text-xs font-medium">Range Configuration</Label>
      </div>
      <div className="space-y-2">
        <Label className="text-xs font-medium">Start</Label>
        <Input
          type="number"
          value={rangeConfig.start}
          onChange={(e) => {
            const value = parseInt(e.target.value, 10) || 0
            const updated = { ...rangeConfig, start: value }
            onRangeConfigChange(updated)
            onUpdateToolNode(toolNodeId, {
              config: { ...toolNode?.config, start: value }
            })
          }}
          placeholder="e.g., 0"
          className="h-8 text-xs"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs font-medium">End</Label>
        <Input
          type="number"
          value={rangeConfig.end}
          onChange={(e) => {
            const value = parseInt(e.target.value, 10) || 10
            const updated = { ...rangeConfig, end: value }
            onRangeConfigChange(updated)
            onUpdateToolNode(toolNodeId, {
              config: { ...toolNode?.config, end: value }
            })
          }}
          placeholder="e.g., 10"
          className="h-8 text-xs"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs font-medium">Step</Label>
        <Input
          type="number"
          value={rangeConfig.step || ''}
          onChange={(e) => {
            const value = parseInt(e.target.value, 10) || 1
            const updated = { ...rangeConfig, step: value }
            onRangeConfigChange(updated)
            onUpdateToolNode(toolNodeId, {
              config: { ...toolNode?.config, step: value }
            })
          }}
          placeholder="e.g., 1"
          className="h-8 text-xs"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs font-medium">Target</Label>
        <Select
          value={rangeConfig.target || ''}
          onValueChange={(value) => {
            const updated = { ...rangeConfig, target: value as RangeConfig['target'] }
            onRangeConfigChange(updated)
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

