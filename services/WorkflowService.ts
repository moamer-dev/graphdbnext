import { prisma } from '@/lib/prisma'
import { BaseRepository } from './core/BaseRepository'
import { Workflow, Prisma } from '@prisma/client'
import { checkPermission, getAuthorizedQuery } from '@/utils/rbac-engine'

class WorkflowServiceClass extends BaseRepository<
  Workflow,
  Prisma.WorkflowCreateInput,
  Prisma.WorkflowUpdateInput
> {
  constructor() {
    super(prisma.workflow)
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

    const authWhere = await getAuthorizedQuery(userId, 'WORKFLOW', 'READ')
    
    const { modelId, ...otherFilters } = filters

    const whereClause: Prisma.WorkflowWhereInput = {
      ...authWhere,
      ...otherFilters,
      ...(modelId && { modelId }),
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
        model: { select: { id: true, name: true } }
      }
    })
  }

  async findOneWithRBAC(userId: string, id: string) {
    const workflow = await this.findById(id, {
        include: { model: { select: { id: true, name: true } } }
    })
    
    if (!workflow) return null

    const hasPermission = await checkPermission(userId, 'WORKFLOW', 'READ', {
      resourceCreatorId: workflow.creatorId || undefined
    })

    if (!hasPermission) throw new Error('Unauthorized READ on WORKFLOW')

    return workflow
  }

  async createWithRBAC(userId: string, data: Prisma.WorkflowUncheckedCreateInput) {
    const hasPermission = await checkPermission(userId, 'WORKFLOW', 'CREATE')
    
    if (!hasPermission) throw new Error('Unauthorized CREATE on WORKFLOW')

    return this.create({
      ...data,
      creatorId: userId
    } as any)
  }

  async updateWithRBAC(userId: string, id: string, data: Prisma.WorkflowUncheckedUpdateInput) {
    const workflow = await this.findById(id)
    if (!workflow) throw new Error('Workflow not found')

    const hasPermission = await checkPermission(userId, 'WORKFLOW', 'UPDATE', {
      resourceCreatorId: workflow.creatorId || undefined
    })

    if (!hasPermission) throw new Error('Unauthorized UPDATE on WORKFLOW')

    // Filter out internal fields
    const { id: _, creatorId: __, ...updateData } = data

    return this.update(id, updateData as Prisma.WorkflowUpdateInput)
  }

  async deleteWithRBAC(userId: string, id: string) {
    const workflow = await this.findById(id)
    if (!workflow) throw new Error('Workflow not found')

    const hasPermission = await checkPermission(userId, 'WORKFLOW', 'DELETE', {
      resourceCreatorId: workflow.creatorId || undefined
    })

    if (!hasPermission) throw new Error('Unauthorized DELETE on WORKFLOW')

    return this.delete(id)
  }
}

export const WorkflowService = new WorkflowServiceClass()
