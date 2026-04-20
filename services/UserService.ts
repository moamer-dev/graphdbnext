import { prisma } from '@/lib/prisma'
import { BaseRepository } from './core/BaseRepository'
import { User, Prisma } from '@prisma/client'
import { checkPermission } from '@/utils/rbac-engine'
import bcrypt from 'bcryptjs'

class UserServiceClass extends BaseRepository<
  User,
  Prisma.UserCreateInput,
  Prisma.UserUpdateInput
> {
  constructor() {
    super(prisma.user)
  }

  async findAllWithRBAC(userId: string, params: {
    page?: number
    pageSize?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    query?: string
    filters?: Record<string, any>
  }) {
    // Only Global Admins should see the full user list typically
    const hasPermission = await checkPermission(userId, 'TEAM', 'MANAGE')
    if (!hasPermission) throw new Error('Unauthorized READ on USER')

    const {
      page = 1,
      pageSize = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      query,
      filters = {}
    } = params

    const whereClause: Prisma.UserWhereInput = {
      ...filters,
      ...(query && {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } }
        ]
      })
    }

    return this.findAll({
      where: whereClause,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
          id: true,
          email: true,
          name: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
      }
    })
  }

  async findOneWithRBAC(userId: string, id: string) {
    // User can see themselves, or admin can see anyone
    if (userId !== id) {
        const hasPermission = await checkPermission(userId, 'TEAM', 'MANAGE')
        if (!hasPermission) throw new Error('Unauthorized READ on USER')
    }

    return this.findById(id, {
        include: {
            globalRoles: { include: { role: true } },
            createdTeams: true,
            createdProjects: true,
            createdWorkspaces: true,
            models: true,
            savedQueries: true,
            teamMembers: {
                include: { team: true }
            }
        }
    })
  }

  // Create usually happens via Auth/Signup, but for Admin creation:
  async createWithRBAC(userId: string, data: Prisma.UserCreateInput) {
    const hasPermission = await checkPermission(userId, 'TEAM', 'MANAGE')
    if (!hasPermission) throw new Error('Unauthorized CREATE on USER')

    return this.create(data)
  }

  async updateWithRBAC(userId: string, id: string, data: any) {
    // User can update themselves, or admin can update anyone
    if (userId !== id) {
        const hasPermission = await checkPermission(userId, 'TEAM', 'MANAGE')
        if (!hasPermission) throw new Error('Unauthorized UPDATE on USER')
    }

    const { role, password, ...updateData } = data

    if (password) {
        const salt = await bcrypt.genSalt(10)
        updateData.password = await bcrypt.hash(password, salt)
    }
    if (role) {
        const roleRecord = await prisma.role.findFirst({
            where: { name: role, teamId: null } // Global role
        })
        
        if (roleRecord) {
            await prisma.userGlobalRole.deleteMany({
                where: { userId: id }
            })
            
            await prisma.userGlobalRole.create({
                data: {
                    userId: id,
                    roleId: roleRecord.id
                }
            })
        }
    }

    return this.update(id, updateData)
  }

  async deleteWithRBAC(userId: string, id: string) {
    const hasPermission = await checkPermission(userId, 'TEAM', 'MANAGE')
    if (!hasPermission) throw new Error('Unauthorized DELETE on USER')

    return this.delete(id)
  }
}

export const UserService = new UserServiceClass()
