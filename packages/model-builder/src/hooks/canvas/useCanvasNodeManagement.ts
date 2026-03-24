import { useState, useCallback } from 'react'
import { useModelBuilderStore } from '../../stores/modelBuilderStore'
import { useToolCanvasStore } from '../../stores/toolCanvasStore'
import { useActionCanvasStore } from '../../stores/actionCanvasStore'

export function useCanvasNodeManagement() {
  const [deleteNodeDialogOpen, setDeleteNodeDialogOpen] = useState(false)
  const [pendingNodeId, setPendingNodeId] = useState<string | null>(null)
  const [pendingNodeType, setPendingNodeType] = useState<'model' | 'tool' | 'action' | null>(null)
  
  const {
    deleteNode,
    selectNode,
    selectedNode
  } = useModelBuilderStore()
  
  const { deleteNode: deleteToolNode } = useToolCanvasStore()
  const { deleteNode: deleteActionNode } = useActionCanvasStore()

  const handleDeleteNode = useCallback((nodeId: string, nodeType: 'model' | 'tool' | 'action' = 'model') => {
    setPendingNodeId(nodeId)
    setPendingNodeType(nodeType)
    setDeleteNodeDialogOpen(true)
  }, [])

  const handleConfirmDeleteNode = useCallback(() => {
    if (!pendingNodeId) return
    
    if (pendingNodeType === 'tool') {
      deleteToolNode(pendingNodeId)
    } else if (pendingNodeType === 'action') {
      deleteActionNode(pendingNodeId)
    } else {
      deleteNode(pendingNodeId)
      if (selectedNode === pendingNodeId) {
        selectNode(null)
      }
    }
    
    setPendingNodeId(null)
    setPendingNodeType(null)
    setDeleteNodeDialogOpen(false)
  }, [pendingNodeId, pendingNodeType, deleteNode, deleteToolNode, deleteActionNode, selectedNode, selectNode])

  const handleCancelDeleteNode = useCallback(() => {
    setPendingNodeId(null)
    setPendingNodeType(null)
    setDeleteNodeDialogOpen(false)
  }, [])

  return {
    deleteNodeDialogOpen,
    pendingNodeId,
    pendingNodeType,
    handleDeleteNode,
    handleConfirmDeleteNode,
    handleCancelDeleteNode
  }
}

