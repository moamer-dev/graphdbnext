import { prisma } from '@/lib/prisma'
import { PermissionResource, PermissionAction, PermissionScope } from '@prisma/client'

export interface UserPermission {
  resource: PermissionResource
  action: PermissionAction
  scope: PermissionScope
}

export async function isAdmin(userId: string): Promise<boolean> {
  const globalRoles = await prisma.userGlobalRole.findMany({
    where: { userId },
    include: { role: true }
  })
  return globalRoles.some(gr => gr.role.name.toUpperCase() === 'ADMIN')
}

/**
 * Aggregates all effective permissions for a user, including Global roles
 * and roles from a specific team context.
 */
export async function getEffectivePermissions(userId: string, teamId?: string): Promise<UserPermission[]> {
  // 1. Fetch Global Roles permissions
  const globalRoles = await prisma.userGlobalRole.findMany({
    where: { userId },
    include: {
      role: {
        include: {
          permissions: {
            where: { isActive: true }
          }
        }
      }
    }
  })

  let permissions: UserPermission[] = globalRoles.flatMap(gr => 
    gr.role.permissions.map(p => ({
      resource: p.resource,
      action: p.action,
      scope: p.scope
    }))
  )

  // 2. Fetch Team Roles permissions
  if (teamId) {
    // Specific team context
    const teamMember = await prisma.teamMember.findUnique({
      where: { userId_teamId: { userId, teamId } },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  where: { isActive: true }
                }
              }
            }
          }
        }
      }
    })

    if (teamMember) {
      const teamPermissions = teamMember.roles.flatMap(tmr => 
        tmr.role.permissions.map(p => ({
          resource: p.resource,
          action: p.action,
          scope: p.scope
        }))
      )
      permissions = [...permissions, ...teamPermissions]
    }
  } else {
    // Aggregation over ALL teams
    const allTeamMemberships = await prisma.teamMember.findMany({
      where: { userId },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  where: { isActive: true }
                }
              }
            }
          }
        }
      }
    })

    const allTeamPermissions = allTeamMemberships.flatMap(tm => 
      tm.roles.flatMap(tmr => 
        tmr.role.permissions.map(p => ({
          resource: p.resource,
          action: p.action,
          scope: p.scope
        }))
      )
    )
    permissions = [...permissions, ...allTeamPermissions]
  }

  // 3. De-duplicate: Keep the most permissive scope for each (resource, action)
  // Priority: ALL > TEAM > SELF
  const permissionMap = new Map<string, UserPermission>()
  
  const scopePriority: Record<PermissionScope, number> = {
    'ALL': 3,
    'TEAM': 2,
    'SELF': 1
  }

  for (const p of permissions) {
    const key = `${p.resource}:${p.action}`
    const existing = permissionMap.get(key)
    
    if (!existing || scopePriority[p.scope] > scopePriority[existing.scope]) {
      permissionMap.set(key, p)
    }
  }

  return Array.from(permissionMap.values())
}

/**
 * Checks if a user has permission to perform an action on a resource.
 */
export async function checkPermission(
  userId: string, 
  resource: PermissionResource, 
  action: PermissionAction, 
  context?: { teamId?: string, resourceCreatorId?: string }
): Promise<boolean> {
  // ADMIN bypass
  if (await isAdmin(userId)) return true

  // Implicit Team Manager check (Team Creator)
  if (context?.teamId) {
    const team = await prisma.team.findUnique({ 
        where: { id: context.teamId }, 
        select: { creatorId: true } 
    })
    if (team?.creatorId === userId) return true
  }

  const permissions = await getEffectivePermissions(userId, context?.teamId)
  
  // Find matching permission
  const perm = permissions.find(p => 
    p.resource === resource && p.action === action
  )
  
  if (!perm) return false

  // CREATE is a binary check - if they have the permission at all, they can create
  if (action === 'CREATE') return true

  // ALL scope matches everything
  if (perm.scope === 'ALL') return true
  
  // TEAM scope matches if context teamId matches
  if (perm.scope === 'TEAM' && context?.teamId) return true
  
  // SELF scope matches if user is the creator
  if (perm.scope === 'SELF' && context?.resourceCreatorId === userId) return true

  return false
}

/**
 * Generates a Prisma 'where' filter for discovery/LIST operations.
 */
export async function getAuthorizedQuery(
  userId: string,
  resource: PermissionResource,
  action: PermissionAction,
  teamId?: string
): Promise<Record<string, any>> {
  // ADMIN bypass
  const userIsAdmin = await isAdmin(userId)
  if (userIsAdmin) return {}

  const permissions = await getEffectivePermissions(userId, teamId)
  const perm = permissions.find(p => 
    p.resource === resource && p.action === action
  )

  if (!perm) return { creatorId: userId } // Implicit ownership fallback

  const myPermissions = await prisma.teamMember.findMany({ 
      where: { userId }, 
      select: { teamId: true } 
  })
  const myTeamIds = myPermissions.map(t => t.teamId)

  if (perm.scope === 'ALL') return {}
  
  if (perm.scope === 'TEAM') {
    if (resource === 'TEAM') {
      return {
        OR: [
          { creatorId: userId },
          { id: { in: myTeamIds } }
        ]
      }
    }
    return {
      OR: [
        { creatorId: userId },
        { teamId: { in: myTeamIds } }
      ]
    }
  }

  if (perm.scope === 'SELF') {
    // Permission conflict resolution: USERs with SELF should still see what they are members of 
    // for foundational resources like TEAM and PROJECT
    if (resource === 'TEAM') {
      return {
        OR: [
          { creatorId: userId },
          { id: { in: myTeamIds } }
        ]
      }
    }
    
    if (resource === 'PROJECT') {
      return {
        OR: [
          { creatorId: userId },
          { teamId: { in: myTeamIds } }
        ]
      }
    }

    return { creatorId: userId }
  }

  return { creatorId: userId }
}
