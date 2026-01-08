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

interface WindowConfig {
  windowSize: number
  step: number
  operation: 'collect' | 'aggregate'
  targetProperty?: string
}

interface ToolWindowConfigurationProps {
  toolNodeId: string
  toolNode: ToolCanvasNode | null
  windowConfig: WindowConfig
  onWindowConfigChange: (config: WindowConfig) => void
  onUpdateToolNode: (id: string, updates: Partial<ToolCanvasNode>) => void
}

export function ToolWindowConfiguration({
  toolNodeId,
  toolNode,
  windowConfig,
  onWindowConfigChange,
  onUpdateToolNode
}: ToolWindowConfigurationProps) {
  return (
    <div className="space-y-4">
      <div className="mb-2">
        <Label className="text-xs font-medium">Window Configuration</Label>
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Window Size</Label>
        <Input
          type="number"
          value={windowConfig.windowSize}
          onChange={(e) => {
            const value = parseInt(e.target.value, 10) || 3
            const updated = { ...windowConfig, windowSize: value }
            onWindowConfigChange(updated)
            onUpdateToolNode(toolNodeId, {
              config: { ...toolNode?.config, windowSize: value }
            })
          }}
          placeholder="e.g., 3"
          className="h-8 text-xs"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Step</Label>
        <Input
          type="number"
          value={windowConfig.step}
          onChange={(e) => {
            const value = parseInt(e.target.value, 10) || 1
            const updated = { ...windowConfig, step: value }
            onWindowConfigChange(updated)
            onUpdateToolNode(toolNodeId, {
              config: { ...toolNode?.config, step: value }
            })
          }}
          placeholder="e.g., 1"
          className="h-8 text-xs"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Operation</Label>
        <Select
          value={windowConfig.operation}
          onValueChange={(value) => {
            const updated = { ...windowConfig, operation: value as WindowConfig['operation'] }
            onWindowConfigChange(updated)
            onUpdateToolNode(toolNodeId, {
              config: { ...toolNode?.config, operation: value }
            })
          }}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="collect">Collect</SelectItem>
            <SelectItem value="aggregate">Aggregate</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Target Property</Label>
        <Input
          value={windowConfig.targetProperty || ''}
          onChange={(e) => {
            const updated = { ...windowConfig, targetProperty: e.target.value }
            onWindowConfigChange(updated)
            onUpdateToolNode(toolNodeId, {
              config: { ...toolNode?.config, targetProperty: e.target.value }
            })
          }}
          placeholder="e.g., window"
          className="h-8 text-xs"
        />
      </div>
    </div>
  )
}

