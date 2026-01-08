'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { TableConfig } from '@/lib/resources/TableConfig'

interface UseDataTableParams<T> {
  config: TableConfig<T>
  /**
   * Optional external data source (e.g., from React Query)
   * If provided, internal fetching will be disabled
   */
  externalData?: T[]
  externalTotal?: number
  externalLoading?: boolean
}

export function useDataTable<T extends { id: string }>({ 
  config,
  externalData,
  externalTotal,
  externalLoading
}: UseDataTableParams<T>) {
  const [data, setData] = useState<T[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(config.defaultPageSize || 10)
  const [sortBy, setSortBy] = useState<string | undefined>()
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | undefined>()
  const [filters, setFilters] = useState<Record<string, unknown>>({})

  // Use external data if provided (React Query)
  const useExternalData = externalData !== undefined

  // Store config.fetchData in a ref to avoid dependency issues
  const fetchDataFnRef = useRef(config.fetchData)
  useEffect(() => {
    fetchDataFnRef.current = config.fetchData
  }, [config.fetchData])

  const fetchData = useCallback(async () => {
    if (useExternalData) return // Skip if using external data
    
    setLoading(true)
    setError(null)
    try {
      const result = await fetchDataFnRef.current({
        page,
        pageSize,
        sortBy,
        sortOrder,
        filters
      })
      setData(result.data)
      setTotal(result.total)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch data'))
      console.error('DataTable fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, sortBy, sortOrder, filters, useExternalData])

  useEffect(() => {
    if (!useExternalData) {
      fetchData()
    }
  }, [fetchData, useExternalData])

  // Sync external data when provided
  useEffect(() => {
    if (useExternalData) {
      if (externalData !== undefined) {
        setData(externalData)
      }
      if (externalTotal !== undefined) {
        setTotal(externalTotal)
      }
      if (externalLoading !== undefined) {
        setLoading(externalLoading)
      }
    }
  }, [useExternalData, externalData, externalTotal, externalLoading])

  const updateFilters = useCallback((newFilters: Record<string, unknown>) => {
    setFilters(newFilters)
    setPage(1) // Reset to first page when filters change
  }, [])

  const updateSorting = useCallback((columnId: string, order: 'asc' | 'desc' | undefined) => {
    setSortBy(order ? columnId : undefined)
    setSortOrder(order)
    setPage(1) // Reset to first page when sorting changes
  }, [])

  return {
    data,
    total,
    loading,
    error,
    page,
    pageSize,
    setPage,
    setPageSize,
    sortBy,
    sortOrder,
    updateSorting,
    filters,
    updateFilters,
    refetch: fetchData
  }
}

