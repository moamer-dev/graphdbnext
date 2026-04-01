import { createCrudService } from './core/createCrudService'
import { isAdmin } from '@/utils/rbac'
import type { User } from '@/resources/UserResource'
import type { Model } from '@/resources/ModelResource'
import type { SavedQuery } from '@/resources/SavedQueryResource'
import type { Team } from '@/resources/TeamResource'
import type { Project } from '@/resources/ProjectResource'
import type { Workspace } from '@/resources/WorkspaceResource'
import type { Session } from 'next-auth'

/**
 * User CRUD Service
 */
export const userCrudService = createCrudService<User>({
  modelName: 'user' as any,
  userIdField: 'id',
  includeUserForAdmin: false,
  defaultPageSize: 10,
  sortableFields: ['email', 'name', 'role', 'createdAt'],
  searchableFields: ['email', 'name'],
  selectFields: {
    id: true,
    email: true,
    name: true,
    role: true,
    emailVerified: true,
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
        emailVerified: record.emailVerified instanceof Date ? record.emailVerified.toISOString() : record.emailVerified
      }
    })
  },
  checkAccess: async (session: Session | null) => {
    if (!isAdmin(session)) {
      throw new Error('Unauthorized: Only admins can access users')
    }
  }
})

/**
 * Model CRUD Service
 */
export const modelCrudService = createCrudService<Model>({
  modelName: 'model' as any,
  userIdField: 'userId',
  includeUserForAdmin: true,
  defaultPageSize: 10,
  sortableFields: ['name', 'version', 'createdAt', 'updatedAt'],
  searchableFields: ['name', 'description', 'version', 'user.name', 'user.email'],
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
  formatData: (data: unknown[]) => {
    return data.map((item) => {
      const record = item as Record<string, unknown>
      let noteCount = 0
      let relationCount = 0
      if (record.schemaJson && typeof record.schemaJson === 'object') {
        const schema = record.schemaJson as Record<string, unknown>
        if (schema.nodes && typeof schema.nodes === 'object') {
          noteCount = Object.keys(schema.nodes).length
        }
        if (schema.relations && typeof schema.relations === 'object') {
          relationCount = Object.keys(schema.relations).length
        }
      }
      return {
        ...record,
        noteCount,
        relationCount,
        createdAt: record.createdAt instanceof Date ? record.createdAt.toISOString() : record.createdAt,
        updatedAt: record.updatedAt instanceof Date ? record.updatedAt.toISOString() : record.updatedAt
      }
    })
  }
})

/**
 * SavedQuery CRUD Service
 */
export const savedQueryCrudService = createCrudService<SavedQuery>({
  modelName: 'savedQuery' as any,
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

/**
 * Team CRUD Service
 */
export const teamCrudService = createCrudService<Team>({
  modelName: 'team' as any,
  userIdField: 'creatorId',
  userRelationName: 'creator',
  includeUserForAdmin: true,
  defaultPageSize: 10,
  sortableFields: ['name', 'isActive', 'createdAt', 'updatedAt'],
  searchableFields: ['name', 'description'],
  selectFields: {
    id: true,
    name: true,
    description: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
    creatorId: true
  },
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
 * Project CRUD Service
 */
export const projectCrudService = createCrudService<Project>({
  modelName: 'project' as any,
  userIdField: 'creatorId',
  userRelationName: 'creator',
  includeUserForAdmin: true,
  defaultPageSize: 10,
  sortableFields: ['name', 'isActive', 'createdAt', 'updatedAt'],
  searchableFields: ['name', 'description'],
  selectFields: {
    id: true,
    name: true,
    description: true,
    isActive: true,
    teamId: true,
    createdAt: true,
    updatedAt: true,
    creatorId: true
  },
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
 * Workspace CRUD Service
 */
export const workspaceCrudService = createCrudService<Workspace>({
  modelName: 'workspace' as any,
  userIdField: 'creatorId',
  userRelationName: 'creator',
  includeUserForAdmin: true,
  defaultPageSize: 10,
  sortableFields: ['name', 'isActive', 'createdAt', 'updatedAt'],
  searchableFields: ['name', 'description'],
  selectFields: {
    id: true,
    name: true,
    description: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
    creatorId: true
  },
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
