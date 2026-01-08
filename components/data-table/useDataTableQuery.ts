'use client'

import { useQuery } from '@tanstack/react-query'
import type { TableConfig } from '@/lib/resources/TableConfig'

interface UseDataTableQueryParams<T> {
  config: TableConfig<T>
  page: number
  pageSize: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  filters?: Record<string, unknown>
}

/**
 * React Query version of useDataTable
 * 
 * Benefits:
 * - Automatic caching
 * - Background refetching
 * - Request deduplication
 * - Better error handling
 */
export function useDataTableQuery<T extends { id: string }>({
  config,
  page,
  pageSize,
  sortBy,
  sortOrder,
  filters
}: UseDataTableQueryParams<T>) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [config.name, 'paginated', { page, pageSize, sortBy, sortOrder, filters }],
    queryFn: async () => {
      return await config.fetchData({
        page,
        pageSize,
        sortBy,
        sortOrder,
        filters
      })
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10 // 10 minutes
  })

  return {
    data: data?.data || [],
    total: data?.total || 0,
    loading: isLoading,
    error: error instanceof Error ? error : null,
    refetch
  }
}

