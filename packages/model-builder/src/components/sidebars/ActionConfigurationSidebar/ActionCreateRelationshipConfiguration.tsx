'use client'

import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { CollapsibleSection } from '../../shared/CollapsibleSection'
import type { ActionCanvasNode } from '../../../stores/actionCanvasStore'
import type { ActionConfigurationState } from '../../../stores/actionConfigurationStore'

interface ActionCreateRelationshipConfigurationProps {
  actionNodeId: string
  actionNode: ActionCanvasNode | null
  createRelationshipConfig: ActionConfigurationState['createRelationshipConfig']
  onCreateRelationshipConfigChange: (config: ActionConfigurationState['createRelationshipConfig']) => void
  onUpdateActionNode: (id: string, updates: Partial<ActionCanvasNode>) => void
}

export function ActionCreateRelationshipConfiguration({
  actionNodeId,
  actionNode,
  createRelationshipConfig,
  onCreateRelationshipConfigChange,
  onUpdateActionNode
}: ActionCreateRelationshipConfigurationProps) {
  if (!actionNode) return null

  return (
    <CollapsibleSection title="Create Relationship Configuration" defaultOpen={true}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-medium">Relationship Type</Label>
          <Input
            placeholder="e.g., contains, refersTo"
            className="h-8 text-xs"
            value={createRelationshipConfig.relationshipType}
            onChange={(e) => {
              const updated = { ...createRelationshipConfig, relationshipType: e.target.value }
              onCreateRelationshipConfigChange(updated)
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

