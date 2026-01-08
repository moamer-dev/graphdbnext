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

interface SplitConfig {
  splitBy: 'delimiter' | 'condition' | 'size'
  delimiter?: string
  condition?: 'hasAttribute' | 'hasText' | 'hasChildren'
  conditionValue?: string
  size?: number
}

interface ToolSplitConfigurationProps {
  toolNodeId: string
  toolNode: ToolCanvasNode | null
  splitConfig: SplitConfig
  onSplitConfigChange: (config: SplitConfig) => void
  onUpdateToolNode: (id: string, updates: Partial<ToolCanvasNode>) => void
}

export function ToolSplitConfiguration({
  toolNodeId,
  toolNode,
  splitConfig,
  onSplitConfigChange,
  onUpdateToolNode
}: ToolSplitConfigurationProps) {
  return (
    <div className="space-y-4">
      <div className="mb-2">
        <Label className="text-xs font-medium">Split Configuration</Label>
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Split By</Label>
        <Select
          value={splitConfig.splitBy}
          onValueChange={(value) => {
            const updated = { ...splitConfig, splitBy: value as SplitConfig['splitBy'] }
            onSplitConfigChange(updated)
            onUpdateToolNode(toolNodeId, {
              config: { ...toolNode?.config, splitBy: value }
            })
          }}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="delimiter">Delimiter</SelectItem>
            <SelectItem value="condition">Condition</SelectItem>
            <SelectItem value="size">Size</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {splitConfig.splitBy === 'delimiter' && (
        <div className="space-y-2">
          <Label className="text-xs">Delimiter</Label>
          <Input
            value={splitConfig.delimiter || ''}
            onChange={(e) => {
              const updated = { ...splitConfig, delimiter: e.target.value }
              onSplitConfigChange(updated)
              onUpdateToolNode(toolNodeId, {
                config: { ...toolNode?.config, delimiter: e.target.value }
              })
            }}
            placeholder="e.g., space, comma, newline"
            className="h-8 text-xs"
          />
        </div>
      )}
      {splitConfig.splitBy === 'condition' && (
        <>
          <div className="space-y-2">
            <Label className="text-xs">Condition</Label>
            <Select
              value={splitConfig.condition || ''}
              onValueChange={(value) => {
                const updated = { ...splitConfig, condition: value as SplitConfig['condition'] }
                onSplitConfigChange(updated)
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
                <SelectItem value="hasChildren">Has Children</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Condition Value</Label>
            <Input
              value={splitConfig.conditionValue || ''}
              onChange={(e) => {
                const updated = { ...splitConfig, conditionValue: e.target.value }
                onSplitConfigChange(updated)
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
      {splitConfig.splitBy === 'size' && (
        <div className="space-y-2">
          <Label className="text-xs">Chunk Size</Label>
          <Input
            type="number"
            value={splitConfig.size || ''}
            onChange={(e) => {
              const value = parseInt(e.target.value, 10) || 10
              const updated = { ...splitConfig, size: value }
              onSplitConfigChange(updated)
              onUpdateToolNode(toolNodeId, {
                config: { ...toolNode?.config, size: value }
              })
            }}
            placeholder="e.g., 10"
            className="h-8 text-xs"
          />
        </div>
      )}
    </div>
  )
}

