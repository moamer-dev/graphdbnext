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

interface DistinctConfig {
  distinctBy: 'attribute' | 'textContent' | 'elementName'
  attributeName?: string
  target: 'children' | 'self'
}

interface ToolDistinctConfigurationProps {
  toolNodeId: string
  toolNode: ToolCanvasNode | null
  distinctConfig: DistinctConfig
  onDistinctConfigChange: (config: DistinctConfig) => void
  onUpdateToolNode: (id: string, updates: Partial<ToolCanvasNode>) => void
}

export function ToolDistinctConfiguration({
  toolNodeId,
  toolNode,
  distinctConfig,
  onDistinctConfigChange,
  onUpdateToolNode
}: ToolDistinctConfigurationProps) {
  return (
    <div className="space-y-4">
      <div className="mb-2">
        <Label className="text-xs font-medium">Distinct Configuration</Label>
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Distinct By</Label>
        <Select
          value={distinctConfig.distinctBy}
          onValueChange={(value) => {
            const updated = { ...distinctConfig, distinctBy: value as DistinctConfig['distinctBy'] }
            onDistinctConfigChange(updated)
            onUpdateToolNode(toolNodeId, {
              config: { ...toolNode?.config, distinctBy: value }
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
      {distinctConfig.distinctBy === 'attribute' && (
        <div className="space-y-2">
          <Label className="text-xs">Attribute Name</Label>
          <Input
            value={distinctConfig.attributeName || ''}
            onChange={(e) => {
              const updated = { ...distinctConfig, attributeName: e.target.value }
              onDistinctConfigChange(updated)
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
        <Label className="text-xs">Target</Label>
        <Select
          value={distinctConfig.target}
          onValueChange={(value) => {
            const updated = { ...distinctConfig, target: value as DistinctConfig['target'] }
            onDistinctConfigChange(updated)
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

