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
import { CollapsibleSection } from '../../shared/CollapsibleSection'
import type { ToolCanvasNode } from '../../../stores/toolCanvasStore'

interface IntersectSource {
  type: 'children' | 'attribute' | 'xpath'
  value?: string
}

interface IntersectConfig {
  sources: IntersectSource[]
  matchBy?: 'elementName' | 'attribute' | 'textContent'
  attributeName?: string
  targetProperty?: string
}

interface ToolIntersectConfigurationProps {
  toolNodeId: string
  toolNode: ToolCanvasNode | null
  intersectConfig: IntersectConfig
  onIntersectConfigChange: (config: IntersectConfig) => void
  onUpdateToolNode: (id: string, updates: Partial<ToolCanvasNode>) => void
}

export function ToolIntersectConfiguration({
  toolNodeId,
  toolNode,
  intersectConfig,
  onIntersectConfigChange,
  onUpdateToolNode
}: ToolIntersectConfigurationProps) {
  if (!toolNode) return null

  return (
    <CollapsibleSection title="Intersect Configuration" defaultOpen={true}>
      <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium">Sources</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const newSource: IntersectSource = { type: 'children', value: '' }
              const updated = { ...intersectConfig, sources: [...intersectConfig.sources, newSource] }
              onIntersectConfigChange(updated)
              onUpdateToolNode(toolNodeId, {
                config: { ...toolNode?.config, sources: [...intersectConfig.sources, newSource] }
              })
            }}
            className="h-6 px-2 text-[10px]"
          >
            + Add Source
          </Button>
        </div>
        <div className="space-y-2">
          {intersectConfig.sources.map((source, index) => (
            <div key={index} className="p-2 border rounded space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">Source {index + 1}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const updated = { ...intersectConfig, sources: intersectConfig.sources.filter((_, i) => i !== index) }
                    onIntersectConfigChange(updated)
                    onUpdateToolNode(toolNodeId, {
                      config: { ...toolNode?.config, sources: intersectConfig.sources.filter((_, i) => i !== index) }
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
                  const updated = [...intersectConfig.sources]
                  updated[index] = { ...updated[index], type: value as IntersectSource['type'] }
                  const updatedConfig = { ...intersectConfig, sources: updated }
                  onIntersectConfigChange(updatedConfig)
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
                  const updated = [...intersectConfig.sources]
                  updated[index] = { ...updated[index], value: e.target.value }
                  const updatedConfig = { ...intersectConfig, sources: updated }
                  onIntersectConfigChange(updatedConfig)
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
        <Label className="text-xs font-medium">Match By</Label>
        <Select
          value={intersectConfig.matchBy || 'elementName'}
          onValueChange={(value) => {
            const updated = { ...intersectConfig, matchBy: value as IntersectConfig['matchBy'] }
            onIntersectConfigChange(updated)
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
      {intersectConfig.matchBy === 'attribute' && (
        <div className="space-y-2">
          <Label className="text-xs font-medium">Attribute Name</Label>
          <Input
            value={intersectConfig.attributeName || ''}
            onChange={(e) => {
              const updated = { ...intersectConfig, attributeName: e.target.value }
              onIntersectConfigChange(updated)
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
          value={intersectConfig.targetProperty || ''}
          onChange={(e) => {
            const updated = { ...intersectConfig, targetProperty: e.target.value }
            onIntersectConfigChange(updated)
            onUpdateToolNode(toolNodeId, {
              config: { ...toolNode?.config, targetProperty: e.target.value }
            })
          }}
          placeholder="e.g., intersect"
          className="h-8 text-xs"
        />
      </div>
      </div>
    </CollapsibleSection>
  )
}

