'use client'

import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select'
import { HelpTooltip } from '../../shared/HelpTooltip'
import { CollapsibleSection } from '../../shared/CollapsibleSection'
import type { ActionCanvasNode } from '../../../stores/actionCanvasStore'

interface ActionMergeNodesConfigurationProps {
  actionNodeId: string
  actionNode: ActionCanvasNode | null
  onUpdateActionNode: (id: string, updates: Partial<ActionCanvasNode>) => void
}

export function ActionMergeNodesConfiguration({
  actionNodeId,
  actionNode,
  onUpdateActionNode
}: ActionMergeNodesConfigurationProps) {
  if (!actionNode) return null

  return (
    <CollapsibleSection title="Merge Nodes Configuration" defaultOpen={true}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-medium">Target Node IDs (comma-separated)</Label>
          <Input
            placeholder="e.g., 1, 2, 3"
            className="h-8 text-xs"
            value={((actionNode.config.targetNodeIds as number[]) || []).join(', ')}
            onChange={(e) => {
              const ids = e.target.value.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, targetNodeIds: ids }
              })
            }}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label className="text-xs font-medium">Merge Strategy</Label>
            <HelpTooltip content="How to merge properties when conflicts occur" />
          </div>
          <Select
            value={(actionNode.config.mergeStrategy as string) || 'union'}
            onValueChange={(value) => {
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, mergeStrategy: value }
              })
            }}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="union">Union (merge all)</SelectItem>
              <SelectItem value="preferSource">Prefer Source</SelectItem>
              <SelectItem value="preferTarget">Prefer Target</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </CollapsibleSection>
  )
}

