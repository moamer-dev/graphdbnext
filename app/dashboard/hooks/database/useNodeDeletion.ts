'use client'

import { useState, useCallback, useEffect } from 'react'
import { NodeQueries } from '@/lib/queries/cypherQueries'

interface UseNodeDeletionOptions {
  nodeId?: number | string | null
  enabled?: boolean
}

export function useNodeDeletion ({ nodeId, enabled = true }: UseNodeDeletionOptions = {}) {
  const [outgoingRelationshipsCount, setOutgoingRelationshipsCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkOutgoingRelationships = useCallback(async () => {
    if (!nodeId) {
      setOutgoingRelationshipsCount(null)
      return
    }

    setLoading(true)
    setError(null)
    
    let cancelled = false

    try {
      const query = NodeQueries.countOutgoingRelationships(nodeId)
      
      const response = await fetch('/api/database/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      })

      if (cancelled) return

      const data = await response.json()
      if (data.success && data.results && data.results.length > 0) {
        const count = data.results[0].count as number || 0
        setOutgoingRelationshipsCount(count)
      } else {
        setError(data.error || 'Failed to check relationships')
      }
    } catch (err) {
      if (cancelled) return
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to check relationships'
      setError(errorMessage)
      console.error('Error checking outgoing relationships:', err)
    } finally {
      if (!cancelled) {
        setLoading(false)
      }
    }

    return () => {
      cancelled = true
    }
  }, [nodeId])

  useEffect(() => {
    if (enabled && nodeId) {
      checkOutgoingRelationships()
    } else {
      setOutgoingRelationshipsCount(null)
    }
  }, [enabled, nodeId, checkOutgoingRelationships])

  const hasOutgoingRelationships = outgoingRelationshipsCount !== null && outgoingRelationshipsCount > 0

  return {
    outgoingRelationshipsCount,
    hasOutgoingRelationships,
    loading,
    error,
    refresh: checkOutgoingRelationships
  }
}
