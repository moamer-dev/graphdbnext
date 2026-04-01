import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { workspaceCrudService } from '@/services/crud'

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
      filters[key] = value
    }
  })

  try {
    const result = await workspaceCrudService.findAll(session, {
      page,
      pageSize,
      search,
      sortBy,
      sortOrder,
      filters
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error fetching workspaces:', error)
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
      const { name, description, projectId } = body
  
      if (!name) {
        return new NextResponse('Name is required', { status: 400 })
      }
  
      const workspace = await prisma.workspace.create({
          data: {
              name,
              description,
              creatorId: session.user.id,
              ...(projectId ? {
                projects: {
                    create: {
                        projectId
                    }
                }
              } : {})
          }
      })
  
      return NextResponse.json({ data: workspace })
    } catch (error) {
      console.error('Error creating workspace:', error)
      return new NextResponse('Internal Error', { status: 500 })
    }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 })

  try {
    const { ids } = await req.json()
    if (!ids || !Array.isArray(ids)) return new NextResponse('IDs are required', { status: 400 })

    await workspaceCrudService.deleteMany(session, ids)
    return new NextResponse(null, { status: 204 })
  } catch (error: any) {
    console.error('Error bulk deleting workspaces:', error)
    return NextResponse.json({ error: error.message || String(error) }, { status: 500 })
  }
}
