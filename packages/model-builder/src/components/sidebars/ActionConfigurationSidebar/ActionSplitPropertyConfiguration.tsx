'use client'

import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { CollapsibleSection } from '../../shared/CollapsibleSection'
import type { ActionCanvasNode } from '../../../stores/actionCanvasStore'

interface ActionSplitPropertyConfigurationProps {
  actionNodeId: string
  actionNode: ActionCanvasNode | null
  onUpdateActionNode: (id: string, updates: Partial<ActionCanvasNode>) => void
}

export function ActionSplitPropertyConfiguration({
  actionNodeId,
  actionNode,
  onUpdateActionNode
}: ActionSplitPropertyConfigurationProps) {
  if (!actionNode) return null

  return (
    <CollapsibleSection title="Split Property Configuration" defaultOpen={true}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-medium">Source Property</Label>
          <Input
            placeholder="e.g., fullName"
            className="h-8 text-xs"
            value={(actionNode.config.sourceProperty as string) || ''}
            onChange={(e) => {
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, sourceProperty: e.target.value }
              })
            }}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Separator</Label>
          <Input
            placeholder="e.g., ' ' (space), ',' (comma)"
            className="h-8 text-xs"
            value={(actionNode.config.separator as string) || ' '}
            onChange={(e) => {
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, separator: e.target.value }
              })
            }}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Target Properties</Label>
          <Input
            placeholder="comma-separated property names"
            className="h-8 text-xs"
            value={((actionNode.config.targetProperties as string[]) || []).join(', ')}
            onChange={(e) => {
              const props = e.target.value.split(',').map(p => p.trim()).filter(Boolean)
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, targetProperties: props }
              })
            }}
          />
        </div>
      </div>
    </CollapsibleSection>
  )
}

