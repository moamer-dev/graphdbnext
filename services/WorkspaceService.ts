import { prisma } from '@/lib/prisma'
import { BaseRepository } from './core/BaseRepository'
import { Workspace, Prisma } from '@prisma/client'
import { checkPermission, getAuthorizedQuery, isAdmin } from '@/utils/rbac-engine'
import { parseFilters } from './core/FilterParser'

class WorkspaceServiceClass extends BaseRepository<
  Workspace,
  Prisma.WorkspaceCreateInput,
  Prisma.WorkspaceUpdateInput
> {
  constructor() {
    super(prisma.workspace)
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
    const authWhere = await getAuthorizedQuery(userId, 'WORKSPACE', 'READ')
    
    const { projectId, ...otherFilters } = filters
    const parsedFilters = parseFilters(otherFilters)
    
    const whereClause: Prisma.WorkspaceWhereInput = {
      ...authWhere,
      ...parsedFilters,
      ...(sanitizeId(projectId) && !userIsAdmin ? {
        OR: [
          { projects: { some: { projectId: sanitizeId(projectId) as string } } },
          { creatorId: userId }
        ]
      } : {}),
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
        creator: { select: { id: true, name: true, email: true } }
      }
    })
  }

  async findOneWithRBAC(userId: string, id: string) {
    const workspace = await this.findById(id, {
      include: { 
        creator: { select: { id: true, name: true, email: true } },
        projects: {
          include: {
            project: true
          }
        }
      }
    })
    
    if (!workspace) return null

    const hasPermission = await checkPermission(userId, 'WORKSPACE', 'READ', {
      resourceCreatorId: workspace.creatorId || undefined
    })

    if (!hasPermission) throw new Error('Unauthorized READ on WORKSPACE')

    // Flatten relations for the frontend
    return {
      ...workspace,
      projectIds: workspace.projects?.map((pw: any) => pw.projectId) || []
    }
  }

  async createWithRBAC(userId: string, data: Prisma.WorkspaceUncheckedCreateInput) {
    const hasPermission = await checkPermission(userId, 'WORKSPACE', 'CREATE')
    
    if (!hasPermission) throw new Error('Unauthorized CREATE on WORKSPACE')

    const { projectIds, ...actualData } = data as any

    const workspace = await this.create({
      ...actualData,
      creatorId: userId,
      projects: projectIds && Array.isArray(projectIds) ? {
        create: projectIds.map((id: string) => ({
          projectId: id
        }))
      } : undefined
    } as any)

    return this.findOneWithRBAC(userId, workspace.id)
  }

  async updateWithRBAC(userId: string, id: string, data: Prisma.WorkspaceUncheckedUpdateInput) {
    const workspace = await this.findById(id)
    if (!workspace) throw new Error('Workspace not found')

    const hasPermission = await checkPermission(userId, 'WORKSPACE', 'UPDATE', {
      resourceCreatorId: workspace.creatorId || undefined
    })

    if (!hasPermission) throw new Error('Unauthorized UPDATE on WORKSPACE')

    // Filter out internal fields
    const sanitizeId = (id: any) => (id && typeof id === 'string' && id.trim() !== '' && id !== 'null' && id !== 'undefined') ? id : null
    const { id: _, creatorId: __, projectIds, ...updateData } = data as any

    const finalUpdateData: Prisma.WorkspaceUpdateInput = {
      ...updateData
    }

    if (projectIds && Array.isArray(projectIds)) {
      finalUpdateData.projects = {
        deleteMany: {},
        create: projectIds.map((pId: string) => ({
          projectId: pId
        }))
      }
    }

    await this.update(id, finalUpdateData)
    return this.findOneWithRBAC(userId, id)
  }

  async deleteWithRBAC(userId: string, id: string) {
    const workspace = await this.findById(id)
    if (!workspace) throw new Error('Workspace not found')

    const hasPermission = await checkPermission(userId, 'WORKSPACE', 'DELETE', {
      resourceCreatorId: workspace.creatorId || undefined
    })

    if (!hasPermission) throw new Error('Unauthorized DELETE on WORKSPACE')

    return this.delete(id)
  }

  async bulkDeleteWithRBAC(userId: string, ids: string[]) {
    const authWhere = await getAuthorizedQuery(userId, 'WORKSPACE', 'DELETE')
    
    return this.deleteMany({
      id: { in: ids },
      ...authWhere
    })
  }
}

export const WorkspaceService = new WorkspaceServiceClass()
