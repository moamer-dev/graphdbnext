/**
 * Query Key Factories
 * 
 * Best practice: Centralize all query keys in one place
 * This ensures type safety and prevents typos
 * 
 * Pattern: [resource, ...params] for hierarchical keys
 */

export const queryKeys = {
  // Model queries
  models: {
    all: ['models'] as const,
    lists: () => [...queryKeys.models.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => 
      [...queryKeys.models.lists(), filters] as const,
    details: () => [...queryKeys.models.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.models.details(), id] as const,
    paginated: (params: {
      page: number
      pageSize: number
      sortBy?: string
      sortOrder?: 'asc' | 'desc'
      filters?: Record<string, unknown>
    }) => [...queryKeys.models.lists(), 'paginated', params] as const
  },
  // User queries
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => 
      [...queryKeys.users.lists(), filters] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
      paginated: (params: {
        page: number
        pageSize: number
        sortBy?: string
        sortOrder?: 'asc' | 'desc'
        filters?: Record<string, unknown>
      }) => [...queryKeys.users.lists(), 'paginated', params] as const
    },
    // Query (SavedQuery) queries
    queries: {
      all: ['queries'] as const,
      lists: () => [...queryKeys.queries.all, 'list'] as const,
      list: (filters?: Record<string, unknown>) => 
        [...queryKeys.queries.lists(), filters] as const,
      details: () => [...queryKeys.queries.all, 'detail'] as const,
      detail: (id: string) => [...queryKeys.queries.details(), id] as const,
      paginated: (params: {
        page: number
        pageSize: number
        sortBy?: string
        sortOrder?: 'asc' | 'desc'
        filters?: Record<string, unknown>
      }) => [...queryKeys.queries.lists(), 'paginated', params] as const
    }
  } as const

