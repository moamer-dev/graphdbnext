'use client'

import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { CollapsibleSection } from '../../shared/CollapsibleSection'
import type { ActionCanvasNode } from '../../../stores/actionCanvasStore'

interface ActionValidateRelationshipConfigurationProps {
  actionNodeId: string
  actionNode: ActionCanvasNode | null
  onUpdateActionNode: (id: string, updates: Partial<ActionCanvasNode>) => void
}

export function ActionValidateRelationshipConfiguration({
  actionNodeId,
  actionNode,
  onUpdateActionNode
}: ActionValidateRelationshipConfigurationProps) {
  if (!actionNode) return null

  return (
    <CollapsibleSection title="Validate Relationship Configuration" defaultOpen={true}>
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
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Constraints (JSON, optional)</Label>
          <textarea
            className="w-full h-32 text-xs font-mono p-2 border rounded"
            placeholder='{"minProperties": 1, "maxProperties": 10}'
            value={JSON.stringify((actionNode.config.constraints as Record<string, unknown>) || {}, null, 2)}
            onChange={(e) => {
              try {
                const constraints = JSON.parse(e.target.value)
                onUpdateActionNode(actionNodeId, {
                  config: { ...actionNode.config, constraints }
                })
              } catch {
                // Invalid JSON, ignore
              }
            }}
          />
        </div>
      </div>
    </CollapsibleSection>
  )
}

