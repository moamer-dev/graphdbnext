import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { savedQueryCrudService } from '@/lib/services'

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
    const pageSize = parseInt(searchParams.get('pageSize') || '50', 10)
    const sortBy = searchParams.get('sortBy') || 'updatedAt'
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'
    const search = searchParams.get('search') || undefined
    
    // Build filters from query params - extract all params except pagination/sorting/search
    const filters: Record<string, unknown> = {}
    const excludeParams = ['page', 'pageSize', 'sortBy', 'sortOrder', 'search']
    
    searchParams.forEach((value, key) => {
      if (!excludeParams.includes(key) && value && value !== 'all') {
        filters[key] = value
      }
    })

    const result = await savedQueryCrudService.findAll(session, {
      page,
      pageSize,
      sortBy,
      sortOrder,
      filters,
      search // Pass search to CrudService which will search across searchableFields
    })

    return NextResponse.json({ 
      data: result.data, 
      total: result.total 
    })
  } catch (error: unknown) {
    console.error('Error fetching queries:', error)
    return NextResponse.json(
      { error: 'Failed to fetch queries' },
      { status: 500 }
    )
  }
}

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
    const query = await savedQueryCrudService.create(session, {
      name: body.name,
      description: body.description || null,
      query: body.query,
      category: body.category || null,
      tags: body.tags || [],
      source: body.source || 'CYPHER'
    })

    return NextResponse.json({ query })
  } catch (error: unknown) {
    console.error('Error creating query:', error)
    return NextResponse.json(
      { error: 'Failed to create query' },
      { status: 500 }
    )
  }
}

