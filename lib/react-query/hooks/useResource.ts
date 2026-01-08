'use client'

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

/**
 * Generic Resource Hook Factory
 * 
 * Creates reusable hooks for any resource following the same pattern.
 * This reduces boilerplate while maintaining type safety and flexibility.
 * 
 * Usage:
 * ```typescript
 * const useUsers = createResourceHooks({
 *   resourceName: 'User',
 *   basePath: '/api/users',
 *   queryKeys: queryKeys.users,
 *   viewPath: '/dashboard/users',
 *   listPath: '/dashboard/users'
 * })
 * ```
 */

export interface ResourceConfig {
  resourceName: string
  basePath: string
  viewPath?: string
  listPath?: string
  queryKeys: {
    lists: () => readonly unknown[]
    detail: (id: string) => readonly unknown[]
    paginated: (params: {
      page: number
      pageSize: number
      sortBy?: string
      sortOrder?: 'asc' | 'desc'
      filters?: Record<string, unknown>
    }) => readonly unknown[]
  }
}

export interface FetchParams {
  page: number
  pageSize: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  filters?: Record<string, unknown>
}

export interface ResourceResponse<T> {
  data: T[]
  total: number
}

export interface SingleResourceResponse<T> {
  data: T
}


/**
 * Create resource hooks for a given resource
 * 
 * This factory function creates all the standard CRUD hooks
 * following React Query best practices.
 */
export function createResourceHooks<T extends { id: string }>(config: ResourceConfig) {
  const viewPath = config.viewPath || config.listPath
  const listPath = config.listPath || config.basePath.replace('/api/', '/dashboard/')

  // Fetch list with pagination
  async function fetchList (params: FetchParams): Promise<ResourceResponse<T>> {
    const searchParams = new URLSearchParams({
      page: String(params.page),
      pageSize: String(params.pageSize)
    })

    if (params.sortBy) {
      searchParams.append('sortBy', params.sortBy)
      if (params.sortOrder) {
        searchParams.append('sortOrder', params.sortOrder)
      }
    }

    Object.entries(params.filters || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (key === 'search') {
          searchParams.append('search', String(value))
        } else {
          searchParams.append(key, String(value))
        }
      }
    })

    const response = await fetch(`${config.basePath}?${searchParams.toString()}`)
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: `Failed to fetch ${config.resourceName.toLowerCase()}s` }))
      throw new Error(error.error || `Failed to fetch ${config.resourceName.toLowerCase()}s`)
    }

    const result = await response.json()
    
    return {
      data: result.data || [],
      total: result.total || 0
    }
  }

  // Fetch single item
  async function fetchSingle (id: string): Promise<SingleResourceResponse<T>> {
    const response = await fetch(`${config.basePath}/${id}`)
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: `Failed to fetch ${config.resourceName.toLowerCase()}` }))
      throw new Error(error.error || `Failed to fetch ${config.resourceName.toLowerCase()}`)
    }

    const result = await response.json()
    const resourceNameLower = config.resourceName.toLowerCase()
    
    return {
      data: result.data || result[resourceNameLower] || result[resourceNameLower + 's']
    }
  }

  // Create item
  async function createItem (data: Partial<T>): Promise<SingleResourceResponse<T>> {
    const response = await fetch(config.basePath, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: `Failed to create ${config.resourceName.toLowerCase()}` }))
      throw new Error(error.error || `Failed to create ${config.resourceName.toLowerCase()}`)
    }

    return response.json()
  }

  // Update item
  async function updateItem (id: string, data: Partial<T>): Promise<SingleResourceResponse<T>> {
    const response = await fetch(`${config.basePath}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: `Failed to update ${config.resourceName.toLowerCase()}` }))
      throw new Error(error.error || `Failed to update ${config.resourceName.toLowerCase()}`)
    }

    return response.json()
  }

  // Delete item
  async function deleteItem (id: string): Promise<void> {
    const response = await fetch(`${config.basePath}/${id}`, {
      method: 'DELETE'
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: `Failed to delete ${config.resourceName.toLowerCase()}` }))
      throw new Error(error.error || `Failed to delete ${config.resourceName.toLowerCase()}`)
    }
  }

  // Hook: Fetch list
  function useList (params: FetchParams) {
    return useQuery({
      queryKey: config.queryKeys.paginated(params),
      queryFn: () => fetchList(params),
      staleTime: 1000 * 60 * 2, // 2 minutes for list data
      placeholderData: keepPreviousData // Keep previous data while fetching new data to prevent flickering
    })
  }

  // Hook: Fetch single
  function useSingle (id: string, enabled = true) {
    return useQuery({
      queryKey: config.queryKeys.detail(id),
      queryFn: () => fetchSingle(id),
      enabled: enabled && !!id,
      staleTime: 1000 * 60 * 5 // 5 minutes for detail data
    })
  }

  // Hook: Create
  function useCreate (options?: { onSuccess?: (data: T) => void }) {
    const queryClient = useQueryClient()
    const router = useRouter()

    return useMutation({
      mutationFn: createItem,
      onSuccess: (data) => {
        // Handle different response formats
        let item: T | undefined
        if ('data' in data) {
          item = (data as SingleResourceResponse<T>).data
        } else {
          const dataRecord = data as unknown as Record<string, T>
          item = dataRecord[config.resourceName.toLowerCase()]
        }
        
        // Invalidate and refetch lists (this will invalidate all paginated queries too)
        // By default, invalidateQueries matches all keys that start with the given key
        queryClient.invalidateQueries({ queryKey: config.queryKeys.lists() })
        
        // Optionally prefetch the new item
        if (item?.id) {
          queryClient.setQueryData(config.queryKeys.detail(item.id), data)
        }
        
        toast.success(`${config.resourceName} created successfully`)
        
        // Navigate to the new item if viewPath is configured
        if (viewPath && item?.id) {
          router.push(`${viewPath}/${item.id}`)
        }
        
        if (item) {
          options?.onSuccess?.(item)
        }
      },
      onError: (error: Error) => {
        toast.error(error.message || `Failed to create ${config.resourceName}`)
      }
    })
  }

  // Hook: Update
  function useUpdate () {
    const queryClient = useQueryClient()

    return useMutation({
      mutationFn: ({ id, data }: { id: string; data: Partial<T> }) => 
        updateItem(id, data),
      onSuccess: (data, variables) => {
        // Update the specific item in cache
        queryClient.setQueryData(config.queryKeys.detail(variables.id), data)
        
        // Invalidate lists to ensure consistency
        queryClient.invalidateQueries({ queryKey: config.queryKeys.lists() })
        
        toast.success(`${config.resourceName} updated successfully`)
      },
      onError: (error: Error) => {
        toast.error(error.message || `Failed to update ${config.resourceName}`)
      }
    })
  }

  // Hook: Delete
  function useDelete (deleteOptions?: { onSuccess?: () => void; redirect?: boolean }) {
    const queryClient = useQueryClient()
    const router = useRouter()

    return useMutation({
      mutationFn: deleteItem,
      onSuccess: (_, deletedId) => {
        // Remove the item from cache
        queryClient.removeQueries({ queryKey: config.queryKeys.detail(deletedId) })
        
        // Invalidate lists to refetch
        queryClient.invalidateQueries({ queryKey: config.queryKeys.lists() })
        
        toast.success(`${config.resourceName} deleted successfully`)
        
        if (deleteOptions?.redirect !== false && listPath) {
          router.push(listPath)
        }
        
        deleteOptions?.onSuccess?.()
      },
      onError: (error: Error) => {
        toast.error(error.message || `Failed to delete ${config.resourceName}`)
      }
    })
  }

  return {
    useList,
    useSingle,
    useCreate,
    useUpdate,
    useDelete,
    // Export fetch functions for direct use if needed
    fetchList,
    fetchSingle,
    createItem,
    updateItem,
    deleteItem
  }
}

