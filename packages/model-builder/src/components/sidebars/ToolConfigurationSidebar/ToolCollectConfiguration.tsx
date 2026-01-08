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

interface CollectConfig {
  targetProperty: string
  source: 'children' | 'attribute' | 'textContent'
  attributeName?: string
  filterByTag?: string[]
  asArray?: boolean
}

interface ToolCollectConfigurationProps {
  toolNodeId: string
  toolNode: ToolCanvasNode | null
  collectConfig: CollectConfig
  onCollectConfigChange: (config: CollectConfig) => void
  onUpdateToolNode: (id: string, updates: Partial<ToolCanvasNode>) => void
}

export function ToolCollectConfiguration({
  toolNodeId,
  toolNode,
  collectConfig,
  onCollectConfigChange,
  onUpdateToolNode
}: ToolCollectConfigurationProps) {
  return (
    <div className="space-y-4">
      <div className="mb-2">
        <Label className="text-xs font-medium">Collect Configuration</Label>
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Target Property</Label>
        <Input
          value={collectConfig.targetProperty || ''}
          onChange={(e) => {
            const updated = { ...collectConfig, targetProperty: e.target.value }
            onCollectConfigChange(updated)
            onUpdateToolNode(toolNodeId, {
              config: { ...toolNode?.config, targetProperty: e.target.value }
            })
          }}
          placeholder="e.g., collected"
          className="h-8 text-xs"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Source</Label>
        <Select
          value={collectConfig.source}
          onValueChange={(value) => {
            const updated = { ...collectConfig, source: value as CollectConfig['source'] }
            onCollectConfigChange(updated)
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
      {collectConfig.source === 'attribute' && (
        <div className="space-y-2">
          <Label className="text-xs">Attribute Name</Label>
          <Input
            value={collectConfig.attributeName || ''}
            onChange={(e) => {
              const updated = { ...collectConfig, attributeName: e.target.value }
              onCollectConfigChange(updated)
              onUpdateToolNode(toolNodeId, {
                config: { ...toolNode?.config, attributeName: e.target.value }
              })
            }}
            placeholder="e.g., id, type"
            className="h-8 text-xs"
          />
        </div>
      )}
      <div className="space-y-2">
        <Label className="text-xs">Filter By Tag</Label>
        <Input
          placeholder="e.g., w, p (comma-separated)"
          className="h-8 text-xs"
          value={(collectConfig.filterByTag || []).join(', ')}
          onChange={(e) => {
            const tags = e.target.value.split(',').map(t => t.trim()).filter(Boolean)
            const updated = { ...collectConfig, filterByTag: tags }
            onCollectConfigChange(updated)
            onUpdateToolNode(toolNodeId, {
              config: { ...toolNode?.config, filterByTag: tags }
            })
          }}
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={collectConfig.asArray || false}
          onChange={(e) => {
            const updated = { ...collectConfig, asArray: e.target.checked }
            onCollectConfigChange(updated)
            onUpdateToolNode(toolNodeId, {
              config: { ...toolNode?.config, asArray: e.target.checked }
            })
          }}
          className="h-4 w-4"
        />
        <Label className="text-xs">Store as Array</Label>
      </div>
    </div>
  )
}

