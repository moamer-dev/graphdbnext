import { prisma } from '@/lib/prisma'
import { BaseRepository } from './core/BaseRepository'
import { Model, Prisma } from '@prisma/client'
import { checkPermission, getAuthorizedQuery, isAdmin } from '@/utils/rbac-engine'
import { parseFilters } from './core/FilterParser'

class ModelServiceClass extends BaseRepository<
  Model,
  Prisma.ModelCreateInput,
  Prisma.ModelUpdateInput
> {
  constructor() {
    super(prisma.model)
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

    const sanitizeId = (id: any) => (id && typeof id === 'string' && id.trim() !== '' && id !== 'null' && id !== 'undefined') ? id : null
    
    const userIsAdmin = await isAdmin(userId)
    const authWhere = await getAuthorizedQuery(userId, 'MODEL', 'READ')
    
    const { workspaceId, ...otherFilters } = filters
    const parsedFilters = parseFilters(otherFilters)
    
    const whereClause: Prisma.ModelWhereInput = {
      ...authWhere,
      ...parsedFilters,
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
        workspace: { select: { id: true, name: true } },
        creator: { select: { id: true, name: true } }
      }
    })
  }

  async findOneWithRBAC(userId: string, id: string) {
    const model = await this.findById(id, {
        include: { 
            workspace: { select: { id: true, name: true } },
            creator: { select: { id: true, name: true } }
        }
    })
    
    if (!model) return null

    const hasPermission = await checkPermission(userId, 'MODEL', 'READ', {
      resourceCreatorId: model.creatorId || undefined
    })

    if (!hasPermission) throw new Error('Unauthorized READ on MODEL')

    return model
  }

  async createWithRBAC(userId: string, data: Prisma.ModelUncheckedCreateInput) {
    const hasPermission = await checkPermission(userId, 'MODEL', 'CREATE')
    
    if (!hasPermission) throw new Error('Unauthorized CREATE on MODEL')

    const sanitizeId = (id: any) => (id && typeof id === 'string' && id.trim() !== '' && id !== 'null' && id !== 'undefined') ? id : null
    const createData: any = {
      ...data,
      workspaceId: sanitizeId(data.workspaceId),
      creatorId: userId
    }

    if (createData.workspaceId === null) {
      delete createData.workspaceId
    }

    const createdModel = await this.create(createData)
    return this.findOneWithRBAC(userId, createdModel.id)
  }

  async updateWithRBAC(userId: string, id: string, data: Prisma.ModelUncheckedUpdateInput) {
    const model = await this.findById(id)
    if (!model) throw new Error('Model not found')

    const hasPermission = await checkPermission(userId, 'MODEL', 'UPDATE', {
      resourceCreatorId: model.creatorId || undefined
    })

    if (!hasPermission) throw new Error('Unauthorized UPDATE on MODEL')

    // Filter out internal fields and sanitize workspaceId
    const sanitizeId = (id: any) => (id && typeof id === 'string' && id.trim() !== '' && id !== 'null' && id !== 'undefined') ? id : null
    
    const { id: _, creatorId: __, ...updateData } = data as any
    if ('workspaceId' in updateData) {
      updateData.workspaceId = sanitizeId(updateData.workspaceId)
      if (updateData.workspaceId === null) {
        delete updateData.workspaceId
      }
    }

    await this.update(id, updateData as Prisma.ModelUpdateInput)
    return this.findOneWithRBAC(userId, id)
  }

  async deleteWithRBAC(userId: string, id: string) {
    const model = await this.findById(id)
    if (!model) throw new Error('Model not found')

    const hasPermission = await checkPermission(userId, 'MODEL', 'DELETE', {
      resourceCreatorId: model.creatorId || undefined
    })

    if (!hasPermission) throw new Error('Unauthorized DELETE on MODEL')

    return this.delete(id)
  }
}

export const ModelService = new ModelServiceClass()
