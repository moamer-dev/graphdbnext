'use client'

import { useCallback } from 'react'
import { useSchemaStore } from '@/app/dashboard/stores/schemaStore'
import type { SchemaStatistics } from '@/lib/services/SchemaExplorerService'

export function useSchemaExplorer() {
  const { statistics, loading, error, setStatistics, setLoading, setError } = useSchemaStore()

  const fetchSchema = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/database/schema')
      const data = await response.json()
      
      if (data.success && data.statistics) {
        setStatistics(data.statistics as SchemaStatistics)
        setLoading(false)
      } else {
        setLoading(false)
        const errorMessage = data.error || 'Failed to fetch schema'
        setError(errorMessage)
      }
    } catch (err) {
      setLoading(false)
      let errorMessage = 'Failed to fetch schema'
      if (err instanceof Error) {
        if (err.message.includes('WebSocket') || err.message.includes('connection') || err.message.includes('fetch')) {
          errorMessage = 'Unable to connect to database. Please ensure the database is running and accessible.'
        } else {
          errorMessage = err.message
        }
      }
      setError(errorMessage)
      console.error('Error fetching schema:', err)
    }
  }, [setLoading, setError, setStatistics])

  return {
    statistics,
    loading,
    error,
    fetchSchema,
    refresh: fetchSchema
  }
}

