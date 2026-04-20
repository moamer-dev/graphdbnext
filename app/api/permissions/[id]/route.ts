import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PermissionService } from '@/services/PermissionService'
import { z } from 'zod'
import { PermissionResource, PermissionAction, PermissionScope } from '@prisma/client'

const UpdatePermissionSchema = z.object({
  resource: z.nativeEnum(PermissionResource).optional(),
  action: z.nativeEnum(PermissionAction).optional(),
  scope: z.nativeEnum(PermissionScope).optional(),
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
    const permission = await PermissionService.findOneWithRBAC(session.user.id, id)

    if (!permission) {
      return NextResponse.json({ error: 'Permission not found' }, { status: 404 })
    }

    return NextResponse.json({ data: permission })
  } catch (error: any) {
    console.error('Permission GET Error:', error)
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
    const validatedData = UpdatePermissionSchema.parse(body)

    const permission = await PermissionService.updateWithRBAC(session.user.id, id, validatedData as any)

    return NextResponse.json({ data: permission })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
    }
    console.error('Permission PATCH Error:', error)
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
    await PermissionService.deleteWithRBAC(session.user.id, id)

    return new NextResponse(null, { status: 204 })
  } catch (error: any) {
    console.error('Permission DELETE Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
