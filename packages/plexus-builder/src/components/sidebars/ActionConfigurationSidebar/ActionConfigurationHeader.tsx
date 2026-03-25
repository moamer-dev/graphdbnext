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
    <div className="p-4 border-b">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Action Configuration</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-7 w-7 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="mt-3 space-y-2">
        <div>
          <Label htmlFor="action-label" className="text-xs font-medium">Action Name</Label>
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
            className="mt-1 h-8 text-xs"
            placeholder="Enter action name"
          />
        </div>
        <div className="text-xs text-muted-foreground">
          Type: <span className="font-medium">{actionNode?.type}</span>
        </div>
        
        {/* Action Group Selection - Only show if action is not a group itself */}
        {actionNode && actionNode.type !== 'action:group' && !actionNode.isGroup && (
          <div className="mt-3">
            <Label htmlFor="action-group" className="text-xs font-medium">Action Group</Label>
            <Select
              value={selectedGroupId}
              onValueChange={onMoveToGroup}
            >
              <SelectTrigger id="action-group" className="mt-1 h-8 text-xs">
                <SelectValue placeholder="No group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No group</SelectItem>
                {actionGroups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.label || 'Action Group'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasToolConnections && (
              <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">
                Note: Tool connections will be removed when moving to a group.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

