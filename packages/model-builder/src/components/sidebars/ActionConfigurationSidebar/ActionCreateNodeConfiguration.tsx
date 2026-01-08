'use client'

import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { CollapsibleSection } from '../../shared/CollapsibleSection'
import type { ActionCanvasNode } from '../../../stores/actionCanvasStore'
import type { ActionConfigurationState } from '../../../stores/actionConfigurationStore'

interface ActionCreateNodeConfigurationProps {
  actionNodeId: string
  actionNode: ActionCanvasNode | null
  createNodeConfig: ActionConfigurationState['createNodeConfig']
  onCreateNodeConfigChange: (config: ActionConfigurationState['createNodeConfig']) => void
  onUpdateActionNode: (id: string, updates: Partial<ActionCanvasNode>) => void
}

export function ActionCreateNodeConfiguration({
  actionNodeId,
  actionNode,
  createNodeConfig,
  onCreateNodeConfigChange,
  onUpdateActionNode
}: ActionCreateNodeConfigurationProps) {
  if (!actionNode) return null

  return (
    <CollapsibleSection title="Create Node Configuration" defaultOpen={true}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-medium">Node Labels</Label>
          <Input
            placeholder="Enter labels (comma-separated)"
            className="h-8 text-xs"
            value={createNodeConfig.labels.join(', ')}
            onChange={(e) => {
              const labels = e.target.value.split(',').map(l => l.trim()).filter(Boolean)
              const updated = { ...createNodeConfig, labels }
              onCreateNodeConfigChange(updated)
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, labels }
              })
            }}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Parent Relationship Type</Label>
          <Input
            placeholder="e.g., contains"
            className="h-8 text-xs"
            value={createNodeConfig.parentRelationship}
            onChange={(e) => {
              const updated = { ...createNodeConfig, parentRelationship: e.target.value }
              onCreateNodeConfigChange(updated)
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, parentRelationship: e.target.value }
              })
            }}
          />
        </div>
      </div>
    </CollapsibleSection>
  )
}

