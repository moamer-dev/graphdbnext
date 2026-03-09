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
          <Label className="text-xs font-medium">Search Scope</Label>
          <Select
            value={deferRelationshipConfig.searchScope}
            onValueChange={(value: 'children' | 'descendants' | 'global') => {
              const updated = { ...deferRelationshipConfig, searchScope: value }
              onDeferRelationshipConfigChange(updated)
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, searchScope: value }
              })
            }}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="children">Immediate Children</SelectItem>
              <SelectItem value="descendants">All Descendants</SelectItem>
              <SelectItem value="global">Global (Entire Document)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium">Target Tag Name</Label>
          <Input
            placeholder="e.g., w, pc, seg"
            className="h-8 text-xs"
            value={deferRelationshipConfig.targetTag}
            onChange={(e) => {
              const value = e.target.value
              const updated = { ...deferRelationshipConfig, targetTag: value }
              onDeferRelationshipConfigChange(updated)
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, targetTag: value }
              })
            }}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium">Target Attribute Name (Optional)</Label>
          <Input
            placeholder="e.g., type, function"
            className="h-8 text-xs"
            value={deferRelationshipConfig.targetAttributeName}
            onChange={(e) => {
              const value = e.target.value
              const updated = { ...deferRelationshipConfig, targetAttributeName: value }
              onDeferRelationshipConfigChange(updated)
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, targetAttributeName: value }
              })
            }}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium">Target Attribute Value (Optional)</Label>
          <Input
            placeholder="e.g., hello, main"
            className="h-8 text-xs"
            value={deferRelationshipConfig.targetAttributeValue}
            onChange={(e) => {
              const value = e.target.value
              const updated = { ...deferRelationshipConfig, targetAttributeValue: value }
              onDeferRelationshipConfigChange(updated)
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, targetAttributeValue: value }
              })
            }}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium">Execution Condition</Label>
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

