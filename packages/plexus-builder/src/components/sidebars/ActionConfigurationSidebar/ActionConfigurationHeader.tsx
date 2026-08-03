'use client'

import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../../ui/select'
import { X } from 'lucide-react'
import type { ActionCanvasNode } from '../../../stores/actionCanvasStore'

interface ActionConfigurationHeaderProps {
  actionNode: ActionCanvasNode | null
  actionLabel: string
  selectedGroupId: string
  actionGroups: ActionCanvasNode[]
  toolNodes: Array<{ id: string }>
  actionEdges: Array<{ source: string; target: string }>
  actionNodeId: string | null
  onActionLabelChange: (label: string) => void
  onUpdateActionNode: (id: string, updates: Partial<ActionCanvasNode>) => void
  onMoveToGroup: (groupId: string) => void
  onClose: () => void
}

export function ActionConfigurationHeader({
  actionNode,
  actionLabel,
  selectedGroupId,
  actionGroups,
  toolNodes,
  actionEdges,
  actionNodeId,
  onActionLabelChange,
  onUpdateActionNode,
  onMoveToGroup,
  onClose
}: ActionConfigurationHeaderProps) {
  const hasToolConnections = toolNodes.some(tool => 
    actionEdges.some(edge => edge.source === tool.id && edge.target === actionNodeId)
  )

  return (
    <div className="p-4 border-b bg-background/40 shrink-0">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold tracking-tight">Action Configuration</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-7 w-7 p-0 hover:bg-primary/10 hover:text-primary transition-colors"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="mt-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="action-label" className="text-[10px] uppercase font-bold text-primary/50 tracking-wider mb-1.5 block">
              Action Name
            </Label>
            <Input
              id="action-label"
              value={actionLabel}
              onChange={(e) => {
                const newLabel = e.target.value
                onActionLabelChange(newLabel)
                if (actionNode) {
                  onUpdateActionNode(actionNode.id, { label: newLabel })
                }
              }}
              className="h-8 text-xs bg-primary/5 border-primary/20 focus:bg-background transition-all"
              placeholder="Enter action name"
            />
          </div>

          {/* Action Group Selection */}
          {actionNode && actionNode.type !== 'action:group' && !actionNode.isGroup && (
            <div>
              <Label htmlFor="action-group" className="text-[10px] uppercase font-bold text-primary/50 tracking-wider mb-1.5 block">
                Action Group
              </Label>
              <Select
                value={selectedGroupId}
                onValueChange={onMoveToGroup}
              >
                <SelectTrigger id="action-group" className="h-8 text-xs bg-primary/5 border-primary/20 hover:bg-primary/10 transition-colors">
                  <SelectValue placeholder="No group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="text-xs">No group</SelectItem>
                  {actionGroups.map((group) => (
                    <SelectItem key={group.id} value={group.id} className="text-xs">
                      {group.label || 'Action Group'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-[10px]">
          <div className="text-primary/40 font-medium">
            RESOURCE: <span className="font-bold text-primary/80 ml-1">{actionNode?.type?.replace('action:', '').toUpperCase()}</span>
          </div>
          {hasToolConnections && (
            <div className="text-amber-500 font-bold tracking-tight bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 flex items-center gap-1">
               <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
               Groups disconnect tools
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

