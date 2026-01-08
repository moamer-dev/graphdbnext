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

interface BatchConfig {
  batchSize: number
  target?: 'children' | 'self'
  processInParallel?: boolean
}

interface ToolBatchConfigurationProps {
  toolNodeId: string
  toolNode: ToolCanvasNode | null
  batchConfig: BatchConfig
  onBatchConfigChange: (config: BatchConfig) => void
  onUpdateToolNode: (id: string, updates: Partial<ToolCanvasNode>) => void
}

export function ToolBatchConfiguration({
  toolNodeId,
  toolNode,
  batchConfig,
  onBatchConfigChange,
  onUpdateToolNode
}: ToolBatchConfigurationProps) {
  return (
    <div className="space-y-4">
      <div className="mb-2">
        <Label className="text-xs font-medium">Batch Configuration</Label>
      </div>
      <div className="space-y-2">
        <Label className="text-xs font-medium">Batch Size</Label>
        <Input
          type="number"
          value={batchConfig.batchSize}
          onChange={(e) => {
            const value = parseInt(e.target.value, 10) || 10
            const updated = { ...batchConfig, batchSize: value }
            onBatchConfigChange(updated)
            onUpdateToolNode(toolNodeId, {
              config: { ...toolNode?.config, batchSize: value }
            })
          }}
          placeholder="e.g., 10"
          className="h-8 text-xs"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs font-medium">Target</Label>
        <Select
          value={batchConfig.target || ''}
          onValueChange={(value) => {
            const updated = { ...batchConfig, target: value as BatchConfig['target'] }
            onBatchConfigChange(updated)
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
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={batchConfig.processInParallel || false}
          onChange={(e) => {
            const updated = { ...batchConfig, processInParallel: e.target.checked }
            onBatchConfigChange(updated)
            onUpdateToolNode(toolNodeId, {
              config: { ...toolNode?.config, processInParallel: e.target.checked }
            })
          }}
          className="h-4 w-4"
        />
        <Label className="text-xs">Process in Parallel</Label>
      </div>
    </div>
  )
}

