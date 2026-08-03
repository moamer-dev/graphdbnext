'use client'

import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { cn } from '../../../utils/cn'
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
    <div className="space-y-4 pt-2">
      <div className="space-y-1.5">
        <Label className="text-[10px] uppercase font-bold text-primary/50 tracking-wider block">Group Label</Label>
        <Input
          placeholder="e.g., Text Processing Group"
          className="h-8 text-xs bg-primary/5 border-primary/20 focus:bg-background transition-all"
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

      <div className="space-y-1.5">
        <Label className="text-[10px] uppercase font-bold text-primary/50 tracking-wider block">Status</Label>
        <div 
          onClick={() => {
            const enabled = !groupEnabled
            onGroupEnabledChange(enabled)
            onUpdateActionNode(actionNodeId, { enabled })
          }}
          className={cn(
            "group flex items-center justify-between p-2.5 rounded-md border transition-all cursor-pointer",
            groupEnabled 
              ? "bg-primary/10 border-primary/30" 
              : "bg-primary/5 border-primary/10 opacity-60 hover:opacity-100"
          )}
        >
          <div className="flex flex-col">
            <span className="text-[11px] font-bold tracking-tight">Group Enabled</span>
            <span className="text-[10px] text-primary/40 truncate max-w-[150px]">
              {groupEnabled ? 'Actively processing during execution' : 'Currently skipped'}
            </span>
          </div>
          <div className={cn(
            "w-8 h-4 rounded-full p-0.5 transition-colors duration-200 ease-in-out",
            groupEnabled ? "bg-primary" : "bg-primary/20"
          )}>
            <div className={cn(
              "w-3 h-3 rounded-full bg-white transition-transform duration-200 ease-in-out",
              groupEnabled ? "translate-x-4" : "translate-x-0"
            )} />
          </div>
        </div>
      </div>
    </div>
  )
}

