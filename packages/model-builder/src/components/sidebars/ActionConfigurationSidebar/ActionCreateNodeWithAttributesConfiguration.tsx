'use client'

import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { X } from 'lucide-react'
import { CollapsibleSection } from '../../shared/CollapsibleSection'
import type { ActionCanvasNode } from '../../../stores/actionCanvasStore'
import type { ActionConfigurationState } from '../../../stores/actionConfigurationStore'

interface ActionCreateNodeWithAttributesConfigurationProps {
  actionNodeId: string
  actionNode: ActionCanvasNode | null
  createNodeWithAttributesConfig: ActionConfigurationState['createNodeWithAttributesConfig']
  onCreateNodeWithAttributesConfigChange: (config: ActionConfigurationState['createNodeWithAttributesConfig']) => void
  onUpdateActionNode: (id: string, updates: Partial<ActionCanvasNode>) => void
}

export function ActionCreateNodeWithAttributesConfiguration({
  actionNodeId,
  actionNode,
  createNodeWithAttributesConfig,
  onCreateNodeWithAttributesConfigChange,
  onUpdateActionNode
}: ActionCreateNodeWithAttributesConfigurationProps) {
  if (!actionNode) return null

  return (
    <CollapsibleSection title="Create Node With Attributes Configuration" defaultOpen={true}>
      <div className="space-y-4">
        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded">
          <p className="text-xs text-blue-800 dark:text-blue-200">
            <strong>Quick Action:</strong> Creates a node and automatically maps XML attributes to node properties. Perfect for elements with multiple attributes.
          </p>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Node Label</Label>
          <Input
            placeholder="e.g., Word, W"
            className="h-8 text-xs"
            value={createNodeWithAttributesConfig.nodeLabel}
            onChange={(e) => {
              const value = e.target.value
              const updated = { ...createNodeWithAttributesConfig, nodeLabel: value }
              onCreateNodeWithAttributesConfigChange(updated)
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, nodeLabel: value }
              })
            }}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">Attribute Mappings</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const newMapping = { attributeName: '', propertyKey: '', defaultValue: '' }
                const updated = {
                  ...createNodeWithAttributesConfig,
                  attributeMappings: [...createNodeWithAttributesConfig.attributeMappings, newMapping]
                }
                onCreateNodeWithAttributesConfigChange(updated)
                onUpdateActionNode(actionNodeId, {
                  config: {
                    ...actionNode.config,
                    attributeMappings: [...(createNodeWithAttributesConfig.attributeMappings || []), newMapping]
                  }
                })
              }}
              className="h-6 px-2 text-[10px]"
            >
              + Add Mapping
            </Button>
          </div>
          <div className="space-y-2">
            {createNodeWithAttributesConfig.attributeMappings.map((mapping, index) => (
              <div key={index} className="flex gap-2 items-center p-2 border rounded">
                <Input
                  placeholder="XML attribute"
                  className="h-7 text-xs flex-1"
                  value={mapping.attributeName}
                  onChange={(e) => {
                    const updated = [...createNodeWithAttributesConfig.attributeMappings]
                    updated[index] = { ...updated[index], attributeName: e.target.value }
                    const newConfig = { ...createNodeWithAttributesConfig, attributeMappings: updated }
                    onCreateNodeWithAttributesConfigChange(newConfig)
                    onUpdateActionNode(actionNodeId, {
                      config: { ...actionNode.config, attributeMappings: updated }
                    })
                  }}
                />
                <span className="text-xs text-muted-foreground">→</span>
                <Input
                  placeholder="Property key"
                  className="h-7 text-xs flex-1"
                  value={mapping.propertyKey}
                  onChange={(e) => {
                    const updated = [...createNodeWithAttributesConfig.attributeMappings]
                    updated[index] = { ...updated[index], propertyKey: e.target.value }
                    const newConfig = { ...createNodeWithAttributesConfig, attributeMappings: updated }
                    onCreateNodeWithAttributesConfigChange(newConfig)
                    onUpdateActionNode(actionNodeId, {
                      config: { ...actionNode.config, attributeMappings: updated }
                    })
                  }}
                />
                <Input
                  placeholder="Default (optional)"
                  className="h-7 text-xs w-20"
                  value={mapping.defaultValue || ''}
                  onChange={(e) => {
                    const updated = [...createNodeWithAttributesConfig.attributeMappings]
                    updated[index] = { ...updated[index], defaultValue: e.target.value }
                    const newConfig = { ...createNodeWithAttributesConfig, attributeMappings: updated }
                    onCreateNodeWithAttributesConfigChange(newConfig)
                    onUpdateActionNode(actionNodeId, {
                      config: { ...actionNode.config, attributeMappings: updated }
                    })
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const updated = createNodeWithAttributesConfig.attributeMappings.filter((_, i) => i !== index)
                    const newConfig = { ...createNodeWithAttributesConfig, attributeMappings: updated }
                    onCreateNodeWithAttributesConfigChange(newConfig)
                    onUpdateActionNode(actionNodeId, {
                      config: { ...actionNode.config, attributeMappings: updated }
                    })
                  }}
                  className="h-7 w-7 p-0 text-destructive"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
            {createNodeWithAttributesConfig.attributeMappings.length === 0 && (
              <p className="text-[10px] text-muted-foreground">No attribute mappings defined</p>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Parent Relationship Type</Label>
          <Input
            placeholder="e.g., contains"
            className="h-8 text-xs"
            value={createNodeWithAttributesConfig.parentRelationship}
            onChange={(e) => {
              const value = e.target.value
              const updated = { ...createNodeWithAttributesConfig, parentRelationship: value }
              onCreateNodeWithAttributesConfigChange(updated)
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, parentRelationship: value }
              })
            }}
          />
        </div>
      </div>
    </CollapsibleSection>
  )
}

