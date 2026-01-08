import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { userCrudService } from '@/lib/services'
import { isAdmin } from '@/lib/utils/rbac'

// GET /api/users - Get all users (admins only)
export async function GET (request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10)
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'
    
    // Build filters from query params - extract all params except pagination/sorting
    const filters: Record<string, unknown> = {}
    const excludeParams = ['page', 'pageSize', 'sortBy', 'sortOrder', 'search']
    
    searchParams.forEach((value, key) => {
      if (!excludeParams.includes(key) && value) {
        filters[key] = value
      }
    })

    // Use CrudService for consistent pagination
    const result = await userCrudService.findAll(session, {
      page,
      pageSize,
      sortBy,
      sortOrder,
      filters
    })

    return NextResponse.json({ 
      data: result.data, 
      total: result.total 
    })
  } catch (error: unknown) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

