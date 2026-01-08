'use client'

import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { Plus, X } from 'lucide-react'
import type { ToolCanvasNode } from '../../../stores/toolCanvasStore'

interface TransformMapping {
  id: string
  source: string
  target: string
  defaultValue?: string
}

interface TransformConfig {
  mappings: TransformMapping[]
}

interface ToolTransformConfigurationProps {
  toolNodeId: string
  toolNode: ToolCanvasNode | null
  transformConfig: TransformConfig
  onTransformConfigChange: (config: TransformConfig) => void
  onUpdateToolNode: (id: string, updates: Partial<ToolCanvasNode>) => void
}

export function ToolTransformConfiguration({
  toolNodeId,
  toolNode,
  transformConfig,
  onTransformConfigChange,
  onUpdateToolNode
}: ToolTransformConfigurationProps) {
  return (
    <div className="space-y-4">
      <div className="mb-2">
        <Label className="text-xs font-medium">Transform Configuration</Label>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium">Property Mappings</Label>
          <Button
            size="sm"
            onClick={() => {
              const newMapping: TransformMapping = {
                id: `mapping_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                source: '',
                target: '',
                defaultValue: ''
              }
              const updated = [...transformConfig.mappings, newMapping]
              onTransformConfigChange({ ...transformConfig, mappings: updated })
              onUpdateToolNode(toolNodeId, {
                config: { ...toolNode?.config, mappings: updated }
              })
            }}
            className="h-7 px-3 text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Mapping
          </Button>
        </div>
        {transformConfig.mappings.length === 0 ? (
          <div className="text-xs text-muted-foreground text-center py-4 border rounded">
            No mappings defined. Add a mapping to configure the transform.
          </div>
        ) : (
          <div className="space-y-2">
            {transformConfig.mappings.map((mapping) => (
              <div key={mapping.id} className="border rounded p-2 space-y-2 bg-background">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">Mapping</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const updated = transformConfig.mappings.filter(m => m.id !== mapping.id)
                      onTransformConfigChange({ ...transformConfig, mappings: updated })
                      onUpdateToolNode(toolNodeId, {
                        config: { ...toolNode?.config, mappings: updated }
                      })
                    }}
                    className="h-5 w-5 p-0 text-destructive hover:bg-destructive/10 shrink-0"
                  >
                    <X className="h-2.5 w-2.5" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Source Attribute</Label>
                    <Input
                      value={mapping.source}
                      onChange={(e) => {
                        const updated = transformConfig.mappings.map(m =>
                          m.id === mapping.id ? { ...m, source: e.target.value } : m
                        )
                        onTransformConfigChange({ ...transformConfig, mappings: updated })
                        onUpdateToolNode(toolNodeId, {
                          config: { ...toolNode?.config, mappings: updated }
                        })
                      }}
                      placeholder="Source attribute"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Target Property</Label>
                    <Input
                      value={mapping.target}
                      onChange={(e) => {
                        const updated = transformConfig.mappings.map(m =>
                          m.id === mapping.id ? { ...m, target: e.target.value } : m
                        )
                        onTransformConfigChange({ ...transformConfig, mappings: updated })
                        onUpdateToolNode(toolNodeId, {
                          config: { ...toolNode?.config, mappings: updated }
                        })
                      }}
                      placeholder="Target property"
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Default Value (optional)</Label>
                  <Input
                    value={mapping.defaultValue || ''}
                    onChange={(e) => {
                      const updated = transformConfig.mappings.map(m =>
                        m.id === mapping.id ? { ...m, defaultValue: e.target.value } : m
                      )
                      onTransformConfigChange({ ...transformConfig, mappings: updated })
                      onUpdateToolNode(toolNodeId, {
                        config: { ...toolNode?.config, mappings: updated }
                      })
                    }}
                    placeholder="Default value if source is missing"
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

