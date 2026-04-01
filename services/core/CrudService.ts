import type { PrismaClient } from '@prisma/client'
import type { Session } from 'next-auth'
import { buildUserWhereClauseWithFilters, isAdmin } from '@/utils/rbac'

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
  /**
   * Optional name of the user relation to include for admins
   * Default: 'user'
   */
  userRelationName?: string
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
      userRelationName: options.userRelationName || 'user',
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

    // Pre-process filters: convert string booleans and dates
    const processedFilters: Record<string, any> = { ...(params.filters || {}) }
    Object.keys(processedFilters).forEach(key => {
      const val = processedFilters[key]
      if (typeof val === 'string') {
        // Handle Booleans from URL
        if (val === 'true') processedFilters[key] = true
        else if (val === 'false') processedFilters[key] = false
        // Handle Dates YYYY-MM-DD -> Range for Prisma
        else if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
          const date = new Date(val)
          const nextDay = new Date(date)
          nextDay.setDate(date.getDate() + 1)
          processedFilters[key] = {
            gte: date,
            lt: nextDay
          }
        }
      }
    })

    // Build where clause with RBAC
    const whereClause: Record<string, unknown> = buildUserWhereClauseWithFilters(
      session,
      processedFilters,
      this.options.userIdField
    )

    // Add search across searchable fields (supports nested fields via dot notation like 'user.email')
    if (params.search && this.options.searchableFields.length > 0) {
      whereClause.OR = this.options.searchableFields.map((field: string) => {
        const parts = field.split('.')
        if (parts.length === 1) {
          return {
            [field]: {
              contains: params.search,
              mode: 'insensitive'
            }
          }
        }

        // Handle nested fields: user.email -> { user: { email: { contains: search, mode: 'insensitive' } } }
        let nestedObj: any = {
          contains: params.search,
          mode: 'insensitive'
        }
        
        for (let i = parts.length - 1; i >= 0; i--) {
          nestedObj = { [parts[i]]: nestedObj }
        }
        return nestedObj
      })
    }

    const userIsAdmin = isAdmin(session)

    // Get total count
     
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
        if (userIsAdmin && this.options.includeUserForAdmin && select) {
          const relation = {
            select: {
              id: true,
              email: true,
              name: true
            }
          }
          select[this.options.userRelationName] = relation
          select[this.options.userIdField] = true
        }
      } else if (userIsAdmin && this.options.includeUserForAdmin) {
        // If no selectFields but need user relation, build select
        select = {
          [this.options.userIdField]: true,
          [this.options.userRelationName]: {
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
      if (userIsAdmin && this.options.includeUserForAdmin && finalSelect) {
        const relation = {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
        finalSelect[this.options.userRelationName] = relation
        finalSelect[this.options.userIdField] = true
      }
    } else if (userIsAdmin && this.options.includeUserForAdmin) {
      // If no selectFields but need user relation, build select
      finalSelect = {
        [this.options.userIdField]: true,
        [this.options.userRelationName]: {
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

    const deleteModel = this.prisma[this.options.modelName] as any

    const existing = await deleteModel.findFirst({
      where: whereClause
    })

    if (!existing) {
      throw new Error('Record not found')
    }

    // Hard delete
    return await deleteModel.delete({
      where: { id }
    })
  }

  /**
   * Delete multiple records
   */
  async deleteMany (
    session: Session | null,
    ids: string[]
  ) {
    if (!ids || ids.length === 0) return { count: 0 }

    // Check ownership/access for all IDs
    const whereClause = buildUserWhereClauseWithFilters(
      session,
      { id: { in: ids } },
      this.options.userIdField
    )

    const deleteModel = this.prisma[this.options.modelName] as any

    // Hard delete many
    return await deleteModel.deleteMany({
      where: whereClause
    })
  }
}
