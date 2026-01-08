'use client'

import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { CollapsibleSection } from '../../shared/CollapsibleSection'
import type { ActionCanvasNode } from '../../../stores/actionCanvasStore'

interface ActionReverseRelationshipConfigurationProps {
  actionNodeId: string
  actionNode: ActionCanvasNode | null
  onUpdateActionNode: (id: string, updates: Partial<ActionCanvasNode>) => void
}

export function ActionReverseRelationshipConfiguration({
  actionNodeId,
  actionNode,
  onUpdateActionNode
}: ActionReverseRelationshipConfigurationProps) {
  if (!actionNode) return null

  return (
    <CollapsibleSection title="Reverse Relationship Configuration" defaultOpen={true}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-medium">Relationship ID</Label>
          <Input
            type="number"
            placeholder="Enter relationship ID"
            className="h-8 text-xs"
            value={(actionNode.config.relationshipId as number) || ''}
            onChange={(e) => {
              const value = e.target.value ? parseInt(e.target.value) : undefined
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, relationshipId: value }
              })
            }}
          />
          <div className="text-[10px] text-muted-foreground">
            Reverses the direction of the relationship (start ↔ end)
          </div>
        </div>
      </div>
    </CollapsibleSection>
  )
}

