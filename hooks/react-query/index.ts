/**
 * Centralized Resource Hooks Export
 * 
 * All resource hooks are generated from the generic factory.
 * This eliminates the need for separate hook files per model.
 * 
 * Usage in pages:
 * ```typescript
 * const { config, data, total, loading } = useResourceTable({
 *   resource: UserResource,
 *   useList: resourceHooks.users.useList,
 *   useDelete: resourceHooks.users.useDelete,
 *   isAdmin
 * })
 * ```
 */

import { createResourceHooks } from './useResource'
import { queryKeys } from './queryKeys'
export { queryKeys } from './queryKeys'
export { queryClient } from './queryClient'
import { UserResource } from '@/resources/UserResource'
import { ModelResource } from '@/resources/ModelResource'
import { SavedQueryResource } from '@/resources/SavedQueryResource'
import { StorageConfigResource } from '@/resources/StorageConfigResource'
import { RoleResource } from '@/resources/RBACResource'
import { TeamResource } from '@/resources/TeamResource'
import { ProjectResource } from '@/resources/ProjectResource'
import { WorkspaceResource } from '@/resources/WorkspaceResource'
import { DataSourceResource } from '@/resources/DataSourceResource'
import type { User } from '@/resources/UserResource'
import type { Model } from '@/resources/ModelResource'
import type { SavedQuery } from '@/resources/SavedQueryResource'
import type { StorageConfig } from '@/resources/StorageConfigResource'
import type { Role, Permission } from '@/resources/RBACResource'

/**
 * All resource hooks in one place
 * Add new resources here - no separate files needed!
 */
export const resourceHooks = {
  users: createResourceHooks<User>({
    resourceName: 'User',
    basePath: UserResource.BASE_PATH,
    viewPath: UserResource.VIEW_PATH,
    listPath: UserResource.LIST_PATH,
    queryKeys: queryKeys.users
  }),
  
  models: createResourceHooks<Model>({
    resourceName: 'Model',
    basePath: ModelResource.BASE_PATH,
    viewPath: ModelResource.VIEW_PATH,
    listPath: ModelResource.LIST_PATH,
    workspaceScoped: true,
    queryKeys: queryKeys.models
  }),

  dataSources: createResourceHooks<any>({
    resourceName: 'DataSource',
    basePath: '/api/data-sources',
    workspaceScoped: true,
    queryKeys: (queryKeys as any).dataSources
  }),
  
  queries: createResourceHooks<SavedQuery>({
    resourceName: 'SavedQuery',
    basePath: SavedQueryResource.BASE_PATH,
    viewPath: SavedQueryResource.VIEW_PATH,
    listPath: SavedQueryResource.LIST_PATH,
    queryKeys: queryKeys.queries
  }),
  
  storageConfigs: createResourceHooks<StorageConfig>({
    resourceName: 'StorageConfig',
    basePath: StorageConfigResource.BASE_PATH,
    viewPath: StorageConfigResource.VIEW_PATH,
    listPath: StorageConfigResource.LIST_PATH,
    queryKeys: queryKeys.storageConfigs
  }),

  roles: createResourceHooks<Role>({
    resourceName: 'Role',
    basePath: RoleResource.BASE_PATH,
    viewPath: RoleResource.VIEW_PATH,
    listPath: RoleResource.LIST_PATH,
    queryKeys: queryKeys.roles
  }),

  teams: createResourceHooks<any>({
    resourceName: 'Team',
    basePath: '/api/teams',
    queryKeys: queryKeys.teams
  }),

  projects: createResourceHooks<any>({
    resourceName: 'Project',
    basePath: '/api/projects',
    queryKeys: queryKeys.projects
  }),

  workspaces: createResourceHooks<any>({
    resourceName: 'Workspace',
    basePath: '/api/workspaces',
    queryKeys: queryKeys.workspaces
  })
}

// Re-export types for convenience
export type { User } from '@/resources/UserResource'
export type { Model } from '@/resources/ModelResource'
export type { SavedQuery } from '@/resources/SavedQueryResource'
export type { StorageConfig } from '@/resources/StorageConfigResource'
export type { Role, Permission } from '@/resources/RBACResource'

// Re-export the factory for advanced usage
export { createResourceHooks } from './useResource'
export type { ResourceConfig, ResourceResponse, SingleResourceResponse } from './useResource'
