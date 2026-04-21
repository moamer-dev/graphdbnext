'use client'

import React from 'react'
import { Search, X, CheckSquare, Square, Plus, Check, Loader2, FolderTree } from 'lucide-react'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Badge } from '../../ui/badge'
import { Checkbox } from '../../ui/checkbox'
import { cn } from '../../../utils/cn'

interface NodesTabProps {
  allElementTypes: any[]
  selectedNodes: Set<string>
  nodesSearchQuery: string
  setNodesSearchQuery: (query: string) => void
  toggleNodeSelection: (name: string) => void
  selectAllNodes: () => void
  deselectAllNodes: () => void
  handleBulkAddNodes: () => void
  handleAddSingleNode: (name: string) => void
  isElementIncluded: (name: string) => boolean
  addingItems: Set<string>
  factSheetElementName?: string | null
  onNodeClick: (name: string) => void
}

export function NodesTab({
  allElementTypes,
  selectedNodes,
  nodesSearchQuery,
  setNodesSearchQuery,
  toggleNodeSelection,
  selectAllNodes,
  deselectAllNodes,
  handleBulkAddNodes,
  handleAddSingleNode,
  isElementIncluded,
  addingItems,
  factSheetElementName,
  onNodeClick
}: NodesTabProps) {
  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Search and Selection Headers */}
      <div className="space-y-2 p-1">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search nodes..."
            value={nodesSearchQuery}
            onChange={(e) => setNodesSearchQuery(e.target.value)}
            className="pl-8 pr-8 h-8 text-xs"
          />
          {nodesSearchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              onClick={() => setNodesSearchQuery('')}
              title="Clear search"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={selectAllNodes}
            disabled={allElementTypes.length === 0}
          >
            <CheckSquare className="h-3 w-3 mr-1" />
            Select All
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={deselectAllNodes}
            disabled={selectedNodes.size === 0}
          >
            <Square className="h-3 w-3 mr-1" />
            Deselect All
          </Button>
          {selectedNodes.size > 0 && (
            <Button
              variant="default"
              size="sm"
              className="h-6 px-2 text-xs ml-auto"
              onClick={handleBulkAddNodes}
              disabled={addingItems.size > 0}
            >
              {addingItems.size > 0 ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Adding {addingItems.size}...
                </>
              ) : (
                <>
                  <Plus className="h-3 w-3 mr-1" />
                  Add {selectedNodes.size} to Mapping
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Nodes List */}
      <div className="flex-1 overflow-y-auto space-y-1 pr-1">
        {allElementTypes.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">
            {nodesSearchQuery ? 'No nodes found matching your search.' : 'No element types available.'}
          </p>
        ) : (
          allElementTypes.map((elementType) => {
            const isSelected = selectedNodes.has(elementType.name)
            const isIncluded = isElementIncluded(elementType.name)
            const isAdding = addingItems.has(elementType.name)
            const isBeingViewed = factSheetElementName === elementType.name

            return (
              <div
                key={elementType.name}
                className={cn(
                  'flex items-center gap-2 p-2 rounded border transition-all cursor-pointer',
                  isSelected && 'bg-primary/5 border-primary/20',
                  isBeingViewed && 'bg-primary/15 border-primary shadow-sm ring-1 ring-primary/20',
                  !isSelected && !isBeingViewed && 'hover:bg-muted/50',
                  isIncluded && 'opacity-60',
                  isAdding && 'opacity-80'
                )}
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest('button, [role="checkbox"]')) {
                    return
                  }
                  onNodeClick(elementType.name)
                }}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleNodeSelection(elementType.name)}
                  disabled={isIncluded || isAdding}
                  className="flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono font-medium">{elementType.name}</code>
                    {isIncluded && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        <Check className="h-2.5 w-2.5 mr-0.5" />
                        In Mapping
                      </Badge>
                    )}
                    {elementType.specialPatterns?.isIgnoredSubtree && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-500/50 text-amber-600 bg-amber-50">
                        <FolderTree className="h-2.5 w-2.5 mr-0.5" />
                        Subtree Ignored
                      </Badge>
                    )}
                    {isAdding && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        <Loader2 className="h-2.5 w-2.5 mr-0.5 animate-spin" />
                        Adding...
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span>{elementType.count} instances</span>
                    {elementType.attributes.length > 0 && (
                      <span>{elementType.attributes.length} attributes</span>
                    )}
                    {elementType.children.length > 0 && (
                      <span>{elementType.children.length} child types</span>
                    )}
                  </div>
                </div>
                {!isIncluded && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleAddSingleNode(elementType.name)
                    }}
                    title="Add to mapping"
                    disabled={isAdding}
                  >
                    {isAdding ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Plus className="h-3 w-3" />
                    )}
                  </Button>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
