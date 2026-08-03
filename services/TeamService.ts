import { prisma } from '@/lib/prisma'
import { BaseRepository } from './core/BaseRepository'
import { Team, Prisma } from '@prisma/client'
import { checkPermission, getAuthorizedQuery, isAdmin } from '@/utils/rbac-engine'
import { parseFilters } from './core/FilterParser'

class TeamServiceClass extends BaseRepository<
  Team,
  Prisma.TeamCreateInput,
  Prisma.TeamUpdateInput
> {
  constructor() {
    super(prisma.team)
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
    const authWhere = await getAuthorizedQuery(userId, 'TEAM', 'READ')
    
    // Extract filters that are NOT part of the Team model to avoid Prisma validation errors
    const { workspaceId, scope, ...otherFilters } = filters
    const parsedFilters = parseFilters(otherFilters)
    
    const whereClause: Prisma.TeamWhereInput = {
      AND: [
        authWhere,
        parsedFilters,
        ...(workspaceId ? [{
           projects: {
             some: {
               workspaces: {
                 some: {
                   workspaceId: String(workspaceId)
                 }
               }
             }
           }
        }] : []),
        ...(scope === 'member' ? [{
          members: {
            some: {
              userId: userId
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
    const team = await this.findById(id, {
      include: { 
        creator: { select: { id: true, name: true, email: true } },
        projects: true,
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } }
          }
        },
        invitations: {
          where: { isActive: true }
        }
      }
    })
    
    if (!team) return null

    const hasPermission = await checkPermission(userId, 'TEAM', 'READ', {
      teamId: team.id,
      resourceCreatorId: team.creatorId || undefined
    })

    if (!hasPermission) throw new Error('Unauthorized READ on TEAM')

    // Flatten relations for the frontend
    return {
      ...team,
      projectIds: team.projects?.map((p: any) => p.id) || []
    }
  }

  async createWithRBAC(userId: string, data: Prisma.TeamUncheckedCreateInput) {
    const hasPermission = await checkPermission(userId, 'TEAM', 'CREATE')
    
    if (!hasPermission) throw new Error('Unauthorized CREATE on TEAM')

    const { projectIds, ...actualData } = data as any

    const team = await this.create({
      ...actualData,
      creatorId: userId,
      projects: projectIds && Array.isArray(projectIds) ? {
        connect: projectIds.map((id: string) => ({ id }))
      } : undefined
    } as any)
    
    return this.findOneWithRBAC(userId, team.id)
  }

  async updateWithRBAC(userId: string, id: string, data: Prisma.TeamUncheckedUpdateInput) {
    const team = await this.findById(id)
    if (!team) throw new Error('Team not found')

    const hasPermission = await checkPermission(userId, 'TEAM', 'UPDATE', {
      teamId: team.id,
      resourceCreatorId: team.creatorId || undefined
    })

    if (!hasPermission) throw new Error('Unauthorized UPDATE on TEAM')

    // Filter out internal fields
    const { id: _, creatorId: __, projectIds, ...updateData } = data as any

    const finalUpdateData: Prisma.TeamUpdateInput = {
      ...updateData
    }

    if (projectIds && Array.isArray(projectIds)) {
      finalUpdateData.projects = {
        set: projectIds.map((pId: string) => ({ id: pId }))
      }
    }

    await this.update(id, finalUpdateData)
    return this.findOneWithRBAC(userId, id)
  }

  async deleteWithRBAC(userId: string, id: string) {
    const team = await this.findById(id)
    if (!team) throw new Error('Team not found')

    const hasPermission = await checkPermission(userId, 'TEAM', 'DELETE', {
      teamId: team.id,
      resourceCreatorId: team.creatorId || undefined
    })

    if (!hasPermission) throw new Error('Unauthorized DELETE on TEAM')

    return this.delete(id)
  }

  async bulkDeleteWithRBAC(userId: string, ids: string[]) {
    const authWhere = await getAuthorizedQuery(userId, 'TEAM', 'DELETE')
    
    return this.deleteMany({
      id: { in: ids },
      ...authWhere
    })
  }
}

export const TeamService = new TeamServiceClass()
