import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { DataSourceService } from '@/services/DataSourceService'
import { z } from 'zod'
import { DataSourceType } from '@prisma/client'

const UpdateDataSourceSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.nativeEnum(DataSourceType).optional(),
  isActive: z.boolean().optional(),
  jsonContent: z.any().optional().nullable(),
  content: z.string().optional().nullable(),
  fileUrl: z.string().optional().nullable(),
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
    const dataSource = await DataSourceService.findOneWithRBAC(session.user.id, id)

    if (!dataSource) {
      return NextResponse.json({ error: 'DataSource not found' }, { status: 404 })
    }

    return NextResponse.json({ data: dataSource })
  } catch (error: any) {
    console.error('DataSource GET Error:', error)
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
    const validatedData = UpdateDataSourceSchema.parse(body)

    const dataSource = await DataSourceService.updateWithRBAC(session.user.id, id, validatedData as any)

    return NextResponse.json({ data: dataSource })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
    }
    console.error('DataSource PATCH Error:', error)
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
    await DataSourceService.deleteWithRBAC(session.user.id, id)

    return new NextResponse(null, { status: 204 })
  } catch (error: any) {
    console.error('DataSource DELETE Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
