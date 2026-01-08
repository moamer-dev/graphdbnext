'use client'

import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import type { ActionCanvasNode } from '../../../stores/actionCanvasStore'

interface ActionGroupConfigurationProps {
  actionNodeId: string
  actionNode: ActionCanvasNode | null
  groupLabel: string
  groupEnabled: boolean
  onGroupLabelChange: (label: string) => void
  onGroupEnabledChange: (enabled: boolean) => void
  onUpdateActionNode: (id: string, updates: Partial<ActionCanvasNode>) => void
}

export function ActionGroupConfiguration({
  actionNodeId,
  actionNode,
  groupLabel,
  groupEnabled,
  onGroupLabelChange,
  onGroupEnabledChange,
  onUpdateActionNode
}: ActionGroupConfigurationProps) {
  if (!actionNode) return null

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs font-medium">Group Label</Label>
        <Input
          placeholder="e.g., Text Processing Group"
          className="h-8 text-xs"
          value={groupLabel}
          onChange={(e) => {
            const value = e.target.value
            onGroupLabelChange(value)
            onUpdateActionNode(actionNodeId, {
              label: value
            })
          }}
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={groupEnabled}
          onChange={(e) => {
            const enabled = e.target.checked
            onGroupEnabledChange(enabled)
            onUpdateActionNode(actionNodeId, {
              enabled
            })
          }}
          className="h-4 w-4"
          id="group-enabled"
        />
        <Label htmlFor="group-enabled" className="text-xs font-medium cursor-pointer">
          Enabled
        </Label>
      </div>
      <div className="text-[10px] text-muted-foreground">
        When disabled, this action group will be skipped during execution.
      </div>
    </div>
  )
}

