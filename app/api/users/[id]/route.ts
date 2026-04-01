import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { userCrudService } from '@/services/server'
import { isAdmin } from '@/utils'
import { getToken } from 'next-auth/jwt'

// GET /api/users/[id] - Get a specific user (admins only)
export async function GET (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only admins can access users
    if (!isAdmin(session)) {
      return NextResponse.json(
        { error: 'Forbidden: Only admins can access users' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Use CrudService for consistent RBAC
    const user = await userCrudService.findOne(session, id)

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ user })
  } catch (error: unknown) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

// PATCH /api/users/[id] - Update a user (admins only)
export async function PATCH (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only admins can update users
    if (!isAdmin(session)) {
      return NextResponse.json(
        { error: 'Forbidden: Only admins can update users' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { name, role, emailVerified } = body

    // Get the current user data before update to check for role changes
    const currentUser = await userCrudService.findOne(session, id)
    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Use CrudService for consistent RBAC and update logic
    const user = await userCrudService.update(session, id, {
      ...(name !== undefined && { name }),
      ...(role && { role }),
      ...(emailVerified !== undefined && { emailVerified: emailVerified ? new Date() : null })
    })

    // Check if role was changed
    const roleChanged = role && currentUser.role !== role
    
    if (roleChanged) {
      // Invalidate the user's session by revoking their tokens
      // This forces them to re-authenticate with their new role
      try {
        const token = await getToken({ 
          req: request, 
          secret: process.env.NEXTAUTH_SECRET 
        })
        
      } catch (error) {
        console.error('Error invalidating user session:', error)
        // Continue with the response even if session invalidation fails
      }
    }

    return NextResponse.json({ 
      user,
      sessionInvalidated: roleChanged 
    })
  } catch (error: unknown) {
    console.error('Error updating user:', error)
    
    // Handle specific errors from CrudService
    if (error instanceof Error) {
      if (error.message === 'Record not found') {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }
      if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

// DELETE /api/users/[id] - Delete a user (admins only)
export async function DELETE (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only admins can delete users
    if (!isAdmin(session)) {
      return NextResponse.json(
        { error: 'Forbidden: Only admins can delete users' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Prevent deleting own account
    if (session.user.id === id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    // Use CrudService for consistent RBAC and delete logic
    await userCrudService.delete(session, id)

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Error deleting user:', error)
    
    // Handle specific errors from CrudService
    if (error instanceof Error) {
      if (error.message === 'Record not found' || error.message === 'User not found') {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }
      if (error.message.includes('Cannot delete your own account')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        )
      }
      if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}
