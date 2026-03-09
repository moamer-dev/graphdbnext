'use client'

import { useState } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '../ui/dialog'
import { Search, Check } from 'lucide-react'
import type { ActionNodeType } from '../../stores/actionCanvasStore'

interface ActionSelectorDialogProps {
  open: boolean
  onClose: () => void
  onSelect: (actionTypes: ActionNodeType[]) => void
  existingActionTypes?: ActionNodeType[] // Types already in the group
}

const quickActions: Array<{ label: string; type: ActionNodeType }> = [
  { label: 'Create Text Node', type: 'action:create-text-node' },
  { label: 'Create Token Nodes', type: 'action:create-token-nodes' },
  { label: 'Create Node (Complete)', type: 'action:create-node-complete' },
  { label: 'Bulk Attribute Mapper', type: 'action:extract-and-normalize-attributes' },
  { label: 'Create Annotation Nodes', type: 'action:create-annotation-nodes' },
  { label: 'Create Reference Chain', type: 'action:create-reference-chain' },
  { label: 'Create Node with Lookup', type: 'action:create-node-with-lookup' },
]

const basicActions: Array<{ label: string; type: ActionNodeType }> = [
  { label: 'Set Property', type: 'action:set-property' },
  { label: 'Create Relationship', type: 'action:create-relationship' },
  { label: 'Skip Element', type: 'action:skip' },



]

const advancedActions: Array<{ label: string; type: ActionNodeType }> = [
  { label: 'Update Node', type: 'action:update-node' },
  { label: 'Delete Node', type: 'action:delete-node' },
  { label: 'Clone Node', type: 'action:clone-node' },
  { label: 'Merge Nodes', type: 'action:merge-nodes' },
  { label: 'Update Relationship', type: 'action:update-relationship' },
  { label: 'Delete Relationship', type: 'action:delete-relationship' },
  { label: 'Reverse Relationship', type: 'action:reverse-relationship' },
  { label: 'Validate Node', type: 'action:validate-node' },
  { label: 'Validate Relationship', type: 'action:validate-relationship' },
  { label: 'Report Error', type: 'action:report-error' },
]

const dataActions: Array<{ label: string; type: ActionNodeType }> = [
  { label: 'Extract & Compute Property', type: 'action:extract-and-compute-property' },
  { label: 'Copy Property', type: 'action:copy-property' },
  { label: 'Merge Properties', type: 'action:merge-properties' },
  { label: 'Split Property', type: 'action:split-property' },
  { label: 'Format Property', type: 'action:format-property' },
  { label: 'Merge Children Text', type: 'action:merge-children-text' },
  { label: 'Add Metadata', type: 'action:add-metadata' },
  { label: 'Tag Node', type: 'action:tag-node' },
  { label: 'Set Timestamp', type: 'action:set-timestamp' },
  { label: 'Defer Relationship', type: 'action:defer-relationship' },
]

export function ActionSelectorDialog ({ open, onClose, onSelect, existingActionTypes = [] }: ActionSelectorDialogProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedActions, setSelectedActions] = useState<Set<ActionNodeType>>(new Set())

  const filteredQuickActions = quickActions.filter(action =>
    action.label.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredBasicActions = basicActions.filter(action =>
    action.label.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredAdvancedActions = advancedActions.filter(action =>
    action.label.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredDataActions = dataActions.filter(action =>
    action.label.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const toggleAction = (actionType: ActionNodeType) => {
    setSelectedActions(prev => {
      const next = new Set(prev)
      if (next.has(actionType)) {
        next.delete(actionType)
      } else {
        next.add(actionType)
      }
      return next
    })
  }

  const handleAdd = () => {
    onSelect(Array.from(selectedActions))
    setSelectedActions(new Set())
    setSearchQuery('')
    onClose()
  }

  const handleCancel = () => {
    setSelectedActions(new Set())
    setSearchQuery('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select Actions</DialogTitle>
          <DialogDescription>
            Select one or more actions to add to the group. Actions will be executed in the order they are added.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search actions..."
              className="pl-8 h-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Quick Actions Section */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Quick Actions ⚡</Label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border rounded">
              {filteredQuickActions.length > 0 ? (
                filteredQuickActions.map((action) => {
                  const isSelected = selectedActions.has(action.type)
                  const isExisting = existingActionTypes.includes(action.type)
                  const isDisabled = isExisting
                  return (
                    <button
                      key={action.type}
                      onClick={() => !isDisabled && toggleAction(action.type)}
                      disabled={isDisabled}
                      className={`p-2 text-left text-xs rounded border transition-colors ${
                        isDisabled
                          ? 'bg-gray-100 border-gray-200 opacity-50 cursor-not-allowed'
                          : isSelected
                          ? 'bg-purple-100 border-purple-300'
                          : 'bg-background border-border hover:bg-muted'
                      }`}
                      title={isDisabled ? 'Already in group' : undefined}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                          isDisabled
                            ? 'bg-gray-300 border-gray-300'
                            : isSelected
                            ? 'bg-purple-600 border-purple-600'
                            : 'border-gray-300'
                        }`}>
                          {isSelected && !isDisabled && <Check className="h-3 w-3 text-white" />}
                          {isDisabled && <span className="text-[8px] text-gray-500">✓</span>}
                        </div>
                        <span className="flex-1">{action.label}</span>
                        {isDisabled && <span className="text-[9px] text-gray-500">(in group)</span>}
                      </div>
                    </button>
                  )
                })
              ) : (
                <div className="col-span-2 text-center text-xs text-muted-foreground py-4">
                  No quick actions found
                </div>
              )}
            </div>
          </div>

          {/* Advanced Actions Section */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Node & Relationship Manipulation</Label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border rounded">
              {filteredAdvancedActions.length > 0 ? (
                filteredAdvancedActions.map((action) => {
                  const isSelected = selectedActions.has(action.type)
                  const isExisting = existingActionTypes.includes(action.type)
                  const isDisabled = isExisting
                  return (
                    <button
                      key={action.type}
                      onClick={() => !isDisabled && toggleAction(action.type)}
                      disabled={isDisabled}
                      className={`p-2 text-left text-xs rounded border transition-colors ${
                        isDisabled
                          ? 'bg-gray-100 border-gray-200 opacity-50 cursor-not-allowed'
                          : isSelected
                          ? 'bg-purple-100 border-purple-300'
                          : 'bg-background border-border hover:bg-muted'
                      }`}
                      title={isDisabled ? 'Already in group' : undefined}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                          isDisabled
                            ? 'bg-gray-300 border-gray-300'
                            : isSelected
                            ? 'bg-purple-600 border-purple-600'
                            : 'border-gray-300'
                        }`}>
                          {isSelected && !isDisabled && <Check className="h-3 w-3 text-white" />}
                          {isDisabled && <span className="text-[8px] text-gray-500">✓</span>}
                        </div>
                        <span className="flex-1">{action.label}</span>
                        {isDisabled && <span className="text-[9px] text-gray-500">(in group)</span>}
                      </div>
                    </button>
                  )
                })
              ) : (
                <div className="col-span-2 text-center text-xs text-muted-foreground py-4">
                  No advanced actions found
                </div>
              )}
            </div>
          </div>

          {/* Data Actions Section */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Data, Metadata & Mapping</Label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border rounded">
              {filteredDataActions.length > 0 ? (
                filteredDataActions.map((action) => {
                  const isSelected = selectedActions.has(action.type)
                  const isExisting = existingActionTypes.includes(action.type)
                  const isDisabled = isExisting
                  return (
                    <button
                      key={action.type}
                      onClick={() => !isDisabled && toggleAction(action.type)}
                      disabled={isDisabled}
                      className={`p-2 text-left text-xs rounded border transition-colors ${
                        isDisabled
                          ? 'bg-gray-100 border-gray-200 opacity-50 cursor-not-allowed'
                          : isSelected
                          ? 'bg-purple-100 border-purple-300'
                          : 'bg-background border-border hover:bg-muted'
                      }`}
                      title={isDisabled ? 'Already in group' : undefined}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                          isDisabled
                            ? 'bg-gray-300 border-gray-300'
                            : isSelected
                            ? 'bg-purple-600 border-purple-600'
                            : 'border-gray-300'
                        }`}>
                          {isSelected && !isDisabled && <Check className="h-3 w-3 text-white" />}
                          {isDisabled && <span className="text-[8px] text-gray-500">✓</span>}
                        </div>
                        <span className="flex-1">{action.label}</span>
                        {isDisabled && <span className="text-[9px] text-gray-500">(in group)</span>}
                      </div>
                    </button>
                  )
                })
              ) : (
                <div className="col-span-2 text-center text-xs text-muted-foreground py-4">
                  No data actions found
                </div>
              )}
            </div>
          </div>

          {/* Selected count */}
          {selectedActions.size > 0 && (
            <div className="text-xs text-muted-foreground">
              {selectedActions.size} action{selectedActions.size !== 1 ? 's' : ''} selected
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={handleCancel} size="sm">
              Cancel
            </Button>
            <Button onClick={handleAdd} size="sm" disabled={selectedActions.size === 0}>
              Add {selectedActions.size > 0 ? `${selectedActions.size} ` : ''}Action{selectedActions.size !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

