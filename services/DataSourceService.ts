import { prisma } from '@/lib/prisma'
import { BaseRepository } from './core/BaseRepository'
import { DataSource, Prisma } from '@prisma/client'
import { checkPermission, getAuthorizedQuery, isAdmin } from '@/utils/rbac-engine'
import { UniversalStorageService } from './UniversalStorageService'

const sanitizeId = (id: any) => (id && typeof id === 'string' && id.trim() !== '' && id !== 'null' && id !== 'undefined') ? id : null

class DataSourceServiceClass extends BaseRepository<
  DataSource,
  Prisma.DataSourceCreateInput,
  Prisma.DataSourceUpdateInput
> {
  constructor() {
    super(prisma.dataSource)
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
    const authWhere = await getAuthorizedQuery(userId, 'DATA_SOURCE', 'READ')
    
    const { workspaceId, isGlobalScope, ...otherFilters } = filters
    const isGlobal = isGlobalScope === 'true' || isGlobalScope === true
    
    // 1. Start with RBAC authorization (usually { creatorId: userId } for SELF scope)
    const whereClause: Prisma.DataSourceWhereInput = {
      ...(userIsAdmin ? {} : authWhere), // Admins see everything
      ...otherFilters
    }

    // 2. Apply Workspace filtering only if NOT admin and NOT in global scope
    if (!userIsAdmin && !isGlobal && sanitizeId(workspaceId)) {
        whereClause.workspaceId = sanitizeId(workspaceId) as string
    }

    if (query) {
      whereClause.OR = [
          { name: { contains: query, mode: 'insensitive' } }
      ]
    }

    return this.findAll({
      where: whereClause,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        workspace: { select: { id: true, name: true } },
        creator: { select: { id: true, name: true, email: true } }
      }
    })
  }

  async findOneWithRBAC(userId: string, id: string) {
    const dataSource = await this.findById(id, {
        include: { 
            workspace: { select: { id: true, name: true } },
            creator: { select: { id: true, name: true, email: true } }
        }
    })
    
    if (!dataSource) return null

    const hasPermission = await checkPermission(userId, 'DATA_SOURCE', 'READ', {
      resourceCreatorId: dataSource.creatorId || undefined
    })

    if (!hasPermission) throw new Error('Unauthorized READ on DATA_SOURCE')

    return dataSource
  }

  async createWithRBAC(userId: string, data: Prisma.DataSourceUncheckedCreateInput) {
    const hasPermission = await checkPermission(userId, 'DATA_SOURCE', 'CREATE')
    
    if (!hasPermission) throw new Error('Unauthorized CREATE on DATA_SOURCE')

    // Sanitize workspaceId
    const sanitizedWorkspaceId = sanitizeId(data.workspaceId)
    
    // Check if workspace actually exists to avoid P2003
    let verifiedWorkspaceId = null
    if (sanitizedWorkspaceId) {
        const workspace = await prisma.workspace.findUnique({ where: { id: sanitizedWorkspaceId } })
        if (workspace) {
            verifiedWorkspaceId = sanitizedWorkspaceId
        } else {
            console.warn(`DataSource creation: Workspace ${sanitizedWorkspaceId} not found. Falling back to personal scope.`)
        }
    }

    // SMART ROUTING: Determine the best storage provider based on file metadata
    let storageConfigId = data.storageConfigId
    
    // Calculate size if not provided
    const calculatedSize = data.content ? Buffer.byteLength(data.content as string) : 
                           data.jsonContent ? Buffer.byteLength(JSON.stringify(data.jsonContent)) : 0

    if (!storageConfigId) {
      // Fetch all active storage configurations to find a match
      const configs = await prisma.storageConfig.findMany({
        where: { isActive: true },
        orderBy: { isDefault: 'desc' } // Check default last as fallback if needed, but we prefer a matched rule
      })

      // Try to find a config with matching rules
      for (const config of configs) {
        const rules = (config.config as any)?.routingRules
        if (rules) {
          const { minSize, maxSize, allowedTypes } = rules
          const matchesSize = (!minSize || calculatedSize >= minSize) && (!maxSize || calculatedSize <= maxSize)
          const matchesType = !allowedTypes || allowedTypes.includes(data.type)

          if (matchesSize && matchesType) {
            storageConfigId = config.id
            break
          }
        }
      }

      // Fallback to default if no rule matched
      if (!storageConfigId) {
        const defaultConfig = configs.find(c => c.isDefault)
        storageConfigId = defaultConfig?.id || configs[0]?.id
      }
    }

    // Calculate size
    const contentToStore = data.content as string || (data.jsonContent ? JSON.stringify(data.jsonContent) : '')
    const size = Buffer.byteLength(contentToStore)

    // INITIALIZE FINAL PAYLOAD
    let finalPayload: any = {
      ...data,
      workspaceId: verifiedWorkspaceId,
      creatorId: userId,
      storageConfigId: storageConfigId as string | undefined,
      size
    }

    // PERFORM PHYSICAL UPLOAD IF NOT DATABASE STORAGE
    if (storageConfigId) {
      const selectedConfig = await prisma.storageConfig.findUnique({ where: { id: storageConfigId } })
      
      if (selectedConfig && selectedConfig.type !== 'DATABASE') {
        try {
          const fileUrl = await UniversalStorageService.upload(
            storageConfigId, 
            data.name, 
            contentToStore
          )
          
          // Update payload for external storage: store URL and CLEAR database content
          finalPayload = {
            ...finalPayload,
            fileUrl,
            content: null,
            jsonContent: null
          }
        } catch (error) {
          console.error(`Physical storage upload failed for ${selectedConfig.type}:`, error)
          // Fallback: If upload fails, keep it in DB but maybe mark it or log it
          // For now, let's allow it to fall back to DB to avoid losing data
        }
      }
    }

    return this.create(finalPayload)
  }

  async updateWithRBAC(userId: string, id: string, data: Prisma.DataSourceUncheckedUpdateInput) {
    const dataSource = await this.findById(id)
    if (!dataSource) throw new Error('DataSource not found')

    const hasPermission = await checkPermission(userId, 'DATA_SOURCE', 'UPDATE', {
      resourceCreatorId: dataSource.creatorId || undefined
    })

    if (!hasPermission) throw new Error('Unauthorized UPDATE on DATA_SOURCE')

    // Filter out internal fields and sanitize workspaceId
    const { id: _, creatorId: __, ...updateData } = data
    if ('workspaceId' in updateData) {
      updateData.workspaceId = sanitizeId(updateData.workspaceId)
    }

    return this.update(id, updateData as Prisma.DataSourceUpdateInput)
  }

  async deleteWithRBAC(userId: string, id: string) {
    const dataSource = await this.findById(id)
    if (!dataSource) throw new Error('DataSource not found')

    const hasPermission = await checkPermission(userId, 'DATA_SOURCE', 'DELETE', {
      resourceCreatorId: dataSource.creatorId || undefined
    })

    if (!hasPermission) throw new Error('Unauthorized DELETE on DATA_SOURCE')

    return this.delete(id)
  }
}

export const DataSourceService = new DataSourceServiceClass()
