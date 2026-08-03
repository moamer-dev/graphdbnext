import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ModelService } from '@/services/ModelService'
import { z } from 'zod'

const CreateModelSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  workspaceId: z.string().optional().nullable(),
  schemaJson: z.any().optional().nullable(),
  schemaMd: z.string().optional().nullable(),
  version: z.string().optional(),
}).refine(data => data.schemaJson || data.schemaMd, {
  message: "Either schemaJson or schemaMd is required",
  path: ["schemaJson"]
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

    const filters: Record<string, any> = {}
    searchParams.forEach((v, k) => {
      if (!['page', 'pageSize', 'query', 'search', 'sortBy', 'sortOrder', 'scope', 'mine'].includes(k)) {
        filters[k] = v
      }
    })

    const result = await ModelService.findAllWithRBAC(session.user.id, {
      page,
      pageSize,
      sortBy,
      sortOrder,
      query,
      filters
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Models GET Error:', error)
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
    const validatedData = CreateModelSchema.parse(body)

    const model = await ModelService.createWithRBAC(session.user.id, validatedData as any)

    return NextResponse.json({ data: model }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
    }
    console.error('Models POST Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { ids } = await req.json()
    if (!ids || !Array.isArray(ids)) {
      return NextResponse.json({ error: 'IDs required for bulk delete' }, { status: 400 })
    }

    // Use loop for RBAC-safe bulk delete
    for (const id of ids) {
        await ModelService.deleteWithRBAC(session.user.id, id)
    }

    return new NextResponse(null, { status: 204 })
  } catch (error: any) {
    console.error('Models DELETE Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
