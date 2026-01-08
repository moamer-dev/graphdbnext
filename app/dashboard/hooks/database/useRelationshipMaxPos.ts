'use client'

import { useState, useCallback, useEffect } from 'react'
import { RelationshipQueries } from '@/lib/queries/cypherQueries'

export function useRelationshipMaxPos (relationshipType?: string, enabled = true) {
  const [maxPos, setMaxPos] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchMaxPos = useCallback(async () => {
    if (!relationshipType) {
      setMaxPos(null)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const query = RelationshipQueries.getMaxPosByType(relationshipType)
      const response = await fetch('/api/database/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      })

      const data = await response.json()
      if (data.success && data.results && data.results.length > 0) {
        setMaxPos(data.results[0].maxPos as number | null)
      } else {
        setError(data.error || 'Failed to fetch max pos')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch max pos'
      setError(errorMessage)
      console.error('Error fetching max pos:', err)
      setMaxPos(null)
    } finally {
      setLoading(false)
    }
  }, [relationshipType])

  useEffect(() => {
    if (enabled && relationshipType) {
      fetchMaxPos()
    } else {
      setMaxPos(null)
    }
  }, [enabled, relationshipType, fetchMaxPos])

  return {
    maxPos,
    loading,
    error,
    refresh: fetchMaxPos
  }
}
