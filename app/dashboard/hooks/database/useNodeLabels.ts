'use client'

import { useEffect, useCallback } from 'react'
import { useDatabaseStore } from '@/app/dashboard/stores/databaseStore'

export function useNodeLabels (enabled = true) {
  const nodeLabels = useDatabaseStore(state => state.nodeLabels)
  const loading = useDatabaseStore(state => state.nodeLabelsLoading)
  const error = useDatabaseStore(state => state.nodeLabelsError)
  const fetchNodeLabels = useDatabaseStore(state => state.fetchNodeLabels)
  const invalidateNodeLabels = useDatabaseStore(state => state.invalidateNodeLabels)

  useEffect(() => {
    if (enabled && nodeLabels.length === 0 && !loading) {
      fetchNodeLabels()
    }
  }, [enabled, nodeLabels.length, loading, fetchNodeLabels])

  const refresh = useCallback(() => {
    invalidateNodeLabels()
    fetchNodeLabels()
  }, [invalidateNodeLabels, fetchNodeLabels])

  return {
    nodeLabels,
    loading,
    error,
    refresh
  }
}
