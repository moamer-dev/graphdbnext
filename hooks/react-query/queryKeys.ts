/**
 * Query Key Factories
 * 
 * Centralizes all query keys in one place.
 * Instead of manual definitions per resource, we use a dynamic factory.
 */

export interface ResourceQueryKeys {
  all: readonly unknown[]
  lists: () => readonly unknown[]
  list: (filters?: Record<string, unknown>) => readonly unknown[]
  details: () => readonly unknown[]
  detail: (id: string) => readonly unknown[]
  paginated: (params: {
    page: number
    pageSize: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    filters?: Record<string, unknown>
  }) => readonly unknown[]
}

/**
 * Creates a standard set of query keys for a resource
 */
export function createQueryKeyFactory(resource: string): ResourceQueryKeys {
  const all = [resource] as const
  const lists = () => [...all, 'list'] as const
  const details = () => [...all, 'detail'] as const

  return {
    all,
    lists,
    list: (filters?: Record<string, unknown>) => [...lists(), filters] as const,
    details,
    detail: (id: string) => [...details(), id] as const,
    paginated: (params: any) => [...lists(), 'paginated', params] as const
  }
}

/**
 * Dynamic queryKeys accessor using Proxy
 * 
 * Usage: queryKeys.users.all -> ['users']
 * Automatically generates keys for any resource name accessed.
 */
export const queryKeys = new Proxy({} as Record<string, ResourceQueryKeys>, {
  get(target, prop: string) {
    if (prop === '$$typeof') return undefined // Handle React/Internal checks
    
    if (!target[prop]) {
      target[prop] = createQueryKeyFactory(prop)
    }
    return target[prop]
  }
})
