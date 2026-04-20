import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { SavedQueryService } from '@/services/SavedQueryService'
import { z } from 'zod'
import { QuerySource } from '@prisma/client'

const CreateSavedQuerySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  query: z.string().min(1, 'Query is required'),
  category: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  source: z.nativeEnum(QuerySource).optional(),
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
      if (!['page', 'pageSize', 'query', 'search', 'sortBy', 'sortOrder'].includes(k)) {
        filters[k] = v
      }
    })

    const result = await SavedQueryService.findAllWithRBAC(session.user.id, {
      page,
      pageSize,
      sortBy,
      sortOrder,
      query,
      filters
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('SavedQueries GET Error:', error)
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
    const validatedData = CreateSavedQuerySchema.parse(body)

    const savedQuery = await SavedQueryService.createWithRBAC(session.user.id, validatedData as any)

    return NextResponse.json({ data: savedQuery }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
    }
    console.error('SavedQueries POST Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
