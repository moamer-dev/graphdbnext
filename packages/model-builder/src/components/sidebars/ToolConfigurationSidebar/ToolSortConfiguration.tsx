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

interface SortConfig {
  sortBy: 'attribute' | 'textContent' | 'elementName'
  attributeName?: string
  order: 'asc' | 'desc'
  target: 'children' | 'self'
}

interface ToolSortConfigurationProps {
  toolNodeId: string
  toolNode: ToolCanvasNode | null
  sortConfig: SortConfig
  onSortConfigChange: (config: SortConfig) => void
  onUpdateToolNode: (id: string, updates: Partial<ToolCanvasNode>) => void
}

export function ToolSortConfiguration({
  toolNodeId,
  toolNode,
  sortConfig,
  onSortConfigChange,
  onUpdateToolNode
}: ToolSortConfigurationProps) {
  return (
    <div className="space-y-4">
      <div className="mb-2">
        <Label className="text-xs font-medium">Sort Configuration</Label>
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Sort By</Label>
        <Select
          value={sortConfig.sortBy}
          onValueChange={(value) => {
            const updated = { ...sortConfig, sortBy: value as SortConfig['sortBy'] }
            onSortConfigChange(updated)
            onUpdateToolNode(toolNodeId, {
              config: { ...toolNode?.config, sortBy: value }
            })
          }}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="attribute">Attribute</SelectItem>
            <SelectItem value="textContent">Text Content</SelectItem>
            <SelectItem value="elementName">Element Name</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {sortConfig.sortBy === 'attribute' && (
        <div className="space-y-2">
          <Label className="text-xs">Attribute Name</Label>
          <Input
            value={sortConfig.attributeName || ''}
            onChange={(e) => {
              const updated = { ...sortConfig, attributeName: e.target.value }
              onSortConfigChange(updated)
              onUpdateToolNode(toolNodeId, {
                config: { ...toolNode?.config, attributeName: e.target.value }
              })
            }}
            placeholder="Attribute name"
            className="h-8 text-xs"
          />
        </div>
      )}
      <div className="space-y-2">
        <Label className="text-xs">Order</Label>
        <Select
          value={sortConfig.order}
          onValueChange={(value) => {
            const updated = { ...sortConfig, order: value as SortConfig['order'] }
            onSortConfigChange(updated)
            onUpdateToolNode(toolNodeId, {
              config: { ...toolNode?.config, order: value }
            })
          }}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">Ascending</SelectItem>
            <SelectItem value="desc">Descending</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Target</Label>
        <Select
          value={sortConfig.target}
          onValueChange={(value) => {
            const updated = { ...sortConfig, target: value as SortConfig['target'] }
            onSortConfigChange(updated)
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

