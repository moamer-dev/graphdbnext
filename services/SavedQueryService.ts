import { prisma } from '@/lib/prisma'
import { BaseRepository } from './core/BaseRepository'
import { SavedQuery, Prisma } from '@prisma/client'
import { checkPermission, getAuthorizedQuery } from '@/utils/rbac-engine'

class SavedQueryServiceClass extends BaseRepository<
  SavedQuery,
  Prisma.SavedQueryCreateInput,
  Prisma.SavedQueryUpdateInput
> {
  constructor() {
    super(prisma.savedQuery)
  }

  async findAllWithRBAC(userId: string, params: {
    page?: number
    pageSize?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    query?: string
    filters?: Record<string, any>
  }) {
    const {
      page = 1,
      pageSize = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      query,
      filters = {}
    } = params

    const authWhere = await getAuthorizedQuery(userId, 'SAVED_QUERY', 'READ')
    
    const whereClause: Prisma.SavedQueryWhereInput = {
      ...authWhere,
      ...filters,
      ...(query && {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } }
        ]
      })
    }

    return this.findAll({
      where: whereClause,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        creator: { select: { id: true, name: true } }
      }
    })
  }

  async findOneWithRBAC(userId: string, id: string) {
    const savedQuery = await this.findById(id, {
        include: { 
            creator: { select: { id: true, name: true } }
        }
    })
    
    if (!savedQuery) return null

    const hasPermission = await checkPermission(userId, 'SAVED_QUERY', 'READ', {
      resourceCreatorId: savedQuery.creatorId || undefined
    })

    if (!hasPermission) throw new Error('Unauthorized READ on SAVED_QUERY')

    return savedQuery
  }

  async createWithRBAC(userId: string, data: Prisma.SavedQueryUncheckedCreateInput) {
    const hasPermission = await checkPermission(userId, 'SAVED_QUERY', 'CREATE')
    
    if (!hasPermission) throw new Error('Unauthorized CREATE on SAVED_QUERY')

    return this.create({
      ...data,
      creatorId: userId
    } as any)
  }

  async updateWithRBAC(userId: string, id: string, data: Prisma.SavedQueryUncheckedUpdateInput) {
    const savedQuery = await this.findById(id)
    if (!savedQuery) throw new Error('SavedQuery not found')

    const hasPermission = await checkPermission(userId, 'SAVED_QUERY', 'UPDATE', {
      resourceCreatorId: savedQuery.creatorId || undefined
    })

    if (!hasPermission) throw new Error('Unauthorized UPDATE on SAVED_QUERY')

    // Filter out internal fields
    const { id: _, creatorId: __, ...updateData } = data

    return this.update(id, updateData as Prisma.SavedQueryUpdateInput)
  }

  async deleteWithRBAC(userId: string, id: string) {
    const savedQuery = await this.findById(id)
    if (!savedQuery) throw new Error('SavedQuery not found')

    const hasPermission = await checkPermission(userId, 'SAVED_QUERY', 'DELETE', {
      resourceCreatorId: savedQuery.creatorId || undefined
    })

    if (!hasPermission) throw new Error('Unauthorized DELETE on SAVED_QUERY')

    return this.delete(id)
  }
}

export const SavedQueryService = new SavedQueryServiceClass()
