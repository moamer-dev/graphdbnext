'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { NodeGroup, Node } from '../../types'
import { NodeGroupComponent } from '../nodes/NodeGroup'

interface SortableGroupProps {
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
}

export function SortableGroup ({
  group,
  nodes,
  selectedNode,
  searchQuery,
  rootNodeId,
  onSelectNode,
  onDeleteNode,
  onToggleGroup,
  onDeleteGroup,
  onReorderNodes
}: SortableGroupProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: group.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? undefined : transition,
    opacity: isDragging ? 0.4 : 1
  }

  // Create listeners that exclude the delete button
  const dragListeners = {
    ...listeners,
    onPointerDown: (e: React.PointerEvent) => {
      // Don't start drag if clicking on delete button
      if ((e.target as HTMLElement).closest('button[data-delete-group]')) {
        return
      }
      listeners?.onPointerDown?.(e)
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...dragListeners}
      className={`transition-all duration-200 ${isDragging ? 'z-50 scale-95' : ''}`}
    >
      <NodeGroupComponent
        group={group}
        nodes={nodes}
        selectedNode={selectedNode}
        searchQuery={searchQuery}
        rootNodeId={rootNodeId}
        onSelectNode={onSelectNode}
        onDeleteNode={onDeleteNode}
        onToggleGroup={onToggleGroup}
        onDeleteGroup={onDeleteGroup}
        onReorderNodes={onReorderNodes}
      />
    </div>
  )
}

