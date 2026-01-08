'use client'

import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../../ui/select'
import { X } from 'lucide-react'
import type { ToolCanvasNode } from '../../../stores/toolCanvasStore'

interface UnionSource {
  type: 'children' | 'attribute' | 'xpath'
  value?: string
}

interface UnionConfig {
  sources: UnionSource[]
  targetProperty?: string
}

interface ToolUnionConfigurationProps {
  toolNodeId: string
  toolNode: ToolCanvasNode | null
  unionConfig: UnionConfig
  onUnionConfigChange: (config: UnionConfig) => void
  onUpdateToolNode: (id: string, updates: Partial<ToolCanvasNode>) => void
}

export function ToolUnionConfiguration({
  toolNodeId,
  toolNode,
  unionConfig,
  onUnionConfigChange,
  onUpdateToolNode
}: ToolUnionConfigurationProps) {
  return (
    <div className="space-y-4">
      <div className="mb-2">
        <Label className="text-xs font-medium">Union Configuration</Label>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium">Sources</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const newSource: UnionSource = { type: 'children', value: '' }
              const updated = { ...unionConfig, sources: [...unionConfig.sources, newSource] }
              onUnionConfigChange(updated)
              onUpdateToolNode(toolNodeId, {
                config: { ...toolNode?.config, sources: [...unionConfig.sources, newSource] }
              })
            }}
            className="h-6 px-2 text-[10px]"
          >
            + Add Source
          </Button>
        </div>
        <div className="space-y-2">
          {unionConfig.sources.map((source, index) => (
            <div key={index} className="p-2 border rounded space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">Source {index + 1}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const updated = { ...unionConfig, sources: unionConfig.sources.filter((_, i) => i !== index) }
                    onUnionConfigChange(updated)
                    onUpdateToolNode(toolNodeId, {
                      config: { ...toolNode?.config, sources: unionConfig.sources.filter((_, i) => i !== index) }
                    })
                  }}
                  className="h-6 w-6 p-0 text-destructive"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <Select
                value={source.type}
                onValueChange={(value) => {
                  const updated = [...unionConfig.sources]
                  updated[index] = { ...updated[index], type: value as UnionSource['type'] }
                  const updatedConfig = { ...unionConfig, sources: updated }
                  onUnionConfigChange(updatedConfig)
                  onUpdateToolNode(toolNodeId, {
                    config: { ...toolNode?.config, sources: updated }
                  })
                }}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="children">Children</SelectItem>
                  <SelectItem value="attribute">Attribute</SelectItem>
                  <SelectItem value="xpath">XPath</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Source value"
                className="h-7 text-xs"
                value={source.value || ''}
                onChange={(e) => {
                  const updated = [...unionConfig.sources]
                  updated[index] = { ...updated[index], value: e.target.value }
                  const updatedConfig = { ...unionConfig, sources: updated }
                  onUnionConfigChange(updatedConfig)
                  onUpdateToolNode(toolNodeId, {
                    config: { ...toolNode?.config, sources: updated }
                  })
                }}
              />
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-xs font-medium">Target Property</Label>
        <Input
          value={unionConfig.targetProperty || ''}
          onChange={(e) => {
            const updated = { ...unionConfig, targetProperty: e.target.value }
            onUnionConfigChange(updated)
            onUpdateToolNode(toolNodeId, {
              config: { ...toolNode?.config, targetProperty: e.target.value }
            })
          }}
          placeholder="e.g., union"
          className="h-8 text-xs"
        />
      </div>
    </div>
  )
}

