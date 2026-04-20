import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { StorageConfigService } from '@/services/StorageConfigService'
import { z } from 'zod'

const CreateStorageConfigSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['DATABASE', 'EXTERNAL_S3', 'LOCAL_FS']),
  config: z.any(),
  isDefault: z.boolean().optional(),
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
    const query = searchParams.get('query') || undefined
    const sortBy = searchParams.get('sortBy') || undefined
    const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || undefined

    const result = await StorageConfigService.findAllWithRBAC(session.user.id, {
      page,
      pageSize,
      sortBy,
      sortOrder,
      query
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('StorageConfigs GET Error:', error)
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
    const validatedData = CreateStorageConfigSchema.parse(body)

    const config = await StorageConfigService.createWithRBAC(session.user.id, validatedData as any)

    return NextResponse.json({ data: config }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
    }
    console.error('StorageConfigs POST Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
