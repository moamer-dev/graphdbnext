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

interface DiffSource {
  type: 'children' | 'attribute'
  value: string
}

interface DiffConfig {
  sourceA: DiffSource
  sourceB: DiffSource
  matchBy?: 'elementName' | 'attribute' | 'textContent'
  attributeName?: string
  targetProperty?: string
}

interface ToolDiffConfigurationProps {
  toolNodeId: string
  toolNode: ToolCanvasNode | null
  diffConfig: DiffConfig
  onDiffConfigChange: (config: DiffConfig) => void
  onUpdateToolNode: (id: string, updates: Partial<ToolCanvasNode>) => void
}

export function ToolDiffConfiguration({
  toolNodeId,
  toolNode,
  diffConfig,
  onDiffConfigChange,
  onUpdateToolNode
}: ToolDiffConfigurationProps) {
  return (
    <div className="space-y-4">
      <div className="mb-2">
        <Label className="text-xs font-medium">Diff Configuration</Label>
      </div>
      <div className="space-y-2">
        <Label className="text-xs font-medium">Source A</Label>
        <Select
          value={diffConfig.sourceA.type}
          onValueChange={(value) => {
            const updated = { ...diffConfig, sourceA: { ...diffConfig.sourceA, type: value as DiffSource['type'] } }
            onDiffConfigChange(updated)
            onUpdateToolNode(toolNodeId, {
              config: { ...toolNode?.config, sourceA: { ...diffConfig.sourceA, type: value } }
            })
          }}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="children">Children</SelectItem>
            <SelectItem value="attribute">Attribute</SelectItem>
          </SelectContent>
        </Select>
        <Input
          placeholder="Source A value"
          className="h-8 text-xs"
          value={diffConfig.sourceA.value || ''}
          onChange={(e) => {
            const updated = { ...diffConfig, sourceA: { ...diffConfig.sourceA, value: e.target.value } }
            onDiffConfigChange(updated)
            onUpdateToolNode(toolNodeId, {
              config: { ...toolNode?.config, sourceA: { ...diffConfig.sourceA, value: e.target.value } }
            })
          }}
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs font-medium">Source B</Label>
        <Select
          value={diffConfig.sourceB.type}
          onValueChange={(value) => {
            const updated = { ...diffConfig, sourceB: { ...diffConfig.sourceB, type: value as DiffSource['type'] } }
            onDiffConfigChange(updated)
            onUpdateToolNode(toolNodeId, {
              config: { ...toolNode?.config, sourceB: { ...diffConfig.sourceB, type: value } }
            })
          }}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="children">Children</SelectItem>
            <SelectItem value="attribute">Attribute</SelectItem>
          </SelectContent>
        </Select>
        <Input
          placeholder="Source B value"
          className="h-8 text-xs"
          value={diffConfig.sourceB.value || ''}
          onChange={(e) => {
            const updated = { ...diffConfig, sourceB: { ...diffConfig.sourceB, value: e.target.value } }
            onDiffConfigChange(updated)
            onUpdateToolNode(toolNodeId, {
              config: { ...toolNode?.config, sourceB: { ...diffConfig.sourceB, value: e.target.value } }
            })
          }}
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs font-medium">Match By</Label>
        <Select
          value={diffConfig.matchBy || ''}
          onValueChange={(value) => {
            const updated = { ...diffConfig, matchBy: value as DiffConfig['matchBy'] }
            onDiffConfigChange(updated)
            onUpdateToolNode(toolNodeId, {
              config: { ...toolNode?.config, matchBy: value }
            })
          }}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="elementName">Element Name</SelectItem>
            <SelectItem value="attribute">Attribute</SelectItem>
            <SelectItem value="textContent">Text Content</SelectItem>
          </SelectContent>
        </Select>
      </div>
            {(diffConfig.matchBy || '') === 'attribute' && (
        <div className="space-y-2">
          <Label className="text-xs font-medium">Attribute Name</Label>
          <Input
            value={diffConfig.attributeName || ''}
            onChange={(e) => {
              const updated = { ...diffConfig, attributeName: e.target.value }
              onDiffConfigChange(updated)
              onUpdateToolNode(toolNodeId, {
                config: { ...toolNode?.config, attributeName: e.target.value }
              })
            }}
            placeholder="e.g., id"
            className="h-8 text-xs"
          />
        </div>
      )}
      <div className="space-y-2">
        <Label className="text-xs font-medium">Target Property</Label>
        <Input
          value={diffConfig.targetProperty || ''}
          onChange={(e) => {
            const updated = { ...diffConfig, targetProperty: e.target.value }
            onDiffConfigChange(updated)
            onUpdateToolNode(toolNodeId, {
              config: { ...toolNode?.config, targetProperty: e.target.value }
            })
          }}
          placeholder="e.g., diff"
          className="h-8 text-xs"
        />
      </div>
    </div>
  )
}

