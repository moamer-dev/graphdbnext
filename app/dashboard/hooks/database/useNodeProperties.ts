'use client'

import { useEffect, useCallback } from 'react'
import { useDatabaseStore } from '@/app/dashboard/stores/databaseStore'

export function useNodeProperties (label?: string, enabled = true) {
  const properties = useDatabaseStore(state => label ? (state.nodeProperties[label] || []) : [])
  const loading = useDatabaseStore(state => label ? (state.nodePropertiesLoading[label] || false) : false)
  const error = useDatabaseStore(state => label ? (state.nodePropertiesError[label] || null) : null)
  const fetchNodeProperties = useDatabaseStore(state => state.fetchNodeProperties)

  useEffect(() => {
    if (enabled && label && properties.length === 0 && !loading) {
      fetchNodeProperties(label)
    }
  }, [enabled, label, properties.length, loading, fetchNodeProperties])

  const refresh = useCallback(() => {
    if (label) {
      fetchNodeProperties(label)
    }
  }, [label, fetchNodeProperties])

  return {
    properties,
    loading,
    error,
    refresh
  }
}
