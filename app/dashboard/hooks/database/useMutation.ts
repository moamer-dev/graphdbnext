import { useState, useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import { UpdateMutationService, type PropertyUpdate } from '@/lib/services/UpdateMutationService'

export function useMutation () {
  const [isSaving, setIsSaving] = useState(false)
  const mutationService = useMemo(() => new UpdateMutationService(), [])

  const updateNodeProperties = useCallback(async (
    nodeId: number | string,
    updates: PropertyUpdate[]
  ): Promise<boolean> => {
    const validation = mutationService.validateUpdates(updates)
    if (!validation.valid) {
      toast.error(`Validation failed: ${validation.errors.join(', ')}`)
      return false
    }

    setIsSaving(true)
    try {
      const query = mutationService.generateUpdateNodeQuery(nodeId, updates)
      
      const response = await fetch('/api/database/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      })

      const data = await response.json()

      if (data.success) {
        toast.success(`Successfully updated ${updates.length} propert${updates.length === 1 ? 'y' : 'ies'}`)
        return true
      } else {
        toast.error(data.error || 'Failed to update node properties')
        return false
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update node properties'
      toast.error(errorMessage)
      return false
    } finally {
      setIsSaving(false)
    }
  }, [mutationService])

  const updateRelationshipProperties = useCallback(async (
    relationshipId: number | string,
    updates: PropertyUpdate[]
  ): Promise<boolean> => {
    const validation = mutationService.validateUpdates(updates)
    if (!validation.valid) {
      toast.error(`Validation failed: ${validation.errors.join(', ')}`)
      return false
    }

    setIsSaving(true)
    try {
      const query = mutationService.generateUpdateRelationshipQuery(relationshipId, updates)
      
      const response = await fetch('/api/database/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      })

      const data = await response.json()

      if (data.success) {
        toast.success(`Successfully updated ${updates.length} propert${updates.length === 1 ? 'y' : 'ies'}`)
        return true
      } else {
        toast.error(data.error || 'Failed to update relationship properties')
        return false
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update relationship properties'
      toast.error(errorMessage)
      return false
    } finally {
      setIsSaving(false)
    }
  }, [mutationService])

  const deleteNode = useCallback(async (
    nodeId: number | string,
    detach = false,
    cascade = false
  ): Promise<boolean> => {
    setIsSaving(true)
    try {
      const query = mutationService.generateDeleteNodeQuery(nodeId, detach, cascade)
      
      const response = await fetch('/api/database/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Node deleted successfully')
        return true
      } else {
        toast.error(data.error || 'Failed to delete node')
        return false
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete node'
      toast.error(errorMessage)
      return false
    } finally {
      setIsSaving(false)
    }
  }, [mutationService])

  const deleteRelationship = useCallback(async (
    relationshipId: number | string
  ): Promise<boolean> => {
    setIsSaving(true)
    try {
      const query = mutationService.generateDeleteRelationshipQuery(relationshipId)
      
      const response = await fetch('/api/database/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Relationship deleted successfully')
        return true
      } else {
        toast.error(data.error || 'Failed to delete relationship')
        return false
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete relationship'
      toast.error(errorMessage)
      return false
    } finally {
      setIsSaving(false)
    }
  }, [mutationService])

  const createNode = useCallback(async (
    labels: string[],
    properties: Record<string, unknown> = {}
  ): Promise<{ success: boolean; nodeId?: number | string; error?: string }> => {
    setIsSaving(true)
    try {
      const query = mutationService.generateCreateNodeQuery(labels, properties)
      
      const response = await fetch('/api/database/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      })

      const data = await response.json()

      if (data.success && data.results && data.results.length > 0) {
        const createdNode = data.results[0].n || data.results[0]
        const nodeId = createdNode.id !== undefined ? createdNode.id : createdNode.identity
        toast.success('Node created successfully')
        return { success: true, nodeId }
      } else {
        const errorMsg = data.error || 'Failed to create node'
        toast.error(errorMsg)
        return { success: false, error: errorMsg }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create node'
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsSaving(false)
    }
  }, [mutationService])

  const createRelationship = useCallback(async (
    fromNodeId: number | string,
    toNodeId: number | string,
    relationshipType: string,
    properties: Record<string, unknown> = {}
  ): Promise<{ success: boolean; relationshipId?: number | string; error?: string }> => {
    setIsSaving(true)
    try {
      const query = mutationService.generateCreateRelationshipQuery(fromNodeId, toNodeId, relationshipType, properties)
      
      const response = await fetch('/api/database/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      })

      const data = await response.json()

      if (data.success && data.results && data.results.length > 0) {
        const createdRel = data.results[0].r || data.results[0]
        const relId = createdRel.id !== undefined ? createdRel.id : createdRel.identity
        toast.success('Relationship created successfully')
        return { success: true, relationshipId: relId }
      } else {
        const errorMsg = data.error || 'Failed to create relationship'
        toast.error(errorMsg)
        return { success: false, error: errorMsg }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create relationship'
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsSaving(false)
    }
  }, [mutationService])

  return {
    isSaving,
    updateNodeProperties,
    updateRelationshipProperties,
    deleteNode,
    deleteRelationship,
    createNode,
    createRelationship
  }
}

