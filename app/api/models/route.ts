import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { modelCrudService } from '@/lib/services'

// GET /api/models - Get all models (admins see all, users see only their own)
export async function GET (request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10)
    const sortBy = searchParams.get('sortBy') || 'updatedAt'
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'
    
    // Build filters from query params - extract all params except pagination/sorting
    const filters: Record<string, unknown> = { isActive: true }
    const excludeParams = ['page', 'pageSize', 'sortBy', 'sortOrder', 'search']
    
    searchParams.forEach((value, key) => {
      if (!excludeParams.includes(key) && value) {
        filters[key] = value
      }
    })

    // Use CrudService for consistent RBAC and pagination
    const result = await modelCrudService.findAll(session, {
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
    console.error('Error fetching models:', error)
    return NextResponse.json(
      { error: 'Failed to fetch models' },
      { status: 500 }
    )
  }
}

// POST /api/models - Create a new model
export async function POST (request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, description, schemaJson, schemaMd, version } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Model name is required' },
        { status: 400 }
      )
    }

    if (!schemaJson && !schemaMd) {
      return NextResponse.json(
        { error: 'Either schemaJson or schemaMd is required' },
        { status: 400 }
      )
    }

    // Use CrudService for consistent creation with RBAC
    const model = await modelCrudService.create(session, {
      name,
      description: description || null,
      schemaJson: schemaJson || null,
      schemaMd: schemaMd || null,
      version: version || '1.0'
    })

    // Return in the format expected by useResource hook: { data: model }
    return NextResponse.json({ data: model }, { status: 201 })
  } catch (error: unknown) {
    console.error('Error creating model:', error)
    return NextResponse.json(
      { error: 'Failed to create model' },
      { status: 500 }
    )
  }
}
