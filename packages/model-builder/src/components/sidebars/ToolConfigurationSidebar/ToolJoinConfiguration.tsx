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

interface JoinConfig {
  joinWith: 'siblings' | 'children' | 'parent'
  joinBy: 'textContent' | 'attribute'
  attributeName?: string
  separator?: string
}

interface ToolJoinConfigurationProps {
  toolNodeId: string
  toolNode: ToolCanvasNode | null
  joinConfig: JoinConfig
  onJoinConfigChange: (config: JoinConfig) => void
  onUpdateToolNode: (id: string, updates: Partial<ToolCanvasNode>) => void
}

export function ToolJoinConfiguration({
  toolNodeId,
  toolNode,
  joinConfig,
  onJoinConfigChange,
  onUpdateToolNode
}: ToolJoinConfigurationProps) {
  return (
    <div className="space-y-4">
      <div className="mb-2">
        <Label className="text-xs font-medium">Join Configuration</Label>
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Join With</Label>
        <Select
          value={joinConfig.joinWith}
          onValueChange={(value) => {
            const updated = { ...joinConfig, joinWith: value as JoinConfig['joinWith'] }
            onJoinConfigChange(updated)
            onUpdateToolNode(toolNodeId, {
              config: { ...toolNode?.config, joinWith: value }
            })
          }}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="siblings">Siblings</SelectItem>
            <SelectItem value="children">Children</SelectItem>
            <SelectItem value="parent">Parent</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Join By</Label>
        <Select
          value={joinConfig.joinBy}
          onValueChange={(value) => {
            const updated = { ...joinConfig, joinBy: value as JoinConfig['joinBy'] }
            onJoinConfigChange(updated)
            onUpdateToolNode(toolNodeId, {
              config: { ...toolNode?.config, joinBy: value }
            })
          }}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="textContent">Text Content</SelectItem>
            <SelectItem value="attribute">Attribute</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {joinConfig.joinBy === 'attribute' && (
        <div className="space-y-2">
          <Label className="text-xs">Attribute Name</Label>
          <Input
            value={joinConfig.attributeName || ''}
            onChange={(e) => {
              const updated = { ...joinConfig, attributeName: e.target.value }
              onJoinConfigChange(updated)
              onUpdateToolNode(toolNodeId, {
                config: { ...toolNode?.config, attributeName: e.target.value }
              })
            }}
            placeholder="e.g., text"
            className="h-8 text-xs"
          />
        </div>
      )}
      <div className="space-y-2">
        <Label className="text-xs">Separator</Label>
        <Input
          value={joinConfig.separator || ''}
          onChange={(e) => {
            const updated = { ...joinConfig, separator: e.target.value }
            onJoinConfigChange(updated)
            onUpdateToolNode(toolNodeId, {
              config: { ...toolNode?.config, separator: e.target.value }
            })
          }}
          placeholder="e.g., space"
          className="h-8 text-xs"
        />
      </div>
    </div>
  )
}

