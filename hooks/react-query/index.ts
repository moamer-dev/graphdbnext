/**
 * Centralized Resource Hooks Accessor
 * 
 * Instead of manual hook definitions, we use a dynamic Proxy.
 * This generates hooks on-the-fly based on Resource metadata.
 */

import { createResourceHooks } from './useResource'
import { queryKeys } from './queryKeys'
import * as Resources from '@/resources'

// Resource Registry for Hook Generation
const resources: Record<string, any> = {}

// Populate registry dynamically from @/resources
Object.entries(Resources).forEach(([name, exportItem]: [string, any]) => {
  if (name.endsWith('Resource')) {
    const baseName = name.replace('Resource', '')
    
    // Mapping model name to its collection name (plural)
    // Most resources follow: Model -> models, SavedQuery -> savedQueries
    const collectionName = baseName.charAt(0).toLowerCase() + baseName.slice(1) + 
                           (baseName.endsWith('y') ? 'ies' : 's')
    
    // Explicit overrides for irregular plurals
    const overrides: Record<string, string> = {
      'User': 'users',
      'Team': 'teams',
      'Project': 'projects',
      'Model': 'models',
      'Workspace': 'workspaces',
      'DataSource': 'dataSources',
      'SavedQuery': 'queries',
      'RBAC': 'roles' // RBACResource exports Role types
    }
    
    const key = overrides[baseName] || collectionName
    resources[key] = exportItem
  }
})

/**
 * Dynamic resourceHooks Proxy
 * 
 * Usage: resourceHooks.users.useList(...)
 * 1. Checks if hooks are already cached.
 * 2. If not, looks up the Resource metadata.
 * 3. Generates hooks using createResourceHooks factory.
 */
export const resourceHooks = new Proxy({} as any, {
  get(target, prop: string) {
    if (prop === '$$typeof') return undefined
    
    if (!target[prop]) {
      const resource = resources[prop]
      
      // Fallback configuration if resource is not explicitly registered
      const config = {
        resourceName: resource?.RESOURCE_NAME || resource?.resourceName || prop.charAt(0).toUpperCase() + prop.slice(1, -1),
        basePath: resource?.BASE_PATH || `/api/r/${prop.slice(0, -1)}`,
        viewPath: resource?.VIEW_PATH,
        listPath: resource?.LIST_PATH,
        workspaceScoped: resource?.HOOK_CONFIG?.workspaceScoped ?? false,
        queryKeys: queryKeys[prop]
      }
      
      target[prop] = createResourceHooks<any>(config)
    }
    
    return target[prop]
  }
})

// Re-export common types and utilities
export { queryKeys } from './queryKeys'
export { queryClient } from './queryClient'
export { createResourceHooks } from './useResource'
export type { ResourceConfig, ResourceResponse, SingleResourceResponse } from './useResource'

// Bulk type and resource exports
export * from '@/resources'
