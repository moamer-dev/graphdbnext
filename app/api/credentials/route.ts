import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { CredentialService } from '@/services/CredentialService'
import { z } from 'zod'

const CreateCredentialSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  type: z.string().min(1, 'Type is required'),
  data: z.any(),
  workspaceId: z.string().optional().nullable(),
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

    const result = await CredentialService.findAllWithRBAC(session.user.id, {
      page,
      pageSize,
      sortBy,
      sortOrder,
      query,
      filters
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Credentials GET Error:', error)
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
    const validatedData = CreateCredentialSchema.parse(body)

    const credential = await CredentialService.createWithRBAC(session.user.id, validatedData as any)

    return NextResponse.json({ data: credential }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
    }
    console.error('Credentials POST Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
