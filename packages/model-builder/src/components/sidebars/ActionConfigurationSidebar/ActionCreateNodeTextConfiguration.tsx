'use client'

import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { CollapsibleSection } from '../../shared/CollapsibleSection'
import type { ActionCanvasNode } from '../../../stores/actionCanvasStore'
import type { ActionConfigurationState } from '../../../stores/actionConfigurationStore'

interface ActionCreateNodeTextConfigurationProps {
  actionNodeId: string
  actionNode: ActionCanvasNode | null
  createNodeTextConfig: ActionConfigurationState['createNodeTextConfig']
  onCreateNodeTextConfigChange: (config: ActionConfigurationState['createNodeTextConfig']) => void
  onUpdateActionNode: (id: string, updates: Partial<ActionCanvasNode>) => void
}

export function ActionCreateNodeTextConfiguration({
  actionNodeId,
  actionNode,
  createNodeTextConfig,
  onCreateNodeTextConfigChange,
  onUpdateActionNode
}: ActionCreateNodeTextConfigurationProps) {
  if (!actionNode) return null

  return (
    <CollapsibleSection title="Create Node Text Configuration" defaultOpen={true}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-medium">Parent Relationship Type</Label>
          <Input
            placeholder="e.g., contains"
            className="h-8 text-xs"
            value={createNodeTextConfig.parentRelationship}
            onChange={(e) => {
              const value = e.target.value
              const updated = { ...createNodeTextConfig, parentRelationship: value }
              onCreateNodeTextConfigChange(updated)
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

