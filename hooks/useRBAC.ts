'use client'

import { useSession } from 'next-auth/react'
import { useMemo } from 'react'

export interface Permission {
  resource: string
  action: string
  scope: 'SELF' | 'TEAM' | 'ALL'
  isActive: boolean
}

export function useRBAC() {
  const { data: session } = useSession()
  const permissions = (session?.user as any)?.permissions || []

  const checkPermission = useMemo(() => {
    return (resource: string, action: string, item?: any) => {
      const user = session?.user as any
      if (!user || !user.permissions) return false

      const normalizedResource = resource.toUpperCase()
      const normalizedAction = action.toUpperCase()

      // Admin bypass
      if (user.role === 'ADMIN') return true

      // Find all permissions that match this resource and action (or MANAGE)
      const matches = user.permissions.filter((p: any) => {
        if (!p.resource || !p.action) return false
        
        const pResource = typeof p.resource === 'string' ? p.resource : p.resource?.name
        const pAction = typeof p.action === 'string' ? p.action : p.action?.name
        
        if (!pResource || !pAction) return false

        return (
          pResource.toUpperCase() === normalizedResource && 
          pAction.toUpperCase() === normalizedAction
        )
      })

      if (matches.length === 0) return false

      // 1. ALL scope - Can do anything to any record
      if (matches.some((p: any) => p.scope === 'ALL')) return true

      // If no item provided (e.g., for general UI visibility like "Create" button)
      if (!item) return true

      // 2. TEAM scope
      if (matches.some((p: any) => p.scope === 'TEAM')) {
        return true 
      }

      // 3. SELF scope
      if (matches.some((p: any) => p.scope === 'SELF')) {
        const creatorId = item.creatorId || item.userId || item.authorId || item.ownerId
        return creatorId === user.id
      }

      return false
    }
  }, [session?.user])

  const can = (action: string, resource: string, item?: any) => checkPermission(resource, action, item)

  return {
    permissions,
    checkPermission,
    can,
    isAdmin: (session?.user as any)?.role === 'ADMIN',
    isAuthenticated: !!session?.user
  }
}
