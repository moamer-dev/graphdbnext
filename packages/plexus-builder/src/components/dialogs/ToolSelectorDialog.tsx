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
import type { ToolNodeType } from '../../stores/toolCanvasStore'

interface ToolSelectorDialogProps {
  open: boolean
  onClose: () => void
  onSelect: (toolTypes: ToolNodeType[]) => void
  existingToolTypes?: ToolNodeType[] // Types already in the group
}

const allTools: Array<{ label: string; type: ToolNodeType }> = [
  { label: 'If / Else', type: 'tool:if' },
  { label: 'Switch', type: 'tool:switch' },
  { label: 'Loop', type: 'tool:loop' },
  { label: 'Merge', type: 'tool:merge' },
  { label: 'Filter', type: 'tool:filter' },
  { label: 'Delay', type: 'tool:delay' },
  { label: 'Transform', type: 'tool:transform' },
  { label: 'Lookup', type: 'tool:lookup' },
  { label: 'Traverse', type: 'tool:traverse' },
  { label: 'Aggregate', type: 'tool:aggregate' },
  { label: 'Sort', type: 'tool:sort' },
  { label: 'Limit', type: 'tool:limit' },
  { label: 'Collect', type: 'tool:collect' },
  { label: 'Split', type: 'tool:split' },
  { label: 'Validate', type: 'tool:validate' },
  { label: 'Map', type: 'tool:map' },
  { label: 'Reduce', type: 'tool:reduce' },
  { label: 'Partition', type: 'tool:partition' },
  { label: 'Distinct', type: 'tool:distinct' },
  { label: 'Window', type: 'tool:window' },
  { label: 'Join', type: 'tool:join' },
  { label: 'Union', type: 'tool:union' },
  { label: 'Intersect', type: 'tool:intersect' },
  { label: 'Diff', type: 'tool:diff' },
  { label: 'Exists', type: 'tool:exists' },
  { label: 'Range', type: 'tool:range' },
  { label: 'Batch', type: 'tool:batch' }
]

export function ToolSelectorDialog ({ open, onClose, onSelect, existingToolTypes = [] }: ToolSelectorDialogProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTools, setSelectedTools] = useState<Set<ToolNodeType>>(new Set())

  const filteredTools = allTools.filter(tool =>
    tool.label.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const toggleTool = (toolType: ToolNodeType) => {
    setSelectedTools(prev => {
      const next = new Set(prev)
      if (next.has(toolType)) {
        next.delete(toolType)
      } else {
        next.add(toolType)
      }
      return next
    })
  }

  const handleAdd = () => {
    onSelect(Array.from(selectedTools))
    setSelectedTools(new Set())
    setSearchQuery('')
    onClose()
  }

  const handleCancel = () => {
    setSelectedTools(new Set())
    setSearchQuery('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select Tools</DialogTitle>
          <DialogDescription>
            Select one or more tools to add to the group. Tools will be executed in the order they are added.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tools..."
              className="pl-8 h-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Tools Section */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Tools</Label>
            <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto p-2 border rounded">
              {filteredTools.length > 0 ? (
                filteredTools.map((tool) => {
                  const isSelected = selectedTools.has(tool.type)
                  const isExisting = existingToolTypes.includes(tool.type)
                  const isDisabled = isExisting
                  return (
                    <button
                      key={tool.type}
                      onClick={() => !isDisabled && toggleTool(tool.type)}
                      disabled={isDisabled}
                      className={`p-2 text-left text-xs rounded border transition-colors ${
                        isDisabled
                          ? 'bg-gray-100 border-gray-200 opacity-50 cursor-not-allowed'
                          : isSelected
                          ? 'bg-blue-100 border-blue-300'
                          : 'bg-background border-border hover:bg-muted'
                      }`}
                      title={isDisabled ? 'Already in group' : undefined}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                          isDisabled
                            ? 'bg-gray-300 border-gray-300'
                            : isSelected
                            ? 'bg-blue-600 border-blue-600'
                            : 'border-gray-300'
                        }`}>
                          {isSelected && !isDisabled && <Check className="h-3 w-3 text-white" />}
                          {isDisabled && <span className="text-[8px] text-gray-500">✓</span>}
                        </div>
                        <span className="flex-1">{tool.label}</span>
                        {isDisabled && <span className="text-[9px] text-gray-500">(in group)</span>}
                      </div>
                    </button>
                  )
                })
              ) : (
                <div className="col-span-2 text-center text-xs text-muted-foreground py-4">
                  No tools found
                </div>
              )}
            </div>
          </div>

          {/* Selected count */}
          {selectedTools.size > 0 && (
            <div className="text-xs text-muted-foreground">
              {selectedTools.size} tool{selectedTools.size !== 1 ? 's' : ''} selected
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={handleCancel} size="sm">
              Cancel
            </Button>
            <Button onClick={handleAdd} size="sm" disabled={selectedTools.size === 0}>
              Add {selectedTools.size > 0 ? `${selectedTools.size} ` : ''}Tool{selectedTools.size !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

