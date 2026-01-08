'use client'

import { Label } from '../../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select'
import { HelpTooltip } from '../../shared/HelpTooltip'
import { CollapsibleSection } from '../../shared/CollapsibleSection'
import type { ActionCanvasNode } from '../../../stores/actionCanvasStore'

interface ActionSetTimestampConfigurationProps {
  actionNodeId: string
  actionNode: ActionCanvasNode | null
  onUpdateActionNode: (id: string, updates: Partial<ActionCanvasNode>) => void
}

export function ActionSetTimestampConfiguration({
  actionNodeId,
  actionNode,
  onUpdateActionNode
}: ActionSetTimestampConfigurationProps) {
  if (!actionNode) return null

  return (
    <CollapsibleSection title="Set Timestamp Configuration" defaultOpen={true}>
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label className="text-xs font-medium">Timestamp Type</Label>
            <HelpTooltip content="Which timestamps to set" />
          </div>
          <Select
            value={(actionNode.config.timestampType as string) || 'both'}
            onValueChange={(value) => {
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, timestampType: value }
              })
            }}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created">Created Only</SelectItem>
              <SelectItem value="modified">Modified Only</SelectItem>
              <SelectItem value="both">Both</SelectItem>
            </SelectContent>
          </Select>
          <div className="text-[10px] text-muted-foreground">
            Timestamps will be stored as ISO 8601 strings in _createdAt and _modifiedAt properties
          </div>
        </div>
      </div>
    </CollapsibleSection>
  )
}

