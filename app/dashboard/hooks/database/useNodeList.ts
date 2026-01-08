'use client'

import { useState, useCallback, useEffect } from 'react'
import { NodeQueries } from '@/lib/queries/cypherQueries'

export interface GraphNode {
  id: number | string
  nodeId?: number | string
  labels: string[]
  properties: Record<string, unknown>
}

interface UseNodeListOptions {
  label?: string
  enabled?: boolean
  page?: number
  pageSize?: number
  searchTerm?: string
}

export function useNodeList ({ 
  label, 
  enabled = true, 
  page = 1, 
  pageSize = 50,
  searchTerm = ''
}: UseNodeListOptions = {}) {
  const [nodes, setNodes] = useState<GraphNode[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchNodes = useCallback(async () => {
    if (!label) {
      setNodes([])
      setTotalCount(0)
      return
    }

    setLoading(true)
    setError(null)
    try {
      // Get total count (with search filter if provided)
      const countQuery = searchTerm?.trim() 
        ? NodeQueries.countNodesByLabelWithSearch(label, searchTerm.trim())
        : NodeQueries.countNodesByLabel(label)
      const countResponse = await fetch('/api/database/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: countQuery })
      })
      const countData = await countResponse.json()
      if (countData.success && countData.results && countData.results.length > 0) {
        setTotalCount(countData.results[0].total as number || 0)
      }

      // Fetch paginated nodes (with search filter if provided)
      const skip = (page - 1) * pageSize
      const query = NodeQueries.getNodesByLabel(label, skip, pageSize, searchTerm?.trim())
      
      const response = await fetch('/api/database/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      })

      const data = await response.json()
      if (data.success && data.results) {
        const fetchedNodes: GraphNode[] = data.results.map((result: { 
          nodeId: number | string
          labels: string[]
          properties: Record<string, unknown>
        }) => ({
          id: result.nodeId,
          nodeId: result.nodeId,
          labels: result.labels,
          properties: result.properties
        }))
        setNodes(fetchedNodes)
      } else {
        setError(data.error || 'Failed to fetch nodes')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch nodes'
      setError(errorMessage)
      console.error('Error fetching nodes:', err)
      setNodes([])
    } finally {
      setLoading(false)
    }
  }, [label, page, pageSize, searchTerm])

  useEffect(() => {
    if (enabled && label) {
      fetchNodes()
    } else {
      setNodes([])
      setTotalCount(0)
    }
  }, [enabled, label, page, pageSize, searchTerm, fetchNodes])

  const refresh = useCallback(() => {
    if (label) {
      fetchNodes()
    }
  }, [label, fetchNodes])

  return {
    nodes,
    totalCount,
    loading,
    error,
    refresh
  }
}
