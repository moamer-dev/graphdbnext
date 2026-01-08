'use client'

import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select'
import { CollapsibleSection } from '../../shared/CollapsibleSection'
import type { ActionCanvasNode } from '../../../stores/actionCanvasStore'
import type { ActionConfigurationState } from '../../../stores/actionConfigurationStore'

interface ActionCreateReferenceChainConfigurationProps {
  actionNodeId: string
  actionNode: ActionCanvasNode | null
  createReferenceChainConfig: ActionConfigurationState['createReferenceChainConfig']
  onCreateReferenceChainConfigChange: (config: ActionConfigurationState['createReferenceChainConfig']) => void
  onUpdateActionNode: (id: string, updates: Partial<ActionCanvasNode>) => void
}

export function ActionCreateReferenceChainConfiguration({
  actionNodeId,
  actionNode,
  createReferenceChainConfig,
  onCreateReferenceChainConfigChange,
  onUpdateActionNode
}: ActionCreateReferenceChainConfigurationProps) {
  if (!actionNode) return null

  return (
    <CollapsibleSection title="Create Reference Chain Configuration" defaultOpen={true}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-medium">Reference Attribute</Label>
          <Input
            placeholder="e.g., corresp, target, ref"
            className="h-8 text-xs"
            value={createReferenceChainConfig.referenceAttribute}
            onChange={(e) => {
              const value = e.target.value
              const updated = { ...createReferenceChainConfig, referenceAttribute: value }
              onCreateReferenceChainConfigChange(updated)
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, referenceAttribute: value }
              })
            }}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Target Node Label</Label>
          <Input
            placeholder="e.g., Word, Section"
            className="h-8 text-xs"
            value={createReferenceChainConfig.targetNodeLabel}
            onChange={(e) => {
              const value = e.target.value
              const updated = { ...createReferenceChainConfig, targetNodeLabel: value }
              onCreateReferenceChainConfigChange(updated)
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, targetNodeLabel: value }
              })
            }}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Relationship Type</Label>
          <Input
            placeholder="e.g., refersTo"
            className="h-8 text-xs"
            value={createReferenceChainConfig.relationshipType}
            onChange={(e) => {
              const value = e.target.value
              const updated = { ...createReferenceChainConfig, relationshipType: value }
              onCreateReferenceChainConfigChange(updated)
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, relationshipType: value }
              })
            }}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Resolve Strategy</Label>
          <Select
            value={createReferenceChainConfig.resolveStrategy}
            onValueChange={(value) => {
              const updated = { ...createReferenceChainConfig, resolveStrategy: value as 'id' | 'xpath' }
              onCreateReferenceChainConfigChange(updated)
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, resolveStrategy: value }
              })
            }}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="id">By ID</SelectItem>
              <SelectItem value="xpath">By XPath</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={createReferenceChainConfig.createTargetIfMissing}
            onChange={(e) => {
              const updated = { ...createReferenceChainConfig, createTargetIfMissing: e.target.checked }
              onCreateReferenceChainConfigChange(updated)
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, createTargetIfMissing: e.target.checked }
              })
            }}
            className="h-4 w-4"
          />
          <Label className="text-xs">Create Target If Missing</Label>
        </div>
      </div>
    </CollapsibleSection>
  )
}

