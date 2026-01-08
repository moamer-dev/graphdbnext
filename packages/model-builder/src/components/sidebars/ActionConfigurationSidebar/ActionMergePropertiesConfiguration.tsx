'use client'

import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select'
import { HelpTooltip } from '../../shared/HelpTooltip'
import { CollapsibleSection } from '../../shared/CollapsibleSection'
import type { ActionCanvasNode } from '../../../stores/actionCanvasStore'

interface ActionMergePropertiesConfigurationProps {
  actionNodeId: string
  actionNode: ActionCanvasNode | null
  onUpdateActionNode: (id: string, updates: Partial<ActionCanvasNode>) => void
}

export function ActionMergePropertiesConfiguration({
  actionNodeId,
  actionNode,
  onUpdateActionNode
}: ActionMergePropertiesConfigurationProps) {
  if (!actionNode) return null

  return (
    <CollapsibleSection title="Merge Properties Configuration" defaultOpen={true}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-medium">Source Properties</Label>
          <Input
            placeholder="comma-separated property names"
            className="h-8 text-xs"
            value={((actionNode.config.sourceProperties as string[]) || []).join(', ')}
            onChange={(e) => {
              const props = e.target.value.split(',').map(p => p.trim()).filter(Boolean)
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, sourceProperties: props }
              })
            }}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Target Property</Label>
          <Input
            placeholder="merged"
            className="h-8 text-xs"
            value={(actionNode.config.targetProperty as string) || 'merged'}
            onChange={(e) => {
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, targetProperty: e.target.value }
              })
            }}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label className="text-xs font-medium">Merge Strategy</Label>
            <HelpTooltip content="How to merge the properties" />
          </div>
          <Select
            value={(actionNode.config.mergeStrategy as string) || 'object'}
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
              <SelectItem value="concat">Concatenate (space-separated)</SelectItem>
              <SelectItem value="object">Object (key-value pairs)</SelectItem>
              <SelectItem value="array">Array</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </CollapsibleSection>
  )
}

