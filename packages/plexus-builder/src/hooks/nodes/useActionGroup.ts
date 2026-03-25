import { useState, useEffect, useCallback } from 'react'

export interface ActionGroupNodeData {
  label: string
  type: string
  onSelect: () => void
  onDelete: () => void
  onAddAction?: (actionTypes?: import('../../stores/actionCanvasStore').ActionNodeType[]) => void
  onSelectChildAction?: (actionId: string) => void
  onRemoveChildAction?: (actionId: string) => void
  onMoveActionUp?: (actionId: string) => void
  onMoveActionDown?: (actionId: string) => void
  actionCount?: number
  isExpanded?: boolean
  onToggleExpand?: () => void
  children?: Array<{
    id: string
    label: string
    type: string
  }>
  _version?: string // Internal version key for ReactFlow updates
}

export function useActionGroup(data: ActionGroupNodeData) {
  const [isExpanded, setIsExpanded] = useState(data.isExpanded ?? false)
  const [showActionSelector, setShowActionSelector] = useState(false)
  const actionCount = data.actionCount ?? (data.children?.length ?? 0)

  useEffect(() => {
    const newExpanded = data.isExpanded ?? false
    if (newExpanded !== isExpanded) {
      requestAnimationFrame(() => {
        setIsExpanded(newExpanded)
      })
    }
  }, [data.isExpanded, isExpanded])

  const handleToggleExpand = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setIsExpanded(prev => !prev)
    data.onToggleExpand?.()
  }, [data])

  const handleAddAction = useCallback(() => {
    setShowActionSelector(true)
  }, [])

  const handleActionSelected = useCallback((actionTypes?: import('../../stores/actionCanvasStore').ActionNodeType[]) => {
    setShowActionSelector(false)
    data.onAddAction?.(actionTypes)
  }, [data])

  const handleRemoveChildAction = useCallback((e: React.MouseEvent, actionId: string) => {
    e.stopPropagation()
    data.onRemoveChildAction?.(actionId)
  }, [data])

  const handleSelectChildAction = useCallback((actionId: string) => {
    data.onSelectChildAction?.(actionId)
  }, [data])

  const handleMoveActionUp = useCallback((e: React.MouseEvent, actionId: string) => {
    e.stopPropagation()
    data.onMoveActionUp?.(actionId)
  }, [data])

  const handleMoveActionDown = useCallback((e: React.MouseEvent, actionId: string) => {
    e.stopPropagation()
    data.onMoveActionDown?.(actionId)
  }, [data])

  return {
    isExpanded,
    showActionSelector,
    setShowActionSelector,
    actionCount,
    handleToggleExpand,
    handleAddAction,
    handleActionSelected,
    handleRemoveChildAction,
    handleSelectChildAction,
    handleMoveActionUp,
    handleMoveActionDown
  }
}

