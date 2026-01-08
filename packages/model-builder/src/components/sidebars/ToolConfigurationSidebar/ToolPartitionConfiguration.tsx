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

interface PartitionConfig {
  partitionBy: 'size' | 'condition'
  size?: number
  condition?: 'hasAttribute' | 'hasText'
  conditionValue?: string
}

interface ToolPartitionConfigurationProps {
  toolNodeId: string
  toolNode: ToolCanvasNode | null
  partitionConfig: PartitionConfig
  onPartitionConfigChange: (config: PartitionConfig) => void
  onUpdateToolNode: (id: string, updates: Partial<ToolCanvasNode>) => void
}

export function ToolPartitionConfiguration({
  toolNodeId,
  toolNode,
  partitionConfig,
  onPartitionConfigChange,
  onUpdateToolNode
}: ToolPartitionConfigurationProps) {
  return (
    <div className="space-y-4">
      <div className="mb-2">
        <Label className="text-xs font-medium">Partition Configuration</Label>
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Partition By</Label>
        <Select
          value={partitionConfig.partitionBy}
          onValueChange={(value) => {
            const updated = { ...partitionConfig, partitionBy: value as PartitionConfig['partitionBy'] }
            onPartitionConfigChange(updated)
            onUpdateToolNode(toolNodeId, {
              config: { ...toolNode?.config, partitionBy: value }
            })
          }}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="size">Size</SelectItem>
            <SelectItem value="condition">Condition</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {partitionConfig.partitionBy === 'size' && (
        <div className="space-y-2">
          <Label className="text-xs">Chunk Size</Label>
          <Input
            type="number"
            value={partitionConfig.size || ''}
            onChange={(e) => {
              const value = parseInt(e.target.value, 10) || 10
              const updated = { ...partitionConfig, size: value }
              onPartitionConfigChange(updated)
              onUpdateToolNode(toolNodeId, {
                config: { ...toolNode?.config, size: value }
              })
            }}
            placeholder="e.g., 10"
            className="h-8 text-xs"
          />
        </div>
      )}
      {partitionConfig.partitionBy === 'condition' && (
        <>
          <div className="space-y-2">
            <Label className="text-xs">Condition</Label>
            <Select
              value={partitionConfig.condition || ''}
              onValueChange={(value) => {
                const updated = { ...partitionConfig, condition: value as PartitionConfig['condition'] }
                onPartitionConfigChange(updated)
                onUpdateToolNode(toolNodeId, {
                  config: { ...toolNode?.config, condition: value }
                })
              }}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hasAttribute">Has Attribute</SelectItem>
                <SelectItem value="hasText">Has Text</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Condition Value</Label>
            <Input
              value={partitionConfig.conditionValue || ''}
              onChange={(e) => {
                const updated = { ...partitionConfig, conditionValue: e.target.value }
                onPartitionConfigChange(updated)
                onUpdateToolNode(toolNodeId, {
                  config: { ...toolNode?.config, conditionValue: e.target.value }
                })
              }}
              placeholder="e.g., attribute name"
              className="h-8 text-xs"
            />
          </div>
        </>
      )}
    </div>
  )
}

