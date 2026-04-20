import { prisma } from '@/lib/prisma'
import { BaseRepository } from './core/BaseRepository'
import { Role, Prisma } from '@prisma/client'
import { checkPermission } from '@/utils/rbac-engine'

class RoleServiceClass extends BaseRepository<
  Role,
  Prisma.RoleCreateInput,
  Prisma.RoleUpdateInput
> {
  constructor() {
    super(prisma.role)
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
    
    // Check permission - roles are sensitive (ADMIN/MANAGE required)
    const hasPermission = await checkPermission(userId, 'TEAM', 'READ', { teamId })
    if (!hasPermission) throw new Error('Unauthorized READ on ROLE')

    const whereClause: Prisma.RoleWhereInput = {
      ...otherFilters,
      teamId: teamId || null,
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
        permissions: true,
        team: { select: { id: true, name: true } }
      }
    })
  }

  async findOneWithRBAC(userId: string, id: string) {
    const role = await this.findById(id, {
        include: { permissions: true, team: { select: { id: true, name: true } } }
    })
    
    if (!role) return null

    const hasPermission = await checkPermission(userId, 'TEAM', 'READ', {
      teamId: role.teamId || undefined
    })

    if (!hasPermission) throw new Error('Unauthorized READ on ROLE')

    return role
  }

  async createWithRBAC(userId: string, data: Prisma.RoleUncheckedCreateInput) {
    const hasPermission = await checkPermission(userId, 'TEAM', 'UPDATE', { 
        teamId: data.teamId || undefined 
    })
    
    if (!hasPermission) throw new Error('Unauthorized CREATE on ROLE')

    // Sanitize teamId
    const sanitizedTeamId = data.teamId && data.teamId !== '' ? data.teamId : null

    return this.create({
      ...data,
      teamId: sanitizedTeamId
    } as any)
  }

  async updateWithRBAC(userId: string, id: string, data: Prisma.RoleUncheckedUpdateInput) {
    const role = await this.findById(id)
    if (!role) throw new Error('Role not found')

    const hasPermission = await checkPermission(userId, 'TEAM', 'UPDATE', {
      teamId: role.teamId || undefined
    })

    if (!hasPermission) throw new Error('Unauthorized UPDATE on ROLE')

    // Sanitize teamId if present
    const { permissions, ...updateData } = data as any
    if (updateData.teamId === '') updateData.teamId = null

    // If permissions are provided, we need to handle the relational update
    if (permissions && Array.isArray(permissions)) {
      return prisma.$transaction(async (tx) => {
        // 1. Delete all existing permissions for this role
        await tx.permission.deleteMany({
          where: { roleId: id }
        })

        // 2. Create new permissions (only active ones)
        const activePermissions = permissions
          .filter((p: any) => p.isActive !== false)
          .map((p: any) => ({
            resource: p.resource,
            action: p.action,
            scope: p.scope || 'SELF',
            roleId: id,
            isActive: true
          }))

        if (activePermissions.length > 0) {
          await tx.permission.createMany({
            data: activePermissions
          })
        }

        // 3. Update role fields (name, description, etc.)
        return tx.role.update({
          where: { id },
          data: updateData,
          include: { permissions: true }
        })
      })
    }

    return this.update(id, updateData as Prisma.RoleUpdateInput)
  }

  async deleteWithRBAC(userId: string, id: string) {
    const role = await this.findById(id)
    if (!role) throw new Error('Role not found')

    const hasPermission = await checkPermission(userId, 'TEAM', 'DELETE', {
      teamId: role.teamId || undefined
    })

    if (!hasPermission) throw new Error('Unauthorized DELETE on ROLE')

    return this.delete(id)
  }
}

export const RoleService = new RoleServiceClass()
