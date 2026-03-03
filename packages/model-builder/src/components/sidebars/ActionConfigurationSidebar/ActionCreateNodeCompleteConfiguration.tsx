'use client'

import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { Switch } from '../../ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../../ui/select'
import { X, ArrowRight, ArrowLeft } from 'lucide-react'
import { CollapsibleSection } from '../../shared/CollapsibleSection'
import type { ActionCanvasNode } from '../../../stores/actionCanvasStore'
import type { ActionConfigurationState } from '../../../stores/actionConfigurationStore'

interface ActionCreateNodeCompleteConfigurationProps {
  actionNodeId: string
  actionNode: ActionCanvasNode | null
  createNodeCompleteConfig: ActionConfigurationState['createNodeCompleteConfig']
  onCreateNodeCompleteConfigChange: (config: ActionConfigurationState['createNodeCompleteConfig']) => void
  onUpdateActionNode: (id: string, updates: Partial<ActionCanvasNode>) => void
}

export function ActionCreateNodeCompleteConfiguration({
  actionNodeId,
  actionNode,
  createNodeCompleteConfig,
  onCreateNodeCompleteConfigChange,
  onUpdateActionNode
}: ActionCreateNodeCompleteConfigurationProps) {
  if (!actionNode) return null

  return (
    <CollapsibleSection title="Create Node Complete Configuration" defaultOpen={true}>
      <div className="space-y-4">
        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded">
          <p className="text-xs text-blue-800 dark:text-blue-200">
            <strong>Quick Action:</strong> Creates a node with attribute mappings and transforms. Use separate text node or character node actions for text content.
          </p>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Node Label</Label>
          <Input
            placeholder="e.g., Word, W"
            className="h-8 text-xs"
            value={createNodeCompleteConfig.nodeLabel}
            onChange={(e) => {
              const value = e.target.value
              const updated = { ...createNodeCompleteConfig, nodeLabel: value }
              onCreateNodeCompleteConfigChange(updated)
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, nodeLabel: value }
              })
            }}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium">Unique ID Template (Optional)</Label>
          <Input
            placeholder="e.g., {{ $json.id }} or node-{{ 1 }}"
            className="h-8 text-xs"
            value={createNodeCompleteConfig.uniqueId || ''}
            onChange={(e) => {
              const value = e.target.value
              const updated = { ...createNodeCompleteConfig, uniqueId: value }
              onCreateNodeCompleteConfigChange(updated)
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, uniqueId: value }
              })
            }}
          />
          <p className="text-[10px] text-muted-foreground">
            If provided, finding a node with this ID will update it instead of creating a new one (Upsert).
          </p>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">Attribute Mappings</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const newMapping = { attributeName: '', propertyKey: '', transforms: [] }
                const updated = {
                  ...createNodeCompleteConfig,
                  attributeMappings: [...createNodeCompleteConfig.attributeMappings, newMapping]
                }
                onCreateNodeCompleteConfigChange(updated)
                onUpdateActionNode(actionNodeId, {
                  config: {
                    ...actionNode.config,
                    attributeMappings: [...(createNodeCompleteConfig.attributeMappings || []), newMapping]
                  }
                })
              }}
              className="h-6 px-2 text-[10px]"
            >
              + Add Mapping
            </Button>
          </div>
          <div className="space-y-2">
            {createNodeCompleteConfig.attributeMappings.map((mapping, index) => (
              <div key={index} className="p-2 border rounded space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">Mapping {index + 1}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const updated = createNodeCompleteConfig.attributeMappings.filter((_, i) => i !== index)
                      const newConfig = { ...createNodeCompleteConfig, attributeMappings: updated }
                      onCreateNodeCompleteConfigChange(newConfig)
                      onUpdateActionNode(actionNodeId, {
                        config: { ...actionNode.config, attributeMappings: updated }
                      })
                    }}
                    className="h-6 w-6 p-0 text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <Input
                  placeholder="XML attribute"
                  className="h-7 text-xs"
                  value={mapping.attributeName}
                  onChange={(e) => {
                    const updated = [...createNodeCompleteConfig.attributeMappings]
                    updated[index] = { ...updated[index], attributeName: e.target.value }
                    const newConfig = { ...createNodeCompleteConfig, attributeMappings: updated }
                    onCreateNodeCompleteConfigChange(newConfig)
                    onUpdateActionNode(actionNodeId, {
                      config: { ...actionNode.config, attributeMappings: updated }
                    })
                  }}
                />
                <Input
                  placeholder="Property key"
                  className="h-7 text-xs"
                  value={mapping.propertyKey}
                  onChange={(e) => {
                    const updated = [...createNodeCompleteConfig.attributeMappings]
                    updated[index] = { ...updated[index], propertyKey: e.target.value }
                    const newConfig = { ...createNodeCompleteConfig, attributeMappings: updated }
                    onCreateNodeCompleteConfigChange(newConfig)
                    onUpdateActionNode(actionNodeId, {
                      config: { ...actionNode.config, attributeMappings: updated }
                    })
                  }}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-3 pt-2 border-t mt-4">
          <Label className="text-xs font-semibold">Relationship Configuration</Label>
          <div className="space-y-2">
            <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Relationship Mode</Label>
            <Select
              value={createNodeCompleteConfig.relationship?.mode || 'connected'}
              onValueChange={(value) => {
                const mode = value as 'standalone' | 'connected' | 'existing' | 'deferred'
                const updated = {
                  ...createNodeCompleteConfig,
                  relationship: {
                    mode,
                    type: createNodeCompleteConfig.relationship?.type || 'contains',
                    direction: createNodeCompleteConfig.relationship?.direction || 'outgoing',
                    targetNodeId: createNodeCompleteConfig.relationship?.targetNodeId,
                    targetNodeLabel: createNodeCompleteConfig.relationship?.targetNodeLabel
                  }
                }
                onCreateNodeCompleteConfigChange(updated)
                onUpdateActionNode(actionNodeId, {
                  config: { ...actionNode.config, relationship: updated.relationship }
                })
              }}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standalone">Standalone (No relationship)</SelectItem>
                <SelectItem value="connected">Connected to Parent / Connected Node</SelectItem>
                <SelectItem value="deferred">Deferred (Resolve by ID during generation)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(createNodeCompleteConfig.relationship?.mode === 'connected' || createNodeCompleteConfig.relationship?.mode === 'deferred') && (
            <>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Relationship Type</Label>
                <Input
                  placeholder="e.g., contains, relatesTo"
                  className="h-8 text-xs"
                  value={createNodeCompleteConfig.relationship?.type || ''}
                  onChange={(e) => {
                    const value = e.target.value
                    const updated: ActionConfigurationState['createNodeCompleteConfig'] = {
                      ...createNodeCompleteConfig,
                      relationship: {
                        mode: createNodeCompleteConfig.relationship?.mode || 'connected',
                        direction: createNodeCompleteConfig.relationship?.direction || 'outgoing',
                        targetNodeId: createNodeCompleteConfig.relationship?.targetNodeId,
                        targetNodeLabel: createNodeCompleteConfig.relationship?.targetNodeLabel,
                        type: value
                      }
                    }
                    onCreateNodeCompleteConfigChange(updated)
                    onUpdateActionNode(actionNodeId, {
                      config: { ...actionNode.config, relationship: updated.relationship }
                    })
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium">Direction</Label>
                <Select
                  value={createNodeCompleteConfig.relationship?.direction || 'outgoing'}
                  onValueChange={(value) => {
                    const direction = value as 'outgoing' | 'incoming'
                    const updated: ActionConfigurationState['createNodeCompleteConfig'] = {
                      ...createNodeCompleteConfig,
                      relationship: {
                        mode: createNodeCompleteConfig.relationship?.mode || 'connected',
                        type: createNodeCompleteConfig.relationship?.type || 'contains',
                        targetNodeId: createNodeCompleteConfig.relationship?.targetNodeId,
                        targetNodeLabel: createNodeCompleteConfig.relationship?.targetNodeLabel,
                        direction
                      }
                    }
                    onCreateNodeCompleteConfigChange(updated)
                    onUpdateActionNode(actionNodeId, {
                      config: { ...actionNode.config, relationship: updated.relationship }
                    })
                  }}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="outgoing">
                      <div className="flex items-center gap-2">
                        <ArrowRight className="h-3 w-3" />
                        <span>Source → Created Node</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="incoming">
                      <div className="flex items-center gap-2">
                        <ArrowLeft className="h-3 w-3" />
                        <span>Created Node → Source</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {createNodeCompleteConfig.relationship?.mode === 'deferred' && (
            <div className="space-y-2 p-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded">
              <Label className="text-xs font-medium">Target Node Lookup</Label>
              <div className="space-y-2">
                <Label className="text-[10px]">Target Label</Label>
                <Input
                  placeholder="e.g., Person"
                  className="h-7 text-xs"
                  value={createNodeCompleteConfig.relationship?.targetNodeLabel || ''}
                  onChange={(e) => {
                    const value = e.target.value
                    const updated: ActionConfigurationState['createNodeCompleteConfig'] = {
                      ...createNodeCompleteConfig,
                      relationship: {
                        mode: 'deferred',
                        type: createNodeCompleteConfig.relationship?.type || 'relatesTo',
                        direction: createNodeCompleteConfig.relationship?.direction || 'outgoing',
                        targetNodeId: createNodeCompleteConfig.relationship?.targetNodeId,
                        targetNodeLabel: value
                      }
                    }
                    onCreateNodeCompleteConfigChange(updated)
                    onUpdateActionNode(actionNodeId, {
                      config: { ...actionNode.config, relationship: updated.relationship }
                    })
                  }}
                />
              </div>
              <div className="space-y-2 mt-2">
                <Label className="text-[10px]">Target ID template</Label>
                <Input
                  placeholder="e.g., {{ $json.id }}"
                  className="h-7 text-xs"
                  value={createNodeCompleteConfig.relationship?.targetNodeId || ''}
                  onChange={(e) => {
                    const value = e.target.value
                    const updated: ActionConfigurationState['createNodeCompleteConfig'] = {
                      ...createNodeCompleteConfig,
                      relationship: {
                        mode: 'deferred',
                        type: createNodeCompleteConfig.relationship?.type || 'relatesTo',
                        direction: createNodeCompleteConfig.relationship?.direction || 'outgoing',
                        targetNodeLabel: createNodeCompleteConfig.relationship?.targetNodeLabel,
                        targetNodeId: value
                      }
                    }
                    onCreateNodeCompleteConfigChange(updated)
                    onUpdateActionNode(actionNodeId, {
                      config: { ...actionNode.config, relationship: updated.relationship }
                    })
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </CollapsibleSection>
  )
}

