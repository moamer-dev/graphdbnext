import { useState, useCallback } from 'react'
import { useModelBuilderStore } from '../../stores/modelBuilderStore'
import { useToolCanvasStore } from '../../stores/toolCanvasStore'
import { useActionCanvasStore } from '../../stores/actionCanvasStore'

export function useCanvasNodeManagement() {
  const [deleteNodeDialogOpen, setDeleteNodeDialogOpen] = useState(false)
  const [pendingNodeId, setPendingNodeId] = useState<string | null>(null)
  
  const {
    deleteNode,
    selectNode,
    selectedNode
  } = useModelBuilderStore()
  
  const { deleteNode: deleteToolNode } = useToolCanvasStore()
  const { deleteNode: deleteActionNode } = useActionCanvasStore()

  const handleDeleteNode = useCallback((nodeId: string, nodeType?: 'model' | 'tool' | 'action') => {
    setPendingNodeId(nodeId)
    setDeleteNodeDialogOpen(true)
  }, [])

  const handleConfirmDeleteNode = useCallback((nodeType?: 'model' | 'tool' | 'action') => {
    if (!pendingNodeId) return
    
    if (nodeType === 'tool') {
      deleteToolNode(pendingNodeId)
    } else if (nodeType === 'action') {
      deleteActionNode(pendingNodeId)
    } else {
      deleteNode(pendingNodeId)
      if (selectedNode === pendingNodeId) {
        selectNode(null)
      }
    }
    
    setPendingNodeId(null)
    setDeleteNodeDialogOpen(false)
  }, [pendingNodeId, deleteNode, deleteToolNode, deleteActionNode, selectedNode, selectNode])

  const handleCancelDeleteNode = useCallback(() => {
    setPendingNodeId(null)
    setDeleteNodeDialogOpen(false)
  }, [])

  return {
    deleteNodeDialogOpen,
    pendingNodeId,
    handleDeleteNode,
    handleConfirmDeleteNode,
    handleCancelDeleteNode
  }
}

