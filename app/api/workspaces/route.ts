import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { WorkspaceService } from '@/services/WorkspaceService'
import { z } from 'zod'

const CreateWorkspaceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  projectIds: z.array(z.string()).optional(),
})

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const query = searchParams.get('query') || searchParams.get('search') || undefined
    const sortBy = searchParams.get('sortBy') || undefined
    const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || undefined

    const mine = searchParams.get('mine') === 'true'
    const filters: Record<string, any> = {}
    searchParams.forEach((v, k) => {
      if (!['page', 'pageSize', 'query', 'search', 'sortBy', 'sortOrder', 'mine', 'isGlobal', 'scope'].includes(k)) {
        filters[k] = v
      }
    })

    if (mine) {
        filters.creatorId = session.user.id
    }

    const result = await WorkspaceService.findAllWithRBAC(session.user.id, {
      page,
      pageSize,
      sortBy,
      sortOrder,
      query,
      filters
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Workspaces GET Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = CreateWorkspaceSchema.parse(body)

    const workspace = await WorkspaceService.createWithRBAC(session.user.id, validatedData as any)

    return NextResponse.json({ data: workspace }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
    }
    console.error('Workspaces POST Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { ids } = z.object({ ids: z.array(z.string()) }).parse(body)

    await WorkspaceService.bulkDeleteWithRBAC(session.user.id, ids)

    return new NextResponse(null, { status: 204 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
    }
    console.error('Workspaces Bulk DELETE Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
