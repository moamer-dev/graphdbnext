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
import { workflowRegistry } from '../../registry'
import type { ActionNodeType } from '../../stores/actionCanvasStore'

interface ActionSelectorDialogProps {
  open: boolean
  onClose: () => void
  onSelect: (actionTypes: ActionNodeType[]) => void
  existingActionTypes?: ActionNodeType[] // Types already in the group
}

const getActionsByCategory = (category: string, query: string) => {
  return workflowRegistry.getActionsByCategory(category).filter(action =>
    action.metadata.label.toLowerCase().includes(query.toLowerCase())
  )
}

export function ActionSelectorDialog ({ open, onClose, onSelect, existingActionTypes = [] }: ActionSelectorDialogProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedActions, setSelectedActions] = useState<Set<ActionNodeType>>(new Set())

  const categories = workflowRegistry.getActionCategories()

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

          {categories.map(category => {
            const filteredActions = getActionsByCategory(category, searchQuery)
            if (filteredActions.length === 0) return null

            return (
              <div key={category} className="space-y-2">
                <Label className="text-sm font-semibold">{category}</Label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border rounded">
                  {filteredActions.map((action) => {
                    const isSelected = selectedActions.has(action.id as ActionNodeType)
                    const isExisting = existingActionTypes.includes(action.id as ActionNodeType)
                    const isDisabled = isExisting
                    return (
                      <button
                        key={action.id}
                        onClick={() => !isDisabled && toggleAction(action.id as ActionNodeType)}
                        disabled={isDisabled}
                        className={`p-2 text-left text-xs rounded border transition-colors ${
                          isDisabled
                            ? 'bg-gray-100 border-gray-200 opacity-50 cursor-not-allowed'
                            : isSelected
                            ? 'bg-purple-100 border-purple-300'
                            : 'bg-background border-border hover:bg-muted'
                        }`}
                        title={isDisabled ? 'Already in group' : action.metadata.description}
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
                          <span className="flex-1">{action.metadata.label}</span>
                          {isDisabled && <span className="text-[9px] text-gray-500">(in group)</span>}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}

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

