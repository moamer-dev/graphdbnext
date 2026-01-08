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

interface MergeConfig {
  mergeStrategy: 'first' | 'last' | 'combine'
  sourceElements: string[]
}

interface ToolMergeConfigurationProps {
  toolNodeId: string
  toolNode: ToolCanvasNode | null
  mergeConfig: MergeConfig
  onMergeConfigChange: (config: MergeConfig) => void
  onUpdateToolNode: (id: string, updates: Partial<ToolCanvasNode>) => void
}

export function ToolMergeConfiguration({
  toolNodeId,
  toolNode,
  mergeConfig,
  onMergeConfigChange,
  onUpdateToolNode
}: ToolMergeConfigurationProps) {
  return (
    <div className="space-y-4">
      <div className="mb-2">
        <Label className="text-xs font-medium">Merge Configuration</Label>
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Merge Strategy</Label>
        <Select
          value={mergeConfig.mergeStrategy}
          onValueChange={(value) => {
            const updated = { ...mergeConfig, mergeStrategy: value as MergeConfig['mergeStrategy'] }
            onMergeConfigChange(updated)
            onUpdateToolNode(toolNodeId, {
              config: { ...toolNode?.config, mergeStrategy: value }
            })
          }}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="first">First Element</SelectItem>
            <SelectItem value="last">Last Element</SelectItem>
            <SelectItem value="combine">Combine All</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Source Element Names</Label>
        <Input
          placeholder="Enter element names (comma-separated)"
          className="h-8 text-xs"
          value={mergeConfig.sourceElements.join(', ')}
          onChange={(e) => {
            const elements = e.target.value.split(',').map(el => el.trim()).filter(Boolean)
            const updated = { ...mergeConfig, sourceElements: elements }
            onMergeConfigChange(updated)
            onUpdateToolNode(toolNodeId, {
              config: { ...toolNode?.config, sourceElements: elements }
            })
          }}
        />
      </div>
    </div>
  )
}

