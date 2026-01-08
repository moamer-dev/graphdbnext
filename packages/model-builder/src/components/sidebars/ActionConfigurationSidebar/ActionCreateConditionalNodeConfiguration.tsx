'use client'

import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select'
import { X } from 'lucide-react'
import { CollapsibleSection } from '../../shared/CollapsibleSection'
import type { ActionCanvasNode } from '../../../stores/actionCanvasStore'
import type { ActionConfigurationState } from '../../../stores/actionConfigurationStore'

interface ActionCreateConditionalNodeConfigurationProps {
  actionNodeId: string
  actionNode: ActionCanvasNode | null
  createConditionalNodeConfig: ActionConfigurationState['createConditionalNodeConfig']
  onCreateConditionalNodeConfigChange: (config: ActionConfigurationState['createConditionalNodeConfig']) => void
  onUpdateActionNode: (id: string, updates: Partial<ActionCanvasNode>) => void
}

export function ActionCreateConditionalNodeConfiguration({
  actionNodeId,
  actionNode,
  createConditionalNodeConfig,
  onCreateConditionalNodeConfigChange,
  onUpdateActionNode
}: ActionCreateConditionalNodeConfigurationProps) {
  if (!actionNode) return null

  return (
    <CollapsibleSection title="Create Conditional Node Configuration" defaultOpen={true}>
      <div className="space-y-4">
        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded">
          <p className="text-xs text-blue-800 dark:text-blue-200">
            <strong>Quick Action:</strong> Creates node only if specified conditions are met.
          </p>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Node Label</Label>
          <Input
            placeholder="e.g., Word, W"
            className="h-8 text-xs"
            value={createConditionalNodeConfig.nodeLabel}
            onChange={(e) => {
              const value = e.target.value
              const updated = { ...createConditionalNodeConfig, nodeLabel: value }
              onCreateConditionalNodeConfigChange(updated)
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, nodeLabel: value }
              })
            }}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Condition Operator</Label>
          <Select
            value={createConditionalNodeConfig.operator}
            onValueChange={(value) => {
              const updated = { ...createConditionalNodeConfig, operator: value as 'AND' | 'OR' }
              onCreateConditionalNodeConfigChange(updated)
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, operator: value }
              })
            }}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AND">All conditions (AND)</SelectItem>
              <SelectItem value="OR">Any condition (OR)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">Conditions</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const newCondition = { type: 'hasAttribute' as const }
                const updated = { ...createConditionalNodeConfig, conditions: [...createConditionalNodeConfig.conditions, newCondition] }
                onCreateConditionalNodeConfigChange(updated)
                onUpdateActionNode(actionNodeId, {
                  config: { ...actionNode.config, conditions: updated.conditions }
                })
              }}
              className="h-6 px-2 text-[10px]"
            >
              + Add Condition
            </Button>
          </div>
          <div className="space-y-2">
            {createConditionalNodeConfig.conditions.map((condition, index) => (
              <div key={index} className="p-2 border rounded space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">Condition {index + 1}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const updated = { ...createConditionalNodeConfig, conditions: createConditionalNodeConfig.conditions.filter((_, i) => i !== index) }
                      onCreateConditionalNodeConfigChange(updated)
                      onUpdateActionNode(actionNodeId, {
                        config: { ...actionNode.config, conditions: updated.conditions }
                      })
                    }}
                    className="h-6 w-6 p-0 text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <Select
                  value={condition.type}
                  onValueChange={(value) => {
                    const updated = [...createConditionalNodeConfig.conditions]
                    updated[index] = { ...updated[index], type: value as 'hasAttribute' | 'hasText' | 'hasChildren' }
                    const newConfig = { ...createConditionalNodeConfig, conditions: updated }
                    onCreateConditionalNodeConfigChange(newConfig)
                    onUpdateActionNode(actionNodeId, {
                      config: { ...actionNode.config, conditions: updated }
                    })
                  }}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hasAttribute">Has Attribute</SelectItem>
                    <SelectItem value="hasText">Has Text</SelectItem>
                    <SelectItem value="hasChildren">Has Children</SelectItem>
                  </SelectContent>
                </Select>
                {condition.type === 'hasAttribute' && (
                  <>
                    <Input
                      placeholder="Attribute name"
                      className="h-7 text-xs"
                      value={condition.attributeName || ''}
                      onChange={(e) => {
                        const updated = [...createConditionalNodeConfig.conditions]
                        updated[index] = { ...updated[index], attributeName: e.target.value }
                        const newConfig = { ...createConditionalNodeConfig, conditions: updated }
                        onCreateConditionalNodeConfigChange(newConfig)
                        onUpdateActionNode(actionNodeId, {
                          config: { ...actionNode.config, conditions: updated }
                        })
                      }}
                    />
                    <Input
                      placeholder="Attribute value (optional)"
                      className="h-7 text-xs"
                      value={condition.attributeValue || ''}
                      onChange={(e) => {
                        const updated = [...createConditionalNodeConfig.conditions]
                        updated[index] = { ...updated[index], attributeValue: e.target.value }
                        const newConfig = { ...createConditionalNodeConfig, conditions: updated }
                        onCreateConditionalNodeConfigChange(newConfig)
                        onUpdateActionNode(actionNodeId, {
                          config: { ...actionNode.config, conditions: updated }
                        })
                      }}
                    />
                  </>
                )}
                {condition.type === 'hasText' && (
                  <Input
                    placeholder="Min text length (default: 1)"
                    type="number"
                    className="h-7 text-xs"
                    value={condition.minTextLength || 1}
                    onChange={(e) => {
                      const updated = [...createConditionalNodeConfig.conditions]
                      updated[index] = { ...updated[index], minTextLength: parseInt(e.target.value) || 1 }
                      const newConfig = { ...createConditionalNodeConfig, conditions: updated }
                      onCreateConditionalNodeConfigChange(newConfig)
                      onUpdateActionNode(actionNodeId, {
                        config: { ...actionNode.config, conditions: updated }
                      })
                    }}
                  />
                )}
                {condition.type === 'hasChildren' && (
                  <Input
                    placeholder="Child tag name"
                    className="h-7 text-xs"
                    value={condition.childTag || ''}
                    onChange={(e) => {
                      const updated = [...createConditionalNodeConfig.conditions]
                      updated[index] = { ...updated[index], childTag: e.target.value }
                      const newConfig = { ...createConditionalNodeConfig, conditions: updated }
                      onCreateConditionalNodeConfigChange(newConfig)
                      onUpdateActionNode(actionNodeId, {
                        config: { ...actionNode.config, conditions: updated }
                      })
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Parent Relationship Type</Label>
          <Input
            placeholder="e.g., contains"
            className="h-8 text-xs"
            value={createConditionalNodeConfig.parentRelationship}
            onChange={(e) => {
              const value = e.target.value
              const updated = { ...createConditionalNodeConfig, parentRelationship: value }
              onCreateConditionalNodeConfigChange(updated)
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

