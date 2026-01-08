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
import { queryKeys } from '../queryKeys'
import { UserResource } from '@/lib/resources/UserResource'
import { ModelResource } from '@/lib/resources/ModelResource'
import { SavedQueryResource } from '@/lib/resources/SavedQueryResource'
import type { User } from '@/lib/resources/UserResource'
import type { Model } from '@/lib/resources/ModelResource'
import type { SavedQuery } from '@/lib/resources/SavedQueryResource'

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
    queryKeys: queryKeys.models
  }),
  
  queries: createResourceHooks<SavedQuery>({
    resourceName: 'SavedQuery',
    basePath: SavedQueryResource.BASE_PATH,
    viewPath: SavedQueryResource.VIEW_PATH,
    listPath: SavedQueryResource.LIST_PATH,
    queryKeys: queryKeys.queries
  })
  
  // Add more resources here as needed:
  // newResource: createResourceHooks<NewResource>({ ... })
}

// Re-export types for convenience
export type { User } from '@/lib/resources/UserResource'
export type { Model } from '@/lib/resources/ModelResource'
export type { SavedQuery } from '@/lib/resources/SavedQueryResource'

// Re-export the factory for advanced usage
export { createResourceHooks } from './useResource'
export type { ResourceConfig, ResourceResponse, SingleResourceResponse } from './useResource'

