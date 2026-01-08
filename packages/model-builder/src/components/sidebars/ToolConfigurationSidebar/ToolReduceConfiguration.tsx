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

interface ReduceConfig {
  operation: 'concat' | 'sum' | 'join'
  source: 'children' | 'attribute' | 'textContent'
  attributeName?: string
  separator?: string
  targetProperty?: string
}

interface ToolReduceConfigurationProps {
  toolNodeId: string
  toolNode: ToolCanvasNode | null
  reduceConfig: ReduceConfig
  onReduceConfigChange: (config: ReduceConfig) => void
  onUpdateToolNode: (id: string, updates: Partial<ToolCanvasNode>) => void
}

export function ToolReduceConfiguration({
  toolNodeId,
  toolNode,
  reduceConfig,
  onReduceConfigChange,
  onUpdateToolNode
}: ToolReduceConfigurationProps) {
  return (
    <div className="space-y-4">
      <div className="mb-2">
        <Label className="text-xs font-medium">Reduce Configuration</Label>
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Operation</Label>
        <Select
          value={reduceConfig.operation}
          onValueChange={(value) => {
            const updated = { ...reduceConfig, operation: value as ReduceConfig['operation'] }
            onReduceConfigChange(updated)
            onUpdateToolNode(toolNodeId, {
              config: { ...toolNode?.config, operation: value }
            })
          }}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="concat">Concatenate</SelectItem>
            <SelectItem value="sum">Sum</SelectItem>
            <SelectItem value="join">Join</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Source</Label>
        <Select
          value={reduceConfig.source}
          onValueChange={(value) => {
            const updated = { ...reduceConfig, source: value as ReduceConfig['source'] }
            onReduceConfigChange(updated)
            onUpdateToolNode(toolNodeId, {
              config: { ...toolNode?.config, source: value }
            })
          }}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="children">Children</SelectItem>
            <SelectItem value="attribute">Attribute</SelectItem>
            <SelectItem value="textContent">Text Content</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {reduceConfig.source === 'attribute' && (
        <div className="space-y-2">
          <Label className="text-xs">Attribute Name</Label>
          <Input
            value={reduceConfig.attributeName || ''}
            onChange={(e) => {
              const updated = { ...reduceConfig, attributeName: e.target.value }
              onReduceConfigChange(updated)
              onUpdateToolNode(toolNodeId, {
                config: { ...toolNode?.config, attributeName: e.target.value }
              })
            }}
            placeholder="e.g., value"
            className="h-8 text-xs"
          />
        </div>
      )}
      {(reduceConfig.operation === 'concat' || reduceConfig.operation === 'join') && (
        <div className="space-y-2">
          <Label className="text-xs">Separator</Label>
          <Input
            value={reduceConfig.separator || ''}
            onChange={(e) => {
              const updated = { ...reduceConfig, separator: e.target.value }
              onReduceConfigChange(updated)
              onUpdateToolNode(toolNodeId, {
                config: { ...toolNode?.config, separator: e.target.value }
              })
            }}
            placeholder="e.g., space, comma"
            className="h-8 text-xs"
          />
        </div>
      )}
      <div className="space-y-2">
        <Label className="text-xs">Target Property</Label>
        <Input
          value={reduceConfig.targetProperty || ''}
          onChange={(e) => {
            const updated = { ...reduceConfig, targetProperty: e.target.value }
            onReduceConfigChange(updated)
            onUpdateToolNode(toolNodeId, {
              config: { ...toolNode?.config, targetProperty: e.target.value }
            })
          }}
          placeholder="e.g., reduced"
          className="h-8 text-xs"
        />
      </div>
    </div>
  )
}

