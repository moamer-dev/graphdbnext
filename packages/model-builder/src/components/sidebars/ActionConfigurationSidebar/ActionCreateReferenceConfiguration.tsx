'use client'

import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { CollapsibleSection } from '../../shared/CollapsibleSection'
import type { ActionCanvasNode } from '../../../stores/actionCanvasStore'
import type { ActionConfigurationState } from '../../../stores/actionConfigurationStore'

interface ActionCreateReferenceConfigurationProps {
  actionNodeId: string
  actionNode: ActionCanvasNode | null
  createReferenceConfig: ActionConfigurationState['createReferenceConfig']
  onCreateReferenceConfigChange: (config: ActionConfigurationState['createReferenceConfig']) => void
  onUpdateActionNode: (id: string, updates: Partial<ActionCanvasNode>) => void
}

export function ActionCreateReferenceConfiguration({
  actionNodeId,
  actionNode,
  createReferenceConfig,
  onCreateReferenceConfigChange,
  onUpdateActionNode
}: ActionCreateReferenceConfigurationProps) {
  if (!actionNode) return null

  return (
    <CollapsibleSection title="Create Reference Configuration" defaultOpen={true}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-medium">Reference Attribute</Label>
          <Input
            placeholder="e.g., corresp, target"
            className="h-8 text-xs"
            value={createReferenceConfig.referenceAttribute}
            onChange={(e) => {
              const updated = { ...createReferenceConfig, referenceAttribute: e.target.value }
              onCreateReferenceConfigChange(updated)
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, referenceAttribute: e.target.value }
              })
            }}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Relationship Type</Label>
          <Input
            placeholder="e.g., refersTo"
            className="h-8 text-xs"
            value={createReferenceConfig.relationshipType}
            onChange={(e) => {
              const updated = { ...createReferenceConfig, relationshipType: e.target.value }
              onCreateReferenceConfigChange(updated)
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, relationshipType: e.target.value }
              })
            }}
          />
        </div>
      </div>
    </CollapsibleSection>
  )
}

