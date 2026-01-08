'use client'

import { useEffect } from 'react'
import { useDatabaseStore } from '@/app/dashboard/stores/databaseStore'
export type { DatabaseStatus } from '@/app/dashboard/stores/databaseStore'

export function useDatabase () {
  const loading = useDatabaseStore(state => state.loading)
  const dbStatus = useDatabaseStore(state => state.dbStatus)
  const isInitializing = useDatabaseStore(state => state.isInitializing)
  const query = useDatabaseStore(state => state.currentQuery)
  const queryResults = useDatabaseStore(state => state.queryResults)
  const setQuery = useDatabaseStore(state => state.setQuery)
  const checkStatus = useDatabaseStore(state => state.checkStatus)
  const loadGraphFromFile = useDatabaseStore(state => state.loadGraphFromFile)
  const executeQuery = useDatabaseStore(state => state.executeQuery)

  // Auto-check status on mount
  useEffect(() => {
    checkStatus(true)
  }, [checkStatus])

  return {
    loading,
    dbStatus,
    isInitializing,
    query,
    setQuery,
    queryResults,
    checkStatus,
    loadGraphFromFile,
    executeQuery
  }
}
