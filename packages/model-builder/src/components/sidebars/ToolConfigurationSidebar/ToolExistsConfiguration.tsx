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

interface ExistsConfig {
  checkType: 'element' | 'attribute' | 'text'
  elementName?: string
  attributeName?: string
  targetProperty?: string
}

interface ToolExistsConfigurationProps {
  toolNodeId: string
  toolNode: ToolCanvasNode | null
  existsConfig: ExistsConfig
  onExistsConfigChange: (config: ExistsConfig) => void
  onUpdateToolNode: (id: string, updates: Partial<ToolCanvasNode>) => void
}

export function ToolExistsConfiguration({
  toolNodeId,
  toolNode,
  existsConfig,
  onExistsConfigChange,
  onUpdateToolNode
}: ToolExistsConfigurationProps) {
  return (
    <div className="space-y-4">
      <div className="mb-2">
        <Label className="text-xs font-medium">Exists Configuration</Label>
      </div>
      <div className="space-y-2">
        <Label className="text-xs font-medium">Check Type</Label>
        <Select
          value={existsConfig.checkType}
          onValueChange={(value) => {
            const updated = { ...existsConfig, checkType: value as ExistsConfig['checkType'] }
            onExistsConfigChange(updated)
            onUpdateToolNode(toolNodeId, {
              config: { ...toolNode?.config, checkType: value }
            })
          }}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="element">Element</SelectItem>
            <SelectItem value="attribute">Attribute</SelectItem>
            <SelectItem value="text">Text</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {existsConfig.checkType === 'element' && (
        <div className="space-y-2">
          <Label className="text-xs font-medium">Element Name</Label>
          <Input
            value={existsConfig.elementName || ''}
            onChange={(e) => {
              const updated = { ...existsConfig, elementName: e.target.value }
              onExistsConfigChange(updated)
              onUpdateToolNode(toolNodeId, {
                config: { ...toolNode?.config, elementName: e.target.value }
              })
            }}
            placeholder="e.g., w, p"
            className="h-8 text-xs"
          />
        </div>
      )}
      {existsConfig.checkType === 'attribute' && (
        <div className="space-y-2">
          <Label className="text-xs font-medium">Attribute Name</Label>
          <Input
            value={existsConfig.attributeName || ''}
            onChange={(e) => {
              const updated = { ...existsConfig, attributeName: e.target.value }
              onExistsConfigChange(updated)
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
        <Label className="text-xs font-medium">Target Property</Label>
        <Input
          value={existsConfig.targetProperty || ''}
          onChange={(e) => {
            const updated = { ...existsConfig, targetProperty: e.target.value }
            onExistsConfigChange(updated)
            onUpdateToolNode(toolNodeId, {
              config: { ...toolNode?.config, targetProperty: e.target.value }
            })
          }}
          placeholder="e.g., exists"
          className="h-8 text-xs"
        />
      </div>
    </div>
  )
}

