import { prisma } from '@/lib/prisma'
import { BaseRepository } from './core/BaseRepository'
import { TeamMember, Prisma } from '@prisma/client'
import { checkPermission, getAuthorizedQuery } from '@/utils/rbac-engine'

class TeamMemberServiceClass extends BaseRepository<
  TeamMember,
  Prisma.TeamMemberCreateInput,
  Prisma.TeamMemberUpdateInput
> {
  constructor() {
    super(prisma.teamMember)
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

    const { teamId, ...otherFilters } = filters
    
    // Check READ permission on TEAM or specific team
    const hasPermission = await checkPermission(userId, 'TEAM', 'READ', { teamId })
    if (!hasPermission) throw new Error('Unauthorized READ on TEAM_MEMBER')

    const whereClause: Prisma.TeamMemberWhereInput = {
      ...otherFilters,
      ...(teamId && { teamId }),
      ...(query && {
        user: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } }
          ]
        }
      })
    }

    return this.findAll({
      where: whereClause,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: { select: { id: true, name: true, email: true } },
        team: { select: { id: true, name: true } },
        roles: { include: { role: true } }
      }
    })
  }

  async findOneWithRBAC(userId: string, id: string) {
    const member = await this.findById(id, {
        include: { 
            user: { select: { id: true, name: true, email: true } },
            team: { select: { id: true, name: true } },
            roles: { include: { role: true } }
        }
    })
    
    if (!member) return null

    const hasPermission = await checkPermission(userId, 'TEAM', 'READ', {
      teamId: member.teamId
    })

    if (!hasPermission) throw new Error('Unauthorized READ on TEAM_MEMBER')

    return member
  }

  async createWithRBAC(userId: string, data: Prisma.TeamMemberUncheckedCreateInput) {
    const hasPermission = await checkPermission(userId, 'TEAM', 'UPDATE', { 
        teamId: data.teamId 
    })
    
    if (!hasPermission) throw new Error('Unauthorized to add members to TEAM')

    return this.create(data as any)
  }

  async updateWithRBAC(userId: string, id: string, data: Prisma.TeamMemberUncheckedUpdateInput) {
    const member = await this.findById(id)
    if (!member) throw new Error('TeamMember not found')

    const hasPermission = await checkPermission(userId, 'TEAM', 'UPDATE', {
      teamId: member.teamId
    })

    if (!hasPermission) throw new Error('Unauthorized UPDATE on TEAM_MEMBER')

    // Filter out internal fields
    const { id: _, userId: __, teamId: ___, ...updateData } = data

    return this.update(id, updateData as Prisma.TeamMemberUpdateInput)
  }

  async deleteWithRBAC(userId: string, id: string) {
    const member = await this.findById(id)
    if (!member) throw new Error('TeamMember not found')

    const hasPermission = await checkPermission(userId, 'TEAM', 'UPDATE', {
      teamId: member.teamId
    })

    if (!hasPermission) throw new Error('Unauthorized to remove members from TEAM')

    return this.delete(id)
  }
}

export const TeamMemberService = new TeamMemberServiceClass()
