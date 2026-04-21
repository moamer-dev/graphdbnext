import { prisma } from '@/lib/prisma'
import { BaseRepository } from './core/BaseRepository'
import { Credential, Prisma } from '@prisma/client'
import { checkPermission, getAuthorizedQuery } from '@/utils/rbac-engine'

class CredentialServiceClass extends BaseRepository<
  Credential,
  Prisma.CredentialCreateInput,
  Prisma.CredentialUpdateInput
> {
  constructor() {
    super(prisma.credential)
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

    const authWhere = await getAuthorizedQuery(userId, 'CREDENTIAL', 'READ')
    
    const { workspaceId, ...otherFilters } = filters

    const whereClause: Prisma.CredentialWhereInput = {
      ...authWhere,
      ...otherFilters,
      ...(workspaceId && { workspaceId }),
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
        workspace: { select: { id: true, name: true } }
      }
    })
  }

  async findOneWithRBAC(userId: string, id: string) {
    const credential = await this.findById(id, {
        include: { workspace: { select: { id: true, name: true } } }
    })
    
    if (!credential) return null

    const hasPermission = await checkPermission(userId, 'CREDENTIAL', 'READ', {
      teamId: undefined // Credential is workspace-level, not team-level in current schema
    })

    if (!hasPermission) throw new Error('Unauthorized READ on CREDENTIAL')

    return credential
  }

  async createWithRBAC(userId: string, data: Prisma.CredentialUncheckedCreateInput) {
    const hasPermission = await checkPermission(userId, 'CREDENTIAL', 'CREATE')
    
    if (!hasPermission) throw new Error('Unauthorized CREATE on CREDENTIAL')

    // Sanitize workspaceId
    const sanitizedWorkspaceId = data.workspaceId && data.workspaceId !== '' ? data.workspaceId : null

    return this.create({
      ...data,
      workspaceId: sanitizedWorkspaceId,
      creatorId: userId
    } as any)
  }

  async updateWithRBAC(userId: string, id: string, data: Prisma.CredentialUncheckedUpdateInput) {
    const credential = await this.findById(id)
    if (!credential) throw new Error('Credential not found')

    const hasPermission = await checkPermission(userId, 'CREDENTIAL', 'UPDATE')

    if (!hasPermission) throw new Error('Unauthorized UPDATE on CREDENTIAL')

    // Filter out internal fields and sanitize workspaceId
    const { id: _, ...updateData } = data
    if ('workspaceId' in updateData) {
      updateData.workspaceId = updateData.workspaceId && updateData.workspaceId !== '' ? updateData.workspaceId : null
    }

    return this.update(id, updateData as Prisma.CredentialUpdateInput)
  }

  async deleteWithRBAC(userId: string, id: string) {
    const credential = await this.findById(id)
    if (!credential) throw new Error('Credential not found')

    const hasPermission = await checkPermission(userId, 'CREDENTIAL', 'DELETE')

    if (!hasPermission) throw new Error('Unauthorized DELETE on CREDENTIAL')

    return this.delete(id)
  }
}

export const CredentialService = new CredentialServiceClass()
