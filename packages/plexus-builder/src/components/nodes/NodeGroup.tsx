'use client'

import { useState, useMemo, useEffect } from 'react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '../ui/collapsible'
import { ChevronDown, ChevronRight, X, Plus } from 'lucide-react'
import { SortableNodeItem } from '../palette/SortableNodeItem'
import {
  SortableContext,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import type { Node, NodeGroup } from '../../types'

interface NodeGroupComponentProps {
  group: NodeGroup
  nodes: Node[]
  selectedNode: string | null
  searchQuery: string
  rootNodeId: string | null
  onSelectNode: (id: string) => void
  onDeleteNode: (id: string) => void
  onToggleGroup: (id: string) => void
  onDeleteGroup: (id: string) => void
  onReorderNodes: (activeId: string, overId: string) => void
  onAddNodeToGroup?: (groupId: string) => void
}

export function NodeGroupComponent ({
  group,
  nodes,
  selectedNode,
  searchQuery,
  rootNodeId,
  onSelectNode,
  onDeleteNode,
  onToggleGroup,
  onDeleteGroup,
  onReorderNodes,
  onAddNodeToGroup
}: NodeGroupComponentProps) {
  // onReorderNodes is required by parent but not used in this component
  void onReorderNodes
  
  const [isOpen, setIsOpen] = useState(!group.collapsed)
  
  // Auto-expand if search matches nodes inside
  const hasMatchingNodes = useMemo(() => {
    if (!searchQuery.trim()) return false
    const query = searchQuery.toLowerCase()
    return nodes.some((node) =>
      node.label.toLowerCase().includes(query) ||
      node.type.toLowerCase().includes(query)
    )
  }, [nodes, searchQuery])
  
  // Auto-expand if selected node is inside this group
  const hasSelectedNode = useMemo(() => {
    return selectedNode !== null && nodes.some((node) => node.id === selectedNode)
  }, [nodes, selectedNode])
  
  // Update isOpen when group.collapsed changes, search matches, or selected node is inside
  useEffect(() => {
    if ((hasMatchingNodes || hasSelectedNode) && !isOpen) {
      // Use requestAnimationFrame to avoid synchronous setState in effect
      requestAnimationFrame(() => {
        setIsOpen(true)
        onToggleGroup(group.id)
      })
    }
  }, [hasMatchingNodes, hasSelectedNode, isOpen, onToggleGroup, group.id])
  
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    onToggleGroup(group.id)
  }

  return (
    <div className="mb-2 border border-border/40 rounded-md bg-muted/20 p-1.5 group">
      <Collapsible open={isOpen} onOpenChange={handleOpenChange}>
        <div className="flex items-center gap-1">
          <CollapsibleTrigger className="flex-1">
            <div className="flex items-center justify-between px-2 py-1.5 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {isOpen ? (
                  <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                )}
                <span className="text-xs font-medium truncate text-foreground">
                  {group.name}
                </span>
                {nodes.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    ({nodes.length})
                  </span>
                )}
              </div>
            </div>
          </CollapsibleTrigger>
          <div className="flex items-center gap-1">
            {onAddNodeToGroup && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  onAddNodeToGroup(group.id)
                }}
                onMouseDown={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-primary/10 rounded text-primary"
                title="Add node to group"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              data-delete-group
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                onDeleteGroup(group.id)
              }}
              onMouseDown={(e) => {
                e.stopPropagation()
                e.preventDefault()
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded text-destructive"
              title="Delete group"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        <CollapsibleContent>
          <div className="mt-1 space-y-1">
            <SortableContext
              items={nodes.map((n) => n.id)}
              strategy={verticalListSortingStrategy}
            >
              {nodes.map((node) => (
                <SortableNodeItem
                  key={node.id}
                  node={node}
                  selected={selectedNode === node.id}
                  isRoot={rootNodeId === node.id}
                  onSelect={() => onSelectNode(node.id)}
                  onDelete={() => onDeleteNode(node.id)}
                />
              ))}
            </SortableContext>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
