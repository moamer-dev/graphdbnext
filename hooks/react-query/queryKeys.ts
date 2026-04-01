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
  // Teams queries
  teams: {
    all: ['teams'] as const,
    lists: () => [...queryKeys.teams.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => 
      [...queryKeys.teams.lists(), filters] as const,
    details: () => [...queryKeys.teams.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.teams.details(), id] as const,
    paginated: (params: {
      page: number
      pageSize: number
      sortBy?: string
      sortOrder?: 'asc' | 'desc'
      filters?: Record<string, unknown>
    }) => [...queryKeys.teams.lists(), 'paginated', params] as const
  },
  // Projects queries
  projects: {
    all: ['projects'] as const,
    lists: () => [...queryKeys.projects.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => 
      [...queryKeys.projects.lists(), filters] as const,
    details: () => [...queryKeys.projects.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.projects.details(), id] as const,
    paginated: (params: {
      page: number
      pageSize: number
      sortBy?: string
      sortOrder?: 'asc' | 'desc'
      filters?: Record<string, unknown>
    }) => [...queryKeys.projects.lists(), 'paginated', params] as const
  },
  // Workspaces queries
  workspaces: {
    all: ['workspaces'] as const,
    lists: () => [...queryKeys.workspaces.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => 
      [...queryKeys.workspaces.lists(), filters] as const,
    details: () => [...queryKeys.workspaces.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.workspaces.details(), id] as const,
    paginated: (params: {
      page: number
      pageSize: number
      sortBy?: string
      sortOrder?: 'asc' | 'desc'
      filters?: Record<string, unknown>
    }) => [...queryKeys.workspaces.lists(), 'paginated', params] as const
  },
  // Team Members queries
  teamMembers: {
    all: ['teamMembers'] as const,
    lists: () => [...queryKeys.teamMembers.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => 
      [...queryKeys.teamMembers.lists(), filters] as const,
    details: () => [...queryKeys.teamMembers.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.teamMembers.details(), id] as const,
    paginated: (params: {
      page: number
      pageSize: number
      sortBy?: string
      sortOrder?: 'asc' | 'desc'
      filters?: Record<string, unknown>
    }) => [...queryKeys.teamMembers.lists(), 'paginated', params] as const
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
  },
  // Storage queries
  storageConfigs: {
    all: ['storageConfigs'] as const,
    lists: () => [...queryKeys.storageConfigs.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => 
      [...queryKeys.storageConfigs.lists(), filters] as const,
    details: () => [...queryKeys.storageConfigs.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.storageConfigs.details(), id] as const,
    paginated: (params: {
      page: number
      pageSize: number
      sortBy?: string
      sortOrder?: 'asc' | 'desc'
      filters?: Record<string, unknown>
    }) => [...queryKeys.storageConfigs.lists(), 'paginated', params] as const
  },
  // RBAC queries
  roles: {
    all: ['roles'] as const,
    lists: () => [...queryKeys.roles.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => 
      [...queryKeys.roles.lists(), filters] as const,
    details: () => [...queryKeys.roles.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.roles.details(), id] as const,
    paginated: (params: {
      page: number
      pageSize: number
      sortBy?: string
      sortOrder?: 'asc' | 'desc'
      filters?: Record<string, unknown>
    }) => [...queryKeys.roles.lists(), 'paginated', params] as const
  },
  // Data Sources queries
  dataSources: {
    all: ['dataSources'] as const,
    lists: () => [...queryKeys.dataSources.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => 
      [...queryKeys.dataSources.lists(), filters] as const,
    details: () => [...queryKeys.dataSources.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.dataSources.details(), id] as const,
    paginated: (params: {
      page: number
      pageSize: number
      sortBy?: string
      sortOrder?: 'asc' | 'desc'
      filters?: Record<string, unknown>
    }) => [...queryKeys.dataSources.lists(), 'paginated', params] as const
  }
} as const

