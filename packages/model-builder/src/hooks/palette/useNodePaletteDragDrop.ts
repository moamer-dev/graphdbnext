import { useState, useCallback } from 'react'
import type { DragEndEvent } from '@dnd-kit/core'
import { useModelBuilderStore } from '../../stores/modelBuilderStore'
import type { Node } from '../../types'

export function useNodePaletteDragDrop() {
  const [activeId, setActiveId] = useState<string | null>(null)
  const { reorderNodes, reorderUngroupedNodes } = useModelBuilderStore()

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over || active.id === over.id) {
      return
    }

    if (typeof active.id === 'string' && typeof over.id === 'string') {
      reorderNodes(active.id, over.id)
      reorderUngroupedNodes(active.id, over.id)
    }
  }, [reorderNodes, reorderUngroupedNodes])

  const handleDragStart = useCallback((event: { active: { id: string | number } }) => {
    setActiveId(String(event.active.id))
  }, [])

  return {
    activeId,
    handleDragStart,
    handleDragEnd
  }
}

