'use client'

import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../../ui/select'
import { CollapsibleSection } from '../../shared/CollapsibleSection'
import type { ActionCanvasNode } from '../../../stores/actionCanvasStore'
import type { ActionConfigurationState } from '../../../stores/actionConfigurationStore'

interface ActionDeferRelationshipConfigurationProps {
  actionNodeId: string
  actionNode: ActionCanvasNode | null
  deferRelationshipConfig: ActionConfigurationState['deferRelationshipConfig']
  onDeferRelationshipConfigChange: (config: ActionConfigurationState['deferRelationshipConfig']) => void
  onUpdateActionNode: (id: string, updates: Partial<ActionCanvasNode>) => void
}

export function ActionDeferRelationshipConfiguration({
  actionNodeId,
  actionNode,
  deferRelationshipConfig,
  onDeferRelationshipConfigChange,
  onUpdateActionNode
}: ActionDeferRelationshipConfigurationProps) {
  if (!actionNode) return null

  return (
    <CollapsibleSection title="Defer Relationship Configuration" defaultOpen={true}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-medium">Relationship Type</Label>
          <Input
            placeholder="e.g., contains, refersTo"
            className="h-8 text-xs"
            value={deferRelationshipConfig.relationshipType}
            onChange={(e) => {
              const value = e.target.value
              const updated = { ...deferRelationshipConfig, relationshipType: value }
              onDeferRelationshipConfigChange(updated)
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, relationshipType: value }
              })
            }}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Target Node Label</Label>
          <Input
            placeholder="e.g., Document, Section"
            className="h-8 text-xs"
            value={deferRelationshipConfig.targetNodeLabel}
            onChange={(e) => {
              const value = e.target.value
              const updated = { ...deferRelationshipConfig, targetNodeLabel: value }
              onDeferRelationshipConfigChange(updated)
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, targetNodeLabel: value }
              })
            }}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Condition</Label>
          <Select
            value={deferRelationshipConfig.condition}
            onValueChange={(value: 'always' | 'hasAttribute' | 'hasText') => {
              const updated = { ...deferRelationshipConfig, condition: value }
              onDeferRelationshipConfigChange(updated)
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, condition: value }
              })
            }}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="always">Always</SelectItem>
              <SelectItem value="hasAttribute">Has Attribute</SelectItem>
              <SelectItem value="hasText">Has Text</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </CollapsibleSection>
  )
}

