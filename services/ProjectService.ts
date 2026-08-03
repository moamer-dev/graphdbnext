import { prisma } from '@/lib/prisma'
import { BaseRepository } from './core/BaseRepository'
import { Project, Prisma } from '@prisma/client'
import { checkPermission, getAuthorizedQuery, isAdmin } from '@/utils/rbac-engine'
import { parseFilters } from './core/FilterParser'

class ProjectServiceClass extends BaseRepository<
  Project,
  Prisma.ProjectCreateInput,
  Prisma.ProjectUpdateInput
> {
  constructor() {
    super(prisma.project)
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

    const { workspaceId, teamId, scope, ...otherFilters } = filters
    const parsedFilters = parseFilters(otherFilters)

    const sanitizeId = (id: any) => (id && typeof id === 'string' && id.trim() !== '' && id !== 'null' && id !== 'undefined') ? id : null
    
    const userIsAdmin = await isAdmin(userId)
    const authWhere = await getAuthorizedQuery(userId, 'PROJECT', 'READ')

    const whereClause: Prisma.ProjectWhereInput = {
      AND: [
        authWhere,
        parsedFilters,
        ...(workspaceId ? [{
          workspaces: {
            some: {
              workspaceId: String(workspaceId)
            }
          }
        }] : []),
        ...(scope === 'member' ? [{
          team: {
            members: {
              some: {
                userId: userId
              }
            }
          }
        }] : []),
        ...(query ? [{
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } }
          ]
        }] : [])
      ]
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
    const project = await this.findById(id, {
      include: { 
        creator: { select: { id: true, name: true, email: true } },
        workspaces: {
          include: {
            workspace: true
          }
        },
        team: {
          include: {
            members: {
              include: {
                user: { select: { id: true, name: true, email: true } }
              }
            },
            invitations: {
              where: { isActive: true }
            }
          }
        }
      }
    })
    
    if (!project) return null

    const hasPermission = await checkPermission(userId, 'PROJECT', 'READ', {
      teamId: project.teamId || undefined,
      resourceCreatorId: project.creatorId || undefined
    })

    if (!hasPermission) throw new Error('Unauthorized READ on PROJECT')

    // Flatten relations for the frontend
    return {
      ...project,
      workspaceIds: project.workspaces?.map((pw: any) => pw.workspaceId) || []
    }
  }

  async createWithRBAC(userId: string, data: Prisma.ProjectUncheckedCreateInput) {
    
    // Sanitize and prepare data
    const sanitizeId = (id: any) => {
      if (!id) return null
      if (typeof id !== 'string') return id
      const trimmed = id.trim()
      if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') return null
      return trimmed
    }
    
    const { workspaceIds, ...actualData } = data as any
    const createData: any = { 
      ...actualData, 
      creatorId: userId,
      teamId: sanitizeId(data.teamId)
    }
    
    if (createData.teamId === null) {
      delete createData.teamId
    }

    if (createData.teamId) {
      const team = await prisma.team.findUnique({ where: { id: createData.teamId } })
      if (!team) {
        delete createData.teamId
      }
    }

    const hasPermission = await checkPermission(userId, 'PROJECT', 'CREATE', { 
        teamId: createData.teamId || undefined 
    })
    
    if (!hasPermission) throw new Error('Unauthorized CREATE on PROJECT')

    // Handle workspace associations if provided
    const workspacesToConnect = Array.isArray(workspaceIds) 
      ? { 
          create: workspaceIds.map((wId: string) => ({
            workspaceId: wId
          }))
        }
      : undefined

    const prismaData = {
      ...createData,
      workspaces: workspacesToConnect
    }

    const createdProject = await this.create(prismaData)
    return this.findOneWithRBAC(userId, createdProject.id)
  }

  async updateWithRBAC(userId: string, id: string, data: Prisma.ProjectUncheckedUpdateInput) {
    const project = await this.findById(id)
    if (!project) throw new Error('Project not found')

    const hasPermission = await checkPermission(userId, 'PROJECT', 'UPDATE', {
      teamId: project.teamId || undefined,
      resourceCreatorId: project.creatorId || undefined
    })

    if (!hasPermission) throw new Error('Unauthorized UPDATE on PROJECT')

    // Filter out internal fields and sanitize teamId
    const sanitizeId = (id: any) => (id && typeof id === 'string' && id.trim() !== '' && id !== 'null' && id !== 'undefined') ? id : null
    
    const { id: _, creatorId: __, workspaceIds, ...updateData } = data as any
    
    const finalUpdateData: Prisma.ProjectUpdateInput = {
      ...updateData
    }

    if ('teamId' in updateData) {
      const sanitizedTeamId = sanitizeId(updateData.teamId)
      finalUpdateData.team = sanitizedTeamId 
        ? { connect: { id: sanitizedTeamId } }
        : { disconnect: true }
      delete (finalUpdateData as any).teamId
    }

    if (workspaceIds && Array.isArray(workspaceIds)) {
      finalUpdateData.workspaces = {
        deleteMany: {},
        create: workspaceIds.map((wId: string) => ({
          workspaceId: wId
        }))
      }
    }

    await this.update(id, finalUpdateData)
    return this.findOneWithRBAC(userId, id)
  }

  async deleteWithRBAC(userId: string, id: string) {
    const project = await this.findById(id)
    if (!project) throw new Error('Project not found')

    const hasPermission = await checkPermission(userId, 'PROJECT', 'DELETE', {
      teamId: project.teamId || undefined,
      resourceCreatorId: project.creatorId || undefined
    })

    if (!hasPermission) throw new Error('Unauthorized DELETE on PROJECT')

    return this.delete(id)
  }

  async bulkDeleteWithRBAC(userId: string, ids: string[]) {
    const authWhere = await getAuthorizedQuery(userId, 'PROJECT', 'DELETE')
    
    return this.deleteMany({
      id: { in: ids },
      ...authWhere
    })
  }
}

export const ProjectService = new ProjectServiceClass()
