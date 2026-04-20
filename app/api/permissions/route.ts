import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PermissionService } from '@/services/PermissionService'
import { z } from 'zod'
import { PermissionResource, PermissionAction, PermissionScope } from '@prisma/client'

const CreatePermissionSchema = z.object({
  roleId: z.string().min(1, 'roleId is required'),
  resource: z.nativeEnum(PermissionResource),
  action: z.nativeEnum(PermissionAction),
  scope: z.nativeEnum(PermissionScope).default('SELF'),
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
    const sortBy = searchParams.get('sortBy') || undefined
    const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || undefined

    const filters: Record<string, any> = {}
    searchParams.forEach((v, k) => {
      if (!['page', 'pageSize', 'sortBy', 'sortOrder'].includes(k)) {
        filters[k] = v
      }
    })

    const result = await PermissionService.findAllWithRBAC(session.user.id, {
      page,
      pageSize,
      sortBy,
      sortOrder,
      filters
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Permissions GET Error:', error)
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
    const validatedData = CreatePermissionSchema.parse(body)

    const permission = await PermissionService.createWithRBAC(session.user.id, validatedData as any)

    return NextResponse.json({ data: permission }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
    }
    console.error('Permissions POST Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
