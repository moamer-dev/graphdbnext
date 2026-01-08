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
import { CollapsibleSection } from '../../shared/CollapsibleSection'
import type { ToolCanvasNode } from '../../../stores/toolCanvasStore'

interface AggregateConfig {
  operation: 'count' | 'sum' | 'avg' | 'min' | 'max'
  source: 'children' | 'attribute' | 'textContent'
  attributeName?: string
  targetProperty?: string
  filterByTag?: string[]
}

interface ToolAggregateConfigurationProps {
  toolNodeId: string
  toolNode: ToolCanvasNode | null
  aggregateConfig: AggregateConfig
  onAggregateConfigChange: (config: AggregateConfig) => void
  onUpdateToolNode: (id: string, updates: Partial<ToolCanvasNode>) => void
}

export function ToolAggregateConfiguration({
  toolNodeId,
  toolNode,
  aggregateConfig,
  onAggregateConfigChange,
  onUpdateToolNode
}: ToolAggregateConfigurationProps) {
  if (!toolNode) return null

  return (
    <CollapsibleSection title="Aggregate Configuration" defaultOpen={true}>
      <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs">Operation</Label>
        <Select
          value={aggregateConfig.operation}
          onValueChange={(value) => {
            const updated = { ...aggregateConfig, operation: value as AggregateConfig['operation'] }
            onAggregateConfigChange(updated)
            onUpdateToolNode(toolNodeId, {
              config: { ...toolNode?.config, operation: value }
            })
          }}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="count">Count</SelectItem>
            <SelectItem value="sum">Sum</SelectItem>
            <SelectItem value="avg">Average</SelectItem>
            <SelectItem value="min">Minimum</SelectItem>
            <SelectItem value="max">Maximum</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Source</Label>
        <Select
          value={aggregateConfig.source}
          onValueChange={(value) => {
            const updated = { ...aggregateConfig, source: value as AggregateConfig['source'] }
            onAggregateConfigChange(updated)
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
      {aggregateConfig.source === 'attribute' && (
        <div className="space-y-2">
          <Label className="text-xs">Attribute Name</Label>
          <Input
            value={aggregateConfig.attributeName || ''}
            onChange={(e) => {
              const updated = { ...aggregateConfig, attributeName: e.target.value }
              onAggregateConfigChange(updated)
              onUpdateToolNode(toolNodeId, {
                config: { ...toolNode?.config, attributeName: e.target.value }
              })
            }}
            placeholder="e.g., count, value"
            className="h-8 text-xs"
          />
        </div>
      )}
      <div className="space-y-2">
        <Label className="text-xs">Target Property</Label>
        <Input
          value={aggregateConfig.targetProperty || ''}
          onChange={(e) => {
            const updated = { ...aggregateConfig, targetProperty: e.target.value }
            onAggregateConfigChange(updated)
            onUpdateToolNode(toolNodeId, {
              config: { ...toolNode?.config, targetProperty: e.target.value }
            })
          }}
          placeholder="e.g., aggregate"
          className="h-8 text-xs"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Filter By Tag</Label>
        <Input
          placeholder="e.g., w, p (comma-separated)"
          className="h-8 text-xs"
          value={(aggregateConfig.filterByTag || []).join(', ')}
          onChange={(e) => {
            const tags = e.target.value.split(',').map(t => t.trim()).filter(Boolean)
            const updated = { ...aggregateConfig, filterByTag: tags }
            onAggregateConfigChange(updated)
            onUpdateToolNode(toolNodeId, {
              config: { ...toolNode?.config, filterByTag: tags }
            })
          }}
        />
      </div>
      </div>
    </CollapsibleSection>
  )
}

