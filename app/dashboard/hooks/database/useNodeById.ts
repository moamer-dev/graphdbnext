'use client'

import { useState, useCallback } from 'react'
import type { GraphNode } from './useNodeList'
import { NodeQueries } from '@/lib/queries/cypherQueries'

export function useNodeById () {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchNodeById = useCallback(async (nodeId: number | string): Promise<GraphNode | null> => {
    setLoading(true)
    setError(null)
    try {
      const query = NodeQueries.getNodeById(nodeId)
      const response = await fetch('/api/database/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      })

      const data = await response.json()
      if (data.success && data.results && data.results.length > 0) {
        const nodeData = data.results[0].n
        const id = nodeData.id || nodeId
        const labels = nodeData.labels || []
        
        return {
          id: String(id),
          nodeId: typeof id === 'number' ? id : parseInt(String(id), 10),
          labels: labels,
          properties: nodeData.properties || {}
        }
      } else {
        setError(data.error || 'Failed to fetch node')
        return null
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch node'
      setError(errorMessage)
      console.error('Error fetching node by ID:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    fetchNodeById,
    loading,
    error
  }
}
