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

interface TraverseConfig {
  direction: 'ancestor' | 'descendant' | 'sibling'
  targetTags: string[]
  stopCondition?: string
}

interface ToolTraverseConfigurationProps {
  toolNodeId: string
  toolNode: ToolCanvasNode | null
  traverseConfig: TraverseConfig
  onTraverseConfigChange: (config: TraverseConfig) => void
  onUpdateToolNode: (id: string, updates: Partial<ToolCanvasNode>) => void
}

export function ToolTraverseConfiguration({
  toolNodeId,
  toolNode,
  traverseConfig,
  onTraverseConfigChange,
  onUpdateToolNode
}: ToolTraverseConfigurationProps) {
  return (
    <div className="space-y-4">
      <div className="mb-2">
        <Label className="text-xs font-medium">Traverse Configuration</Label>
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Direction</Label>
        <Select
          value={traverseConfig.direction}
          onValueChange={(value) => {
            const updated = { ...traverseConfig, direction: value as TraverseConfig['direction'] }
            onTraverseConfigChange(updated)
            onUpdateToolNode(toolNodeId, {
              config: { ...toolNode?.config, direction: value }
            })
          }}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ancestor">Ancestor (Up)</SelectItem>
            <SelectItem value="descendant">Descendant (Down)</SelectItem>
            <SelectItem value="sibling">Sibling (Same Level)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Target Tags</Label>
        <Input
          placeholder="Enter tag names (comma-separated)"
          className="h-8 text-xs"
          value={traverseConfig.targetTags.join(', ')}
          onChange={(e) => {
            const tags = e.target.value.split(',').map(t => t.trim()).filter(Boolean)
            const updated = { ...traverseConfig, targetTags: tags }
            onTraverseConfigChange(updated)
            onUpdateToolNode(toolNodeId, {
              config: { ...toolNode?.config, targetTags: tags }
            })
          }}
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Stop Condition (optional)</Label>
        <Input
          value={traverseConfig.stopCondition || ''}
          onChange={(e) => {
            const updated = { ...traverseConfig, stopCondition: e.target.value || undefined }
            onTraverseConfigChange(updated)
            onUpdateToolNode(toolNodeId, {
              config: { ...toolNode?.config, stopCondition: e.target.value || undefined }
            })
          }}
          placeholder="Stop when condition is met"
          className="h-8 text-xs"
        />
      </div>
    </div>
  )
}

