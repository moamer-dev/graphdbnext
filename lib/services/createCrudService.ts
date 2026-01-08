import { prisma } from '@/lib/prisma'
import { CrudService, type CrudOptions } from './CrudService'
import { buildUserWhereClauseWithFilters, isAdmin } from '@/lib/utils/rbac'
import type { Session } from 'next-auth'

/**
 * Generic CRUD Service Factory
 * 
 * Creates a CRUD service for any Prisma model without needing
 * a separate service file for each model.
 * 
 * Usage:
 * ```typescript
 * export const userCrudService = createCrudService({
 *   modelName: 'user',
 *   userIdField: 'id', // Special case for User model
 *   sortableFields: ['email', 'name', 'role', 'createdAt'],
 *   searchableFields: ['email', 'name'],
 *   selectFields: {
 *     id: true,
 *     email: true,
 *     name: true,
 *     // ... exclude password
 *   }
 * })
 * ```
 */
export interface CrudServiceConfig {
  modelName: keyof typeof prisma
  userIdField?: string
  includeUserForAdmin?: boolean
  defaultPageSize?: number
  sortableFields?: string[]
  searchableFields?: string[]
  selectFields?: Record<string, boolean>
  formatData?: (data: unknown[]) => unknown[]
  // Optional: Custom access control
  checkAccess?: (session: Session | null) => void | Promise<void>
}

export function createCrudService<T extends { id: string }>(
  config: CrudServiceConfig
) {
  const options: CrudOptions = {
    modelName: config.modelName,
    userIdField: config.userIdField || 'userId',
    includeUserForAdmin: config.includeUserForAdmin ?? false,
    defaultPageSize: config.defaultPageSize || 10,
    sortableFields: config.sortableFields || [],
    searchableFields: config.searchableFields || []
  }

  class GenericCrudService extends CrudService<T> {
    constructor() {
      // Pass formatData and selectFields to base class through options
      // The base CrudService will use these automatically
      const baseOptions = {
        ...options,
        selectFields: config.selectFields,
        formatData: config.formatData
      }
      super(prisma, baseOptions)
    }

    // Override findAll to add custom access control
    async findAll(
      session: Session | null,
      params: {
        page?: number
        pageSize?: number
        sortBy?: string
        sortOrder?: 'asc' | 'desc'
        filters?: Record<string, unknown>
        search?: string
      } = {}
    ) {
      // Check custom access control
      if (config.checkAccess) {
        await config.checkAccess(session)
      }

      // Base class will use selectFields and formatData from options
      return super.findAll(session, params)
    }

    // Override findOne to add custom access control and use selectFields
    async findOne(session: Session | null, id: string) {
      // Check custom access control
      if (config.checkAccess) {
        await config.checkAccess(session)
      }

      // If selectFields is provided, we need to override to use it
      // because base CrudService.findOne doesn't use selectFields from options
      if (config.selectFields) {
        const whereClause = buildUserWhereClauseWithFilters(
          session,
          { id },
          this.options.userIdField
        )

        // Build select object with user relation for admins
        const userIsAdmin = isAdmin(session)
        const select: Record<string, unknown> = { ...config.selectFields }
        
        // Add user relation for admins if configured
        if (userIsAdmin && config.includeUserForAdmin) {
          select.user = {
            select: {
              id: true,
              email: true,
              name: true
            }
          }
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const findModel = (prisma as any)[this.options.modelName]
        const record = await findModel.findFirst({
          where: whereClause,
          select
        })

        if (!record) {
          return null
        }

        // Format data if formatter is provided
        if (config.formatData) {
          return config.formatData([record])[0] as T
        }

        return record as T
      }

      // Base class will use formatData from options if no selectFields
      return super.findOne(session, id)
    }

    // Override update if custom access control is needed
    async update(session: Session | null, id: string, data: Partial<T>) {
      // Check custom access control
      if (config.checkAccess) {
        await config.checkAccess(session)
      }

      return super.update(session, id, data)
    }

    // Override delete if custom access control is needed
    async delete(session: Session | null, id: string) {
      // Check custom access control
      if (config.checkAccess) {
        await config.checkAccess(session)
      }

      return super.delete(session, id)
    }
  }

  return new GenericCrudService()
}

