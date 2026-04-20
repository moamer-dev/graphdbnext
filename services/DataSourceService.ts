import { prisma } from '@/lib/prisma'
import { BaseRepository } from './core/BaseRepository'
import { DataSource, Prisma, DataSourceType } from '@prisma/client'
import { checkPermission, getAuthorizedQuery, isAdmin } from '@/utils/rbac-engine'

class DataSourceServiceClass extends BaseRepository<
  DataSource,
  Prisma.DataSourceCreateInput,
  Prisma.DataSourceUpdateInput
> {
  constructor() {
    super(prisma.dataSource)
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
    const authWhere = await getAuthorizedQuery(userId, 'DATA_SOURCE', 'READ')
    
    const { workspaceId, ...otherFilters } = filters
    
    const whereClause: Prisma.DataSourceWhereInput = {
      ...authWhere,
      ...otherFilters,
      ...(!userIsAdmin && sanitizeId(workspaceId) && {
        workspaceId: sanitizeId(workspaceId) as string
      }),
      ...(query && {
        OR: [
          { name: { contains: query, mode: 'insensitive' } }
        ]
      })
    }

    return this.findAll({
      where: whereClause,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        workspace: { select: { id: true, name: true } }
      }
    })
  }

  async findOneWithRBAC(userId: string, id: string) {
    const dataSource = await this.findById(id, {
        include: { workspace: { select: { id: true, name: true } } }
    })
    
    if (!dataSource) return null

    const hasPermission = await checkPermission(userId, 'DATA_SOURCE', 'READ', {
      resourceCreatorId: dataSource.creatorId || undefined
    })

    if (!hasPermission) throw new Error('Unauthorized READ on DATA_SOURCE')

    return dataSource
  }

  async createWithRBAC(userId: string, data: Prisma.DataSourceUncheckedCreateInput) {
    const hasPermission = await checkPermission(userId, 'DATA_SOURCE', 'CREATE')
    
    if (!hasPermission) throw new Error('Unauthorized CREATE on DATA_SOURCE')

    // Sanitize workspaceId
    const sanitizedWorkspaceId = data.workspaceId && data.workspaceId !== '' ? data.workspaceId : null

    return this.create({
      ...data,
      workspaceId: sanitizedWorkspaceId,
      creatorId: userId
    } as any)
  }

  async updateWithRBAC(userId: string, id: string, data: Prisma.DataSourceUncheckedUpdateInput) {
    const dataSource = await this.findById(id)
    if (!dataSource) throw new Error('DataSource not found')

    const hasPermission = await checkPermission(userId, 'DATA_SOURCE', 'UPDATE', {
      resourceCreatorId: dataSource.creatorId || undefined
    })

    if (!hasPermission) throw new Error('Unauthorized UPDATE on DATA_SOURCE')

    // Filter out internal fields and sanitize workspaceId
    const { id: _, creatorId: __, ...updateData } = data
    if ('workspaceId' in updateData) {
      updateData.workspaceId = updateData.workspaceId && updateData.workspaceId !== '' ? updateData.workspaceId : null
    }

    return this.update(id, updateData as Prisma.DataSourceUpdateInput)
  }

  async deleteWithRBAC(userId: string, id: string) {
    const dataSource = await this.findById(id)
    if (!dataSource) throw new Error('DataSource not found')

    const hasPermission = await checkPermission(userId, 'DATA_SOURCE', 'DELETE', {
      resourceCreatorId: dataSource.creatorId || undefined
    })

    if (!hasPermission) throw new Error('Unauthorized DELETE on DATA_SOURCE')

    return this.delete(id)
  }
}

export const DataSourceService = new DataSourceServiceClass()
