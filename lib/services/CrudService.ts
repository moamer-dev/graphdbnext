import type { PrismaClient } from '@prisma/client'
import type { Session } from 'next-auth'
import { buildUserWhereClauseWithFilters, isAdmin } from '@/lib/utils/rbac'

export interface CrudOptions {
  modelName: keyof PrismaClient
  userIdField?: string
  includeUserForAdmin?: boolean
  defaultPageSize?: number
  sortableFields?: string[]
  searchableFields?: string[]
  /**
   * Optional field selection for findAll
   * If provided, only these fields will be returned
   * If not provided, all fields are returned
   */
  selectFields?: Record<string, boolean | { select: Record<string, boolean> }>
  /**
   * Optional function to format the data before returning
   * Useful for converting Date objects to strings, etc.
   */
  formatData?: (data: unknown[]) => unknown[]
}

export class CrudService<T extends { id: string } = { id: string }> {
  private prisma: PrismaClient
  protected options: Required<Omit<CrudOptions, 'selectFields' | 'formatData'>> & {
    selectFields?: CrudOptions['selectFields']
    formatData?: CrudOptions['formatData']
  }

  constructor (prisma: PrismaClient, options: CrudOptions) {
    this.prisma = prisma
    this.options = {
      userIdField: options.userIdField || 'userId',
      includeUserForAdmin: options.includeUserForAdmin ?? false,
      defaultPageSize: options.defaultPageSize || 10,
      sortableFields: options.sortableFields || [],
      searchableFields: options.searchableFields || [],
      selectFields: options.selectFields,
      formatData: options.formatData,
      ...options
    }
  }

  /**
   * Get all records with pagination, sorting, and filtering
   */
  async findAll (
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
    const page = params.page || 1
    const pageSize = params.pageSize || this.options.defaultPageSize
    const sortBy = params.sortBy || 'updatedAt'
    const sortOrder = params.sortOrder || 'desc'

    // Build where clause with RBAC
    const whereClause: Record<string, unknown> = buildUserWhereClauseWithFilters(
      session,
      params.filters || {},
      this.options.userIdField
    )

    // Add search across searchable fields
    if (params.search && this.options.searchableFields.length > 0) {
      whereClause.OR = this.options.searchableFields.map((field: string) => ({
        [field]: {
          contains: params.search,
          mode: 'insensitive'
        }
      }))
    }

    const userIsAdmin = isAdmin(session)

    // Get total count
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const model = this.prisma[this.options.modelName] as any
    const total = await model.count({
      where: whereClause
    })

    // Build select object
    let select: Record<string, unknown> | undefined

    // If selectFields is provided, use it
    if (this.options.selectFields) {
      select = { ...this.options.selectFields }
      
      // Add user relation for admins if needed
      if (userIsAdmin && this.options.includeUserForAdmin) {
        select.user = {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
        select[this.options.userIdField] = true
      }
    } else if (userIsAdmin && this.options.includeUserForAdmin) {
      // If no selectFields but need user relation, build select
      select = {
        [this.options.userIdField]: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    }

    // Get paginated results
    const data = await model.findMany({
      where: whereClause,
      orderBy: {
        [sortBy]: sortOrder
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      ...(select && { select })
    })

    // Format data if formatter is provided
    const formattedData = this.options.formatData ? this.options.formatData(data) : data

    return { data: formattedData, total }
  }

  /**
   * Get a single record by ID
   */
  async findOne (
    session: Session | null,
    id: string,
    select?: Record<string, unknown>
  ) {
    const whereClause = buildUserWhereClauseWithFilters(
      session,
      { id },
      this.options.userIdField
    )

    const userIsAdmin = isAdmin(session)

    // Build select object
    let finalSelect: Record<string, unknown> | undefined

    // If selectFields is provided in options, use it
    if (this.options.selectFields) {
      finalSelect = { ...this.options.selectFields }
      
      // Add user relation for admins if needed
      if (userIsAdmin && this.options.includeUserForAdmin) {
        finalSelect.user = {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
        finalSelect[this.options.userIdField] = true
      }
    } else if (userIsAdmin && this.options.includeUserForAdmin) {
      // If no selectFields but need user relation, build select
      finalSelect = {
        [this.options.userIdField]: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    } else if (select) {
      // Use provided select parameter
      finalSelect = select
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const findModel = this.prisma[this.options.modelName] as any

    const record = await findModel.findFirst({
      where: whereClause,
      ...(finalSelect && { select: finalSelect })
    })

    if (!record) {
      return null
    }

    // Format data if formatter is provided
    if (this.options.formatData) {
      return this.options.formatData([record])[0] as T
    }

    return record as T
  }

  /**
   * Create a new record
   */
  async create (
    session: Session | null,
    data: Partial<T> & { [key: string]: unknown }
  ) {
    if (!session?.user?.id) {
      throw new Error('Unauthorized')
    }

    // Ensure userId is set
    const createData = {
      ...data,
      [this.options.userIdField]: session.user.id
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const createModel = this.prisma[this.options.modelName] as any

    const record = await createModel.create({
      data: createData
    })

    return record
  }

  /**
   * Update a record
   */
  async update (
    session: Session | null,
    id: string,
    data: Partial<T>
  ) {
    // Check ownership/access
    const whereClause = buildUserWhereClauseWithFilters(
      session,
      { id },
      this.options.userIdField
    )

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateModel = this.prisma[this.options.modelName] as any

    const existing = await updateModel.findFirst({
      where: whereClause
    })

    if (!existing) {
      throw new Error('Record not found')
    }

    const record = await updateModel.update({
      where: { id },
      data
    })

    return record
  }

  /**
   * Delete a record (soft delete if isActive field exists, otherwise hard delete)
   */
  async delete (
    session: Session | null,
    id: string
  ) {
    // Check ownership/access
    const whereClause = buildUserWhereClauseWithFilters(
      session,
      { id },
      this.options.userIdField
    )

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const deleteModel = this.prisma[this.options.modelName] as any

    const existing = await deleteModel.findFirst({
      where: whereClause
    })

    if (!existing) {
      throw new Error('Record not found')
    }

    // Try soft delete first (if isActive field exists)
    const hasIsActive = 'isActive' in existing
    if (hasIsActive) {
      return await deleteModel.update({
        where: { id },
        data: { isActive: false }
      })
    }

    // Otherwise hard delete
    return await deleteModel.delete({
      where: { id }
    })
  }
}
