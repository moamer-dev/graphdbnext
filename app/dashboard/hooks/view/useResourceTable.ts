'use client'

import { useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useDataTable } from '@/components/data-table/useDataTable'
import type { TableConfig } from '@/lib/resources/TableConfig'
import type { UseQueryResult } from '@tanstack/react-query'
import type { ResourceResponse } from '@/lib/react-query/hooks/useResource'

/**
 * Generic Resource Table Hook
 * 
 * Combines useDataTable with React Query data fetching.
 * Works with any resource that has a TableConfig.
 * 
 * Usage:
 * ```typescript
 * const { config, data, total, loading } = useResourceTable({
 *   resource: UserResource,
 *   useList: useUsers.useList,
 *   onView: (id) => router.push(`/users/${id}`),
 *   onEdit: (id) => router.push(`/users/${id}/edit`),
 *   onDelete: async (id) => await deleteUser.mutateAsync(id)
 * })
 * ```
 */
interface UseResourceTableOptions<T extends { id: string }> {
  resource: {
    createTableConfig: (
      onView: (id: string) => void,
      onEdit: (id: string) => void,
      onDelete: (id: string) => Promise<void>,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...args: any[]
    ) => TableConfig<T>
    LIST_PATH: string
    VIEW_PATH: string
  }
  useList: (params: {
    page: number
    pageSize: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    filters?: Record<string, unknown>
  }) => UseQueryResult<ResourceResponse<T>, Error>
  useDelete: (options?: { redirect?: boolean }) => {
    mutateAsync: (id: string) => Promise<void>
  }
  isAdmin?: boolean
  // Additional args to pass to createTableConfig (e.g., isAdmin)
  tableConfigArgs?: unknown[]
}

export function useResourceTable<T extends { id: string }>(
  options: UseResourceTableOptions<T>
) {
  const router = useRouter()
  const { resource, useList, useDelete, isAdmin, tableConfigArgs = [] } = options

  // Delete mutation
  const deleteMutation = useDelete({ redirect: false })

  // Handlers
  const handleDelete = useCallback(
    async (id: string) => {
      await deleteMutation.mutateAsync(id)
    },
    [deleteMutation]
  )

  const handleView = useCallback(
    (id: string) => {
      router.push(`${resource.VIEW_PATH}/${id}`)
    },
    [router, resource]
  )

  const handleEdit = useCallback(
    (id: string) => {
      router.push(`${resource.VIEW_PATH}/${id}/edit`)
    },
    [router, resource]
  )

  // Table configuration
  const config = useMemo(
    () =>
      resource.createTableConfig(
        handleView,
        handleEdit,
        handleDelete,
        ...(isAdmin !== undefined ? [isAdmin, ...tableConfigArgs] : tableConfigArgs)
      ),
    [resource, handleView, handleEdit, handleDelete, isAdmin, tableConfigArgs]
  )

  // Table state (for pagination, sorting, filtering)
  const tableState = useDataTable({ config })

  // Memoize query params to ensure React Query detects changes
  const queryParams = useMemo(() => ({
    page: tableState.page,
    pageSize: tableState.pageSize,
    sortBy: tableState.sortBy,
    sortOrder: tableState.sortOrder,
    filters: tableState.filters
  }), [tableState.page, tableState.pageSize, tableState.sortBy, tableState.sortOrder, tableState.filters])

  // Fetch data with React Query using table state
  const queryResult = useList(queryParams)

  // Handlers for DataTable controlled props
  const handlePageChange = useCallback((newPage: number) => {
    tableState.setPage(newPage)
  }, [tableState.setPage])

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    tableState.setPageSize(newPageSize)
  }, [tableState.setPageSize])

  const handleSortChange = useCallback((newSortBy?: string, newSortOrder?: 'asc' | 'desc') => {
    if (newSortBy) {
      tableState.updateSorting(newSortBy, newSortOrder)
    } else {
      // Clear sorting
      tableState.updateSorting('', undefined)
    }
  }, [tableState.updateSorting])

  const handleFiltersChange = useCallback((newFilters: Record<string, unknown>) => {
    tableState.updateFilters(newFilters)
  }, [tableState.updateFilters])

  // Extract data and total from response
  // useResource.useList returns UseQueryResult<ResourceResponse<T>, Error>
  // where ResourceResponse<T> is { data: T[], total: number }
  const data = useMemo(() => {
    if (!queryResult.data) return []
    return queryResult.data.data || []
  }, [queryResult.data])

  const total = useMemo(() => {
    return queryResult.data?.total || 0
  }, [queryResult.data])

  return {
    config,
    data,
    total,
    loading: queryResult.isLoading,
    page: tableState.page,
    pageSize: tableState.pageSize,
    sortBy: tableState.sortBy,
    sortOrder: tableState.sortOrder,
    filters: tableState.filters,
    onPageChange: handlePageChange,
    onPageSizeChange: handlePageSizeChange,
    onSortChange: handleSortChange,
    onFiltersChange: handleFiltersChange
  }
}

