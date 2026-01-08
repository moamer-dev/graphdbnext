'use client'

import { useEffect, useCallback, useMemo } from 'react'
import { useDatabaseStore } from '@/app/dashboard/stores/databaseStore'

interface UseRelationshipTypesOptions {
  enabled?: boolean
  fromLabel?: string
  toLabel?: string
}

export function useRelationshipTypes ({ enabled = true, fromLabel, toLabel }: UseRelationshipTypesOptions = {}) {
  const cacheKey = useMemo(() => `${fromLabel || 'any'}-${toLabel || 'any'}`, [fromLabel, toLabel])
  
  // Get all relationship types from store to avoid creating new arrays on each render
  const allRelationshipTypes = useDatabaseStore(state => state.relationshipTypes)
  const allRelationshipTypesLoading = useDatabaseStore(state => state.relationshipTypesLoading)
  const allRelationshipTypesError = useDatabaseStore(state => state.relationshipTypesError)
  const fetchRelationshipTypes = useDatabaseStore(state => state.fetchRelationshipTypes)
  
  // Memoize the selected values to ensure stable references
  const relationshipTypes = useMemo(() => allRelationshipTypes[cacheKey] || [], [allRelationshipTypes, cacheKey])
  const loading = useMemo(() => allRelationshipTypesLoading[cacheKey] || false, [allRelationshipTypesLoading, cacheKey])
  const error = useMemo(() => allRelationshipTypesError[cacheKey] || null, [allRelationshipTypesError, cacheKey])

  useEffect(() => {
    if (enabled && relationshipTypes.length === 0 && !loading) {
      fetchRelationshipTypes(fromLabel, toLabel)
    }
  }, [enabled, fromLabel, toLabel, relationshipTypes.length, loading, fetchRelationshipTypes])

  const refresh = useCallback(() => {
    fetchRelationshipTypes(fromLabel, toLabel)
  }, [fromLabel, toLabel, fetchRelationshipTypes])

  return {
    relationshipTypes,
    loading,
    error,
    refresh,
    cacheKey
  }
}
