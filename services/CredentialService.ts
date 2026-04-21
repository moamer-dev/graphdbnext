import { prisma } from '@/lib/prisma'
import { BaseRepository } from './core/BaseRepository'
import { Credential, Prisma } from '@prisma/client'
import { checkPermission, getAuthorizedQuery, isAdmin } from '@/utils/rbac-engine'
import { encryptJson, decryptJson } from '@/lib/encryption'

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

    const userIsAdmin = await isAdmin(userId)
    const authWhere = await getAuthorizedQuery(userId, 'CREDENTIAL', 'READ')
    
    // Handle workspaceId filter (Scope)
    const { workspaceId, isGlobalScope, scope: _scope, ...otherFilters } = filters
    const isGlobal = isGlobalScope === 'true' || isGlobalScope === true || _scope === 'global'

    const andConditions: Prisma.CredentialWhereInput[] = [userIsAdmin ? {} : authWhere]

    if (Object.keys(otherFilters).length > 0) {
      andConditions.push(otherFilters)
    }

    if (!isGlobal) {
      const sanitizedWorkspaceId = workspaceId === 'null' || workspaceId === 'undefined' ? null : workspaceId
      
      if (sanitizedWorkspaceId === 'true') {
        andConditions.push({ workspaceId: { not: null } })
      } else if (sanitizedWorkspaceId === 'false' || sanitizedWorkspaceId === null) {
        andConditions.push({ workspaceId: null })
      } else if (sanitizedWorkspaceId) {
        // Active Workspace + Personal
        andConditions.push({
          OR: [
            { workspaceId: sanitizedWorkspaceId }, 
            { workspaceId: null }
          ]
        })
      }
    }

    if (query) {
      andConditions.push({
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } }
        ]
      })
    }

    const whereClause: Prisma.CredentialWhereInput = {
      AND: andConditions
    }

    // console.log('Credentials Fetch - User:', userId, 'Where:', JSON.stringify(whereClause, null, 2))

    const result = await this.findAll({
      where: whereClause,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        workspace: { select: { id: true, name: true } }
      }
    })

    // Decrypt data for each credential
    if (result.data) {
      result.data = result.data.map((cred: Credential) => ({
        ...cred,
        data: typeof cred.data === 'string' ? decryptJson(cred.data) : cred.data
      })) as any
    }

    return result
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

    // Decrypt data
    return {
      ...credential,
      data: typeof credential.data === 'string' ? decryptJson(credential.data) : credential.data
    }
  }

  async createWithRBAC(userId: string, data: Prisma.CredentialUncheckedCreateInput) {
    const hasPermission = await checkPermission(userId, 'CREDENTIAL', 'CREATE')
    
    if (!hasPermission) throw new Error('Unauthorized CREATE on CREDENTIAL')

    // Sanitize workspaceId
    const sanitizedWorkspaceId = data.workspaceId && data.workspaceId !== '' ? data.workspaceId : null

    // Encrypt data
    const encryptedData = encryptJson(data.data)

    return this.create({
      ...data,
      workspaceId: sanitizedWorkspaceId,
      creatorId: userId,
      data: encryptedData
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

    // Encrypt data if provided
    if (updateData.data) {
      updateData.data = encryptJson(updateData.data)
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
