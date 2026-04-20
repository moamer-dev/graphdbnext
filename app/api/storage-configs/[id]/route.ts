import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { StorageConfigService } from '@/services/StorageConfigService'
import { z } from 'zod'

const UpdateStorageConfigSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(['DATABASE', 'EXTERNAL_S3', 'LOCAL_FS']).optional(),
  config: z.any().optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
})

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const config = await StorageConfigService.findOneWithRBAC(session.user.id, id)

    if (!config) {
      return NextResponse.json({ error: 'Storage config not found' }, { status: 404 })
    }

    return NextResponse.json({ data: config })
  } catch (error: any) {
    console.error('StorageConfig GET Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const validatedData = UpdateStorageConfigSchema.parse(body)

    const config = await StorageConfigService.updateWithRBAC(session.user.id, id, validatedData as any)

    return NextResponse.json({ data: config })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
    }
    console.error('StorageConfig PATCH Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    await StorageConfigService.deleteWithRBAC(session.user.id, id)

    return new NextResponse(null, { status: 204 })
  } catch (error: any) {
    console.error('StorageConfig DELETE Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
