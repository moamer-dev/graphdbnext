'use client'

import React, { useRef, useEffect } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { X, GripVertical } from 'lucide-react'
import type { Node } from '../../types'

interface SortableNodeItemProps {
  node: Node
  onSelect: () => void
  onDelete: () => void
  selected: boolean
  isRoot?: boolean
}

export function SortableNodeItem ({ node, onSelect, onDelete, selected, isRoot = false }: SortableNodeItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: node.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? undefined : transition,
    opacity: isDragging ? 0.4 : 1
  }

  // Track if we should allow selection (prevent selection during drag)
  const allowSelectionRef = useRef(true)

  // Create listeners that exclude the delete button
  const dragListeners = {
    ...listeners,
    onPointerDown: (e: React.PointerEvent) => {
      // Don't start drag if clicking on delete button
      if ((e.target as HTMLElement).closest('button[data-delete-button]')) {
        return
      }
      // Allow selection on pointer down (before drag starts)
      allowSelectionRef.current = true
      // Set timeout to prevent selection if drag starts
      setTimeout(() => {
        allowSelectionRef.current = false
      }, 100)
      listeners?.onPointerDown?.(e)
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    // Select immediately on mouse down (before drag can start)
    if (!(e.target as HTMLElement).closest('button[data-delete-button]')) {
      onSelect()
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    // Also handle click as fallback
    if (!isDragging && allowSelectionRef.current && !(e.target as HTMLElement).closest('button[data-delete-button]')) {
      onSelect()
    }
  }

  return (
    <div
      ref={setNodeRef}
      data-node-id={node.id}
      style={style}
      {...attributes}
      {...dragListeners}
      className={`group flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-all cursor-grab active:cursor-grabbing ${
        isRoot
          ? 'bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-400 shadow-md'
          : selected
            ? 'bg-primary/10 border border-primary shadow-md'
            : 'bg-muted/40 border border-border/60 shadow-sm hover:bg-muted/60 hover:shadow'
      }`}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
    >
      <div className="flex-shrink-0 text-muted-foreground">
        <GripVertical className="h-3 w-3" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <div className="font-medium truncate text-foreground">{node.label}</div>
          {isRoot && (
            <span className="px-1 py-[1px] text-[8px] font-bold text-amber-800 bg-amber-200 rounded-full flex-shrink-0">
              ROOT
            </span>
          )}
        </div>
        <div className="text-muted-foreground truncate text-[10px]">{node.type}</div>
      </div>
      <button
        data-delete-button
        onClick={(e) => {
          e.stopPropagation()
          e.preventDefault()
          onDelete()
        }}
        onMouseDown={(e) => {
          e.stopPropagation()
          e.preventDefault()
        }}
        onPointerDown={(e) => {
          e.stopPropagation()
          e.preventDefault()
        }}
        className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive/80 hover:bg-destructive/10 rounded p-1 z-10 relative"
        title="Delete node"
        type="button"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

