/**
 * Centralized Services Export
 * 
 * All services are exported from here for easy access throughout the application.
 */

import { createCrudService } from './createCrudService'
import { isAdmin } from '@/lib/utils/rbac'
import type { User } from '@/lib/resources/UserResource'
import type { Model } from '@/lib/resources/ModelResource'
import type { SavedQuery } from '@/lib/resources/SavedQueryResource'
import type { Session } from 'next-auth'

export { SchemaExplorerService } from './SchemaExplorerService'
export { ExportService } from './ExportService'
export { GraphExportService } from './GraphExportService'
export { GraphAnalyticsService } from './GraphAnalyticsService'
export { GraphComparisonService } from './GraphComparisonService'
export { CustomVisualizationService } from './CustomVisualizationService'
export { CollaborativeService } from './CollaborativeService'
export { AIService } from './AIService'

/**
 * User CRUD Service
 * Only admins can access users.
 */
export const userCrudService = createCrudService<User>({
  modelName: 'user',
  userIdField: 'id', // Users don't have userId, use id for RBAC
  includeUserForAdmin: false,
  defaultPageSize: 10,
  sortableFields: ['email', 'name', 'role', 'createdAt'],
  searchableFields: ['email', 'name'],
  // Exclude password from responses
  selectFields: {
    id: true,
    email: true,
    name: true,
    role: true,
    emailVerified: true,
    createdAt: true,
    updatedAt: true
  },
  // Format dates to strings
  formatData: (data: unknown[]) => {
    return data.map((item) => {
      const record = item as Record<string, unknown>
      return {
        ...record,
        createdAt: record.createdAt instanceof Date ? record.createdAt.toISOString() : record.createdAt,
        updatedAt: record.updatedAt instanceof Date ? record.updatedAt.toISOString() : record.updatedAt,
        emailVerified: record.emailVerified instanceof Date ? record.emailVerified.toISOString() : record.emailVerified
      }
    })
  },
  // Only admins can access users
  checkAccess: async (session: Session | null) => {
    if (!isAdmin(session)) {
      throw new Error('Unauthorized: Only admins can access users')
    }
  }
})

/**
 * Model CRUD Service
 * Admins see all models, users see only their own.
 * Includes user relation for admins.
 */
export { moduleService } from './ModuleService'

export const modelCrudService = createCrudService<Model>({
  modelName: 'model',
  userIdField: 'userId',
  includeUserForAdmin: true,
  defaultPageSize: 10,
  sortableFields: ['name', 'version', 'createdAt', 'updatedAt'],
  searchableFields: ['name', 'description', 'version'],
  // Model-specific field selection
  selectFields: {
    id: true,
    name: true,
    description: true,
    version: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
    userId: true,
    schemaJson: true,
    schemaMd: true
  },
  // Format Date objects to strings
  formatData: (data: unknown[]) => {
    return data.map((item) => {
      const record = item as Record<string, unknown>
      return {
        ...record,
        createdAt: record.createdAt instanceof Date ? record.createdAt.toISOString() : record.createdAt,
        updatedAt: record.updatedAt instanceof Date ? record.updatedAt.toISOString() : record.updatedAt
      }
    })
  }
})

/**
 * SavedQuery CRUD Service
 * Users see only their own queries.
 */
export const savedQueryCrudService = createCrudService<SavedQuery>({
  modelName: 'savedQuery',
  userIdField: 'userId',
  includeUserForAdmin: false,
  defaultPageSize: 50,
  sortableFields: ['name', 'category', 'source', 'executionCount', 'createdAt'],
  searchableFields: ['name', 'description', 'query', 'category'],
  selectFields: {
    id: true,
    name: true,
    description: true,
    query: true,
    category: true,
    tags: true,
    source: true,
    userId: true,
    executedAt: true,
    executionCount: true,
    createdAt: true,
    updatedAt: true
  },
  formatData: (data: unknown[]) => {
    return data.map((item) => {
      const record = item as Record<string, unknown>
      return {
        ...record,
        createdAt: record.createdAt instanceof Date ? record.createdAt.toISOString() : record.createdAt,
        updatedAt: record.updatedAt instanceof Date ? record.updatedAt.toISOString() : record.updatedAt,
        executedAt: record.executedAt instanceof Date ? record.executedAt.toISOString() : record.executedAt
      }
    })
  }
})

// Note: The base CrudService handles user relations for admins automatically
// when includeUserForAdmin is true, so we don't need custom logic here.

