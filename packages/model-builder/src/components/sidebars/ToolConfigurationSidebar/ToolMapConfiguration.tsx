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

interface MapMapping {
  source: 'attribute' | 'textContent' | 'elementName'
  sourceName?: string
  target: 'attribute' | 'property'
  targetName: string
}

interface MapConfig {
  mappings: MapMapping[]
}

interface ToolMapConfigurationProps {
  toolNodeId: string
  toolNode: ToolCanvasNode | null
  mapConfig: MapConfig
  onMapConfigChange: (config: MapConfig) => void
  onUpdateToolNode: (id: string, updates: Partial<ToolCanvasNode>) => void
}

export function ToolMapConfiguration({
  toolNodeId,
  toolNode,
  mapConfig,
  onMapConfigChange,
  onUpdateToolNode
}: ToolMapConfigurationProps) {
  return (
    <div className="space-y-4">
      <div className="mb-2">
        <Label className="text-xs font-medium">Map Configuration</Label>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium">Mappings</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const newMapping: MapMapping = { source: 'attribute', target: 'property', targetName: '' }
              const updated = { ...mapConfig, mappings: [...mapConfig.mappings, newMapping] }
              onMapConfigChange(updated)
              onUpdateToolNode(toolNodeId, {
                config: { ...toolNode?.config, mappings: [...mapConfig.mappings, newMapping] }
              })
            }}
            className="h-6 px-2 text-[10px]"
          >
            + Add Mapping
          </Button>
        </div>
        <div className="space-y-2">
          {mapConfig.mappings.map((mapping, index) => (
            <div key={index} className="p-2 border rounded space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">Mapping {index + 1}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const updated = { ...mapConfig, mappings: mapConfig.mappings.filter((_, i) => i !== index) }
                    onMapConfigChange(updated)
                    onUpdateToolNode(toolNodeId, {
                      config: { ...toolNode?.config, mappings: mapConfig.mappings.filter((_, i) => i !== index) }
                    })
                  }}
                  className="h-6 w-6 p-0 text-destructive"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <Select
                value={mapping.source}
                onValueChange={(value) => {
                  const updated = [...mapConfig.mappings]
                  updated[index] = { ...updated[index], source: value as MapMapping['source'] }
                  const updatedConfig = { ...mapConfig, mappings: updated }
                  onMapConfigChange(updatedConfig)
                  onUpdateToolNode(toolNodeId, {
                    config: { ...toolNode?.config, mappings: updated }
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
              {mapping.source === 'attribute' && (
                <Input
                  placeholder="Source attribute name"
                  className="h-7 text-xs"
                  value={mapping.sourceName || ''}
                  onChange={(e) => {
                    const updated = [...mapConfig.mappings]
                    updated[index] = { ...updated[index], sourceName: e.target.value }
                    const updatedConfig = { ...mapConfig, mappings: updated }
                    onMapConfigChange(updatedConfig)
                    onUpdateToolNode(toolNodeId, {
                      config: { ...toolNode?.config, mappings: updated }
                    })
                  }}
                />
              )}
              <Select
                value={mapping.target}
                onValueChange={(value) => {
                  const updated = [...mapConfig.mappings]
                  updated[index] = { ...updated[index], target: value as MapMapping['target'] }
                  const updatedConfig = { ...mapConfig, mappings: updated }
                  onMapConfigChange(updatedConfig)
                  onUpdateToolNode(toolNodeId, {
                    config: { ...toolNode?.config, mappings: updated }
                  })
                }}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="attribute">Attribute</SelectItem>
                  <SelectItem value="property">Property</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Target name"
                className="h-7 text-xs"
                value={mapping.targetName}
                onChange={(e) => {
                  const updated = [...mapConfig.mappings]
                  updated[index] = { ...updated[index], targetName: e.target.value }
                  const updatedConfig = { ...mapConfig, mappings: updated }
                  onMapConfigChange(updatedConfig)
                  onUpdateToolNode(toolNodeId, {
                    config: { ...toolNode?.config, mappings: updated }
                  })
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

