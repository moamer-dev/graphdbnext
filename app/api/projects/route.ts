import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { projectCrudService } from '@/services/crud'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '10')
  const search = searchParams.get('search') || undefined
  const sortBy = searchParams.get('sortBy') || undefined
  const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || undefined

  // Extract all other params as potential filters
  const filters: Record<string, any> = {}
  searchParams.forEach((value, key) => {
    if (!['page', 'pageSize', 'search', 'sortBy', 'sortOrder'].includes(key)) {
      if (value === 'null') filters[key] = null
      else filters[key] = value
    }
  })

  try {
    const result = await projectCrudService.findAll(session, {
      page,
      pageSize,
      search,
      sortBy,
      sortOrder,
      filters
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error fetching projects:', error)
    return NextResponse.json({ error: error.message || String(error) }, { status: 500 })
  }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 })
    }
  
    try {
      const body = await req.json()
      const { name, description, teamId } = body
  
      if (!name) {
        return new NextResponse('Name is required', { status: 400 })
      }
  
      const project = await prisma.project.create({
          data: {
              name,
              description,
              teamId: teamId || null,
              creatorId: session.user.id
          }
      })
  
      return NextResponse.json({ data: project })
    } catch (error) {
      console.error('Error creating project:', error)
      return new NextResponse('Internal Error', { status: 500 })
    }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 })

  try {
    const { ids } = await req.json()
    if (!ids || !Array.isArray(ids)) return new NextResponse('IDs are required', { status: 400 })

    await projectCrudService.deleteMany(session, ids)
    return new NextResponse(null, { status: 204 })
  } catch (error: any) {
    console.error('Error bulk deleting projects:', error)
    return new NextResponse(error.message || 'Internal Error', { status: 500 })
  }
}
