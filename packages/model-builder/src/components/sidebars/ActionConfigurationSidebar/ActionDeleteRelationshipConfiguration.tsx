'use client'

import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { CollapsibleSection } from '../../shared/CollapsibleSection'
import type { ActionCanvasNode } from '../../../stores/actionCanvasStore'

interface ActionDeleteRelationshipConfigurationProps {
  actionNodeId: string
  actionNode: ActionCanvasNode | null
  onUpdateActionNode: (id: string, updates: Partial<ActionCanvasNode>) => void
}

export function ActionDeleteRelationshipConfiguration({
  actionNodeId,
  actionNode,
  onUpdateActionNode
}: ActionDeleteRelationshipConfigurationProps) {
  if (!actionNode) return null

  return (
    <CollapsibleSection title="Delete Relationship Configuration" defaultOpen={true}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-medium">Relationship Type</Label>
          <Input
            placeholder="e.g., relatedTo"
            className="h-8 text-xs"
            value={((actionNode.config.condition as Record<string, unknown>)?.type as string) || ''}
            onChange={(e) => {
              onUpdateActionNode(actionNodeId, {
                config: {
                  ...actionNode.config,
                  condition: {
                    ...((actionNode.config.condition as Record<string, unknown>) || {}),
                    type: e.target.value
                  }
                }
              })
            }}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Property Match (JSON, optional)</Label>
          <textarea
            className="w-full h-24 text-xs font-mono p-2 border rounded"
            placeholder='{"key": "value"}'
            value={JSON.stringify(((actionNode.config.condition as Record<string, unknown>)?.propertyMatch as Record<string, unknown>) || {}, null, 2)}
            onChange={(e) => {
              try {
                const propertyMatch = JSON.parse(e.target.value)
                onUpdateActionNode(actionNodeId, {
                  config: {
                    ...actionNode.config,
                    condition: {
                      ...((actionNode.config.condition as Record<string, unknown>) || {}),
                      propertyMatch
                    }
                  }
                })
              } catch {
                // Invalid JSON, ignore
              }
            }}
          />
          <div className="text-[10px] text-muted-foreground">
            Only delete relationships matching these properties
          </div>
        </div>
      </div>
    </CollapsibleSection>
  )
}

