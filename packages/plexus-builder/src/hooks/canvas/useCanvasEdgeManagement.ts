import { useState, useCallback } from 'react'
import { useModelBuilderStore } from '../../stores/modelBuilderStore'
import { useToolCanvasStore } from '../../stores/toolCanvasStore'
import { useActionCanvasStore } from '../../stores/actionCanvasStore'

export function useCanvasEdgeManagement() {
  const [deleteRelationshipDialogOpen, setDeleteRelationshipDialogOpen] = useState(false)
  const [pendingRelationshipId, setPendingRelationshipId] = useState<string | null>(null)
  const [deleteEdgeDialogOpen, setDeleteEdgeDialogOpen] = useState(false)
  const [pendingEdgeId, setPendingEdgeId] = useState<string | null>(null)
  const [pendingEdgeType, setPendingEdgeType] = useState<'tool' | 'action' | null>(null)

  const {
    deleteRelationship,
    selectRelationship,
    selectedRelationship
  } = useModelBuilderStore()
  
  const { deleteEdge: deleteToolEdge } = useToolCanvasStore()
  const { deleteEdge: deleteActionEdge } = useActionCanvasStore()

  const handleDeleteRelationship = useCallback((relationshipId: string) => {
    setPendingRelationshipId(relationshipId)
    setDeleteRelationshipDialogOpen(true)
  }, [])

  const handleConfirmDeleteRelationship = useCallback(() => {
    if (!pendingRelationshipId) return
    
    deleteRelationship(pendingRelationshipId)
    if (selectedRelationship === pendingRelationshipId) {
      selectRelationship(null)
    }
    setPendingRelationshipId(null)
    setDeleteRelationshipDialogOpen(false)
  }, [pendingRelationshipId, deleteRelationship, selectedRelationship, selectRelationship])

  const handleCancelDeleteRelationship = useCallback(() => {
    setPendingRelationshipId(null)
    setDeleteRelationshipDialogOpen(false)
  }, [])

  const handleDeleteEdge = useCallback((edgeId: string, edgeType: 'tool' | 'action') => {
    setPendingEdgeId(edgeId)
    setPendingEdgeType(edgeType)
    setDeleteEdgeDialogOpen(true)
  }, [])

  const handleConfirmDeleteEdge = useCallback(() => {
    if (!pendingEdgeId || !pendingEdgeType) return
    
    if (pendingEdgeType === 'tool') {
      deleteToolEdge(pendingEdgeId)
    } else if (pendingEdgeType === 'action') {
      deleteActionEdge(pendingEdgeId)
    }
    
    setPendingEdgeId(null)
    setPendingEdgeType(null)
    setDeleteEdgeDialogOpen(false)
  }, [pendingEdgeId, pendingEdgeType, deleteToolEdge, deleteActionEdge])

  const handleCancelDeleteEdge = useCallback(() => {
    setPendingEdgeId(null)
    setPendingEdgeType(null)
    setDeleteEdgeDialogOpen(false)
  }, [])

  return {
    deleteRelationshipDialogOpen,
    pendingRelationshipId,
    deleteEdgeDialogOpen,
    pendingEdgeId,
    pendingEdgeType,
    handleDeleteRelationship,
    handleConfirmDeleteRelationship,
    handleCancelDeleteRelationship,
    handleDeleteEdge,
    handleConfirmDeleteEdge,
    handleCancelDeleteEdge
  }
}

