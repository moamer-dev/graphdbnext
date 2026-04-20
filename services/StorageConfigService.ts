import { prisma } from '@/lib/prisma'
import { BaseRepository } from './core/BaseRepository'
import { StorageConfig, Prisma } from '@prisma/client'
import { checkPermission } from '@/utils/rbac-engine'

class StorageConfigServiceClass extends BaseRepository<
  StorageConfig,
  Prisma.StorageConfigCreateInput,
  Prisma.StorageConfigUpdateInput
> {
  constructor() {
    super(prisma.storageConfig)
  }

  async findAllWithRBAC(userId: string, params: {
    page?: number
    pageSize?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    query?: string
    filters?: Record<string, any>
  }) {
    // Only Global Admins should see storage configs typically
    const hasPermission = await checkPermission(userId, 'TEAM', 'MANAGE')
    if (!hasPermission) throw new Error('Unauthorized READ on STORAGE_CONFIG')

    const {
      page = 1,
      pageSize = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      query
    } = params

    const whereClause: Prisma.StorageConfigWhereInput = {
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
      take: pageSize
    })
  }

  async findOneWithRBAC(userId: string, id: string) {
    const hasPermission = await checkPermission(userId, 'TEAM', 'MANAGE')
    if (!hasPermission) throw new Error('Unauthorized READ on STORAGE_CONFIG')

    return this.findById(id)
  }

  async createWithRBAC(userId: string, data: Prisma.StorageConfigCreateInput) {
    const hasPermission = await checkPermission(userId, 'TEAM', 'MANAGE')
    if (!hasPermission) throw new Error('Unauthorized CREATE on STORAGE_CONFIG')

    return this.create(data)
  }

  async updateWithRBAC(userId: string, id: string, data: Prisma.StorageConfigUpdateInput) {
    const hasPermission = await checkPermission(userId, 'TEAM', 'MANAGE')
    if (!hasPermission) throw new Error('Unauthorized UPDATE on STORAGE_CONFIG')

    return this.update(id, data)
  }

  async deleteWithRBAC(userId: string, id: string) {
    const hasPermission = await checkPermission(userId, 'TEAM', 'MANAGE')
    if (!hasPermission) throw new Error('Unauthorized DELETE on STORAGE_CONFIG')

    return this.delete(id)
  }
}

export const StorageConfigService = new StorageConfigServiceClass()
