import type { Session } from 'next-auth'

/**
 * Builds a where clause for database queries based on user role.
 * - Admins can access all resources
 * - Regular users can only access their own resources
 *
 * @param session - NextAuth session object
 * @param userIdField - The field name that contains the user ID (default: 'userId')
 * @returns A where clause object that can be used in Prisma queries
 *
 * @example
 * ```ts
 * const whereClause = buildUserWhereClause(session)
 * const models = await prisma.model.findMany({ where: whereClause })
 * ```
 */
export function buildUserWhereClause (
  session: Session | null,
  userIdField: string = 'userId'
): Record<string, unknown> {
  if (!session?.user?.id) {
    throw new Error('Unauthorized: No session found')
  }

  const isAdmin = session.user.role === 'ADMIN'

  // Admins can access all resources, so we don't filter by userId
  if (isAdmin) {
    return {}
  }

  // Regular users can only access their own resources
  return {
    [userIdField]: session.user.id
  }
}

/**
 * Builds a where clause for database queries with additional filters.
 * Combines user-based access control with custom filters.
 *
 * @param session - NextAuth session object
 * @param additionalFilters - Additional where clause filters to apply
 * @param userIdField - The field name that contains the user ID (default: 'userId')
 * @returns A combined where clause object
 *
 * @example
 * ```ts
 * const whereClause = buildUserWhereClauseWithFilters(session, { isActive: true })
 * const models = await prisma.model.findMany({ where: whereClause })
 * ```
 */
export function buildUserWhereClauseWithFilters (
  session: Session | null,
  additionalFilters: Record<string, unknown> = {},
  userIdField: string = 'userId'
): Record<string, unknown> {
  const userClause = buildUserWhereClause(session, userIdField)

  return {
    ...userClause,
    ...additionalFilters
  }
}

/**
 * Checks if a user has permission to access a specific resource.
 * - Admins can access any resource
 * - Regular users can only access their own resources
 *
 * @param session - NextAuth session object
 * @param resourceUserId - The userId of the resource being accessed
 * @returns true if the user has permission, false otherwise
 */
export function canAccessResource (
  session: Session | null,
  resourceUserId: string
): boolean {
  if (!session?.user?.id) {
    return false
  }

  const isAdmin = session.user.role === 'ADMIN'

  // Admins can access any resource
  if (isAdmin) {
    return true
  }

  // Regular users can only access their own resources
  return session.user.id === resourceUserId
}

/**
 * Gets the user's role from the session.
 *
 * @param session - NextAuth session object
 * @returns 'ADMIN' | 'USER' | null
 */
export function getUserRole (session: Session | null): 'ADMIN' | 'USER' | null {
  if (!session?.user?.role) {
    return null
  }

  return session.user.role as 'ADMIN' | 'USER'
}

/**
 * Checks if the current user is an admin.
 *
 * @param session - NextAuth session object
 * @returns true if the user is an admin, false otherwise
 */
export function isAdmin (session: Session | null): boolean {
  return getUserRole(session) === 'ADMIN'
}

