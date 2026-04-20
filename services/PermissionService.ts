import { prisma } from '@/lib/prisma'
import { BaseRepository } from './core/BaseRepository'
import { Permission, Prisma } from '@prisma/client'
import { checkPermission, getAuthorizedQuery } from '@/utils/rbac-engine'

class PermissionServiceClass extends BaseRepository<
  Permission,
  Prisma.PermissionCreateInput,
  Prisma.PermissionUpdateInput
> {
  constructor() {
    super(prisma.permission)
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

    const { roleId, ...otherFilters } = filters
    
    // Check permission - permissions are extremely sensitive
    // We check if the user can MANAGE teams or if they are a global admin
    const hasPermission = await checkPermission(userId, 'TEAM', 'MANAGE')
    if (!hasPermission) throw new Error('Unauthorized READ on PERMISSION')

    const whereClause: Prisma.PermissionWhereInput = {
      ...otherFilters,
      ...(roleId && { roleId }),
    }

    return this.findAll({
      where: whereClause,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        role: { select: { id: true, name: true, teamId: true } }
      }
    })
  }

  async findOneWithRBAC(userId: string, id: string) {
    const permission = await this.findById(id, {
        include: { role: { select: { id: true, name: true, teamId: true } } }
    })
    
    if (!permission) return null

    const hasPermission = await checkPermission(userId, 'TEAM', 'MANAGE')

    if (!hasPermission) throw new Error('Unauthorized READ on PERMISSION')

    return permission
  }

  async createWithRBAC(userId: string, data: Prisma.PermissionUncheckedCreateInput) {
    const hasPermission = await checkPermission(userId, 'TEAM', 'MANAGE')
    
    if (!hasPermission) throw new Error('Unauthorized CREATE on PERMISSION')

    return this.create(data as any)
  }

  async updateWithRBAC(userId: string, id: string, data: Prisma.PermissionUncheckedUpdateInput) {
    const hasPermission = await checkPermission(userId, 'TEAM', 'MANAGE')

    if (!hasPermission) throw new Error('Unauthorized UPDATE on PERMISSION')

    // Filter out internal fields
    const { id: _, roleId: __, ...updateData } = data

    return this.update(id, updateData as Prisma.PermissionUpdateInput)
  }

  async deleteWithRBAC(userId: string, id: string) {
    const hasPermission = await checkPermission(userId, 'TEAM', 'MANAGE')

    if (!hasPermission) throw new Error('Unauthorized DELETE on PERMISSION')

    return this.delete(id)
  }
}

export const PermissionService = new PermissionServiceClass()
