'use client'

import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import type { ToolCanvasNode } from '../../../stores/toolCanvasStore'

interface DelayConfig {
  delayMs: number
}

interface ToolDelayConfigurationProps {
  toolNodeId: string
  toolNode: ToolCanvasNode | null
  delayConfig: DelayConfig
  onDelayConfigChange: (config: DelayConfig) => void
  onUpdateToolNode: (id: string, updates: Partial<ToolCanvasNode>) => void
}

export function ToolDelayConfiguration({
  toolNodeId,
  toolNode,
  delayConfig,
  onDelayConfigChange,
  onUpdateToolNode
}: ToolDelayConfigurationProps) {
  return (
    <div className="space-y-4">
      <div className="mb-2">
        <Label className="text-xs font-medium">Delay Configuration</Label>
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Delay (milliseconds)</Label>
        <Input
          type="number"
          value={delayConfig.delayMs}
          onChange={(e) => {
            const ms = parseInt(e.target.value, 10) || 0
            const updated = { ...delayConfig, delayMs: ms }
            onDelayConfigChange(updated)
            onUpdateToolNode(toolNodeId, {
              config: { ...toolNode?.config, delayMs: ms }
            })
          }}
          placeholder="Delay in milliseconds"
          className="h-8 text-xs"
        />
      </div>
    </div>
  )
}

