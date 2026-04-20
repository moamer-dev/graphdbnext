'use client'

import { useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useDataTable } from '@/components/data-table/useDataTable'
import type { TableConfig } from '@/resources/TableConfig'
import type { UseQueryResult } from '@tanstack/react-query'
import type { ResourceResponse } from '@/hooks/react-query/useResource'

/**
 * Generic Resource Table Hook
 * 
 * Combines useDataTable with React Query data fetching.
 * Works with any resource that has a TableConfig.
 */
interface UseResourceTableOptions<T extends { id: string }> {
  resource: {
    createTableConfig: (
      onView: (id: string) => void,
      onEdit: (id: string) => void,
      onDelete: (id: string) => Promise<void>,
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
  useBulkDelete: (options?: { onSuccess?: () => void }) => {
    mutateAsync: (ids: string[]) => Promise<void>
  }
  isAdmin?: boolean
  userId?: string
  userPermissions?: any[]
  initialFilters?: Record<string, unknown>
  tableConfigArgs?: unknown[]
  onView?: (id: string) => void
  onEdit?: (id: string) => void
  onManageMembers?: (id: string) => void
  scope?: string
}

export function useResourceTable<T extends { id: string }>(
  options: UseResourceTableOptions<T>
) {
  const router = useRouter()
  const { resource, useList, useDelete, useBulkDelete, isAdmin, userId, userPermissions, initialFilters = {}, tableConfigArgs = [], onView: onViewOverride, onEdit: onEditOverride, onManageMembers: onManageMembersOverride, scope } = options
  const deleteMutation = useDelete({ redirect: false })
  const bulkDeleteMutation = useBulkDelete({ onSuccess: () => {} })

  const handleDelete = useCallback(async (id: string) => {
    await deleteMutation.mutateAsync(id)
  }, [deleteMutation])

  const handleBulkDelete = useCallback(async (selectedRows: T[]) => {
    const ids = selectedRows.map(row => row.id)
    await bulkDeleteMutation.mutateAsync(ids)
  }, [bulkDeleteMutation])

  const handleView = useCallback((id: string) => {
    if (onViewOverride) {
      onViewOverride(id)
    } else {
      router.push(`${resource.VIEW_PATH}/${id}`)
    }
  }, [router, resource, onViewOverride])

  const handleEdit = useCallback((id: string) => {
    if (onEditOverride) {
      onEditOverride(id)
    } else {
      router.push(`${resource.VIEW_PATH}/${id}/edit`)
    }
  }, [router, resource, onEditOverride])

  const handleManageMembers = useCallback((id: string) => {
    if (onManageMembersOverride) {
      onManageMembersOverride(id)
    } else {
      router.push(`${resource.LIST_PATH}/${id}/members`)
    }
  }, [router, resource, onManageMembersOverride])

  // Memoize initialFilters to prevent infinite loops from object literals in page components
  const memoizedInitialFilters = useMemo(() => initialFilters, [JSON.stringify(initialFilters)])

  const config = useMemo(() => {
    const args: any[] = [...tableConfigArgs]
    if (isAdmin !== undefined) args.push(isAdmin)
    if (userId !== undefined) args.push(userId)
    if (userPermissions !== undefined) args.push(userPermissions)

    return resource.createTableConfig(
      handleView,
      handleEdit,
      handleDelete,
      handleManageMembers,
      ...args
    )
  }, [resource, handleView, handleEdit, handleDelete, handleManageMembers, isAdmin, userId, userPermissions, tableConfigArgs])

  // 1b. Inject bulk delete action if selection is enabled
  const finalConfig = useMemo(() => {
    if (!config.enableRowSelection) return config

    return {
      ...config,
      bulkActions: [
        ...(config.bulkActions || []),
        {
          label: 'Delete Selected',
          variant: 'destructive' as const,
          requiresConfirmation: true,
          action: (rows: T[]) => handleBulkDelete(rows),
          permission: { action: 'DELETE' as const }
        }
      ]
    }
  }, [config, handleBulkDelete])

  // 1. Initialize table state (Manages page, pageSize, sorting, filters)
  const tableState = useDataTable({ 
    config,
    useExternal: true,
    filters: memoizedInitialFilters
  })

  // 2. Derive query params from table state
  const queryParams = useMemo(() => ({
    page: tableState.page,
    pageSize: tableState.pageSize,
    sortBy: tableState.sortBy,
    sortOrder: tableState.sortOrder,
    filters: {
        ...tableState.filters,
        ...(scope ? { scope } : {})
    }
  }), [tableState.page, tableState.pageSize, tableState.sortBy, tableState.sortOrder, tableState.filters, scope])

  // 3. Fetch data using React Query
  const queryResult = useList(queryParams)

  // 4. Return combined state
  const data = useMemo(() => queryResult.data?.data || [], [queryResult.data])
  const total = useMemo(() => queryResult.data?.total || 0, [queryResult.data])

  return {
    config: finalConfig,
    data,
    total,
    loading: queryResult.isLoading,
    page: tableState.page,
    pageSize: tableState.pageSize,
    sortBy: tableState.sortBy,
    sortOrder: tableState.sortOrder,
    filters: tableState.filters,
    onPageChange: tableState.setPage,
    onPageSizeChange: tableState.setPageSize,
    onSortChange: tableState.updateSorting,
    onFiltersChange: tableState.updateFilters
  }
}
