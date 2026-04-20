import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { RoleService } from '@/services/RoleService'
import { z } from 'zod'

const CreateRoleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  teamId: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
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

    const result = await RoleService.findAllWithRBAC(session.user.id, {
      page,
      pageSize,
      sortBy,
      sortOrder,
      query,
      filters
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Roles GET Error:', error)
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
    const validatedData = CreateRoleSchema.parse(body)

    const role = await RoleService.createWithRBAC(session.user.id, validatedData as any)

    return NextResponse.json({ data: role }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
    }
    console.error('Roles POST Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
